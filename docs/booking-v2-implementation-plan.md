# Booking v2 實作計畫：LINE 聯絡、Google Calendar、自動提醒

> 建立日期：2026-07-27  
> 執行對象：後續 Codex session  
> 專案根目錄：`C:\Users\jackyk\Desktop\20260411\購物網站`

## 0. 給下一個 session 的執行指令

請先完整閱讀本文件，再檢查目前工作樹與正式部署狀態後開始實作。

必要原則：

1. **保留現有預約表單的全部欄位、必填規則與四步驟流程。**
2. 不移除姓名、電話、Email、生年月日、IG 帳號、LINE 名稱、備註、匯款末五碼或匯款截圖確認。
3. 客戶端只允許增加「條件式 LINE 加好友按鈕」與「前往官方 LINE 傳截圖按鈕」，不得增加新的文字輸入欄位。
4. Google Calendar 與前一天提醒必須在後台自動完成，不得要求客戶多填資料。
5. 已是官方 LINE 好友的客戶，預約流程應幾乎不變。
6. 不在本次範圍內重做整體視覺、不改定價、不改時段、不改付款規則。
7. 保留現有工作樹中與本需求無關的修改，不得覆寫、清除或順手整理。
8. 實作後需同步更新測試清單與 `PROGRESS.md`，但不要宣稱尚未完成的 LINE Console、Apps Script 部署或 Trigger 設定已完成。

主要修改檔案：

- `feifei-ecommerce/landing-page/booking.html`
- `feifei-ecommerce/booking-backend/Code.gs`
- `docs/booking-test-checklist.html`
- `PROGRESS.md`

除非真的需要 LINE webhook 自動對帳，否則本次**不要修改** `feifei-ecommerce/line-bot/`。

---

## 1. 業主提出的三個問題

### 問題一：客人沒有傳過訊息，助理預約後找不到人

目前前端會嘗試取得 LIFF `userId`，但一般瀏覽器或未登入時會降級成空值並繼續預約；此外，LINE 顯示名稱是可手填欄位，不能可靠綁定官方 LINE 聊天。

目標：

- 背景取得並儲存經 LINE 驗證的 UID。
- 未加好友者只在按下現有「送出預約」時看到一次 LINE 原生加好友提示。
- 成功頁提供明確的「前往官方 LINE 傳匯款截圖」按鈕。
- 按鈕帶入預約編號與固定訊息，客戶不用自行輸入預約資料。
- 客戶實際送出訊息及截圖後，助理的官方 LINE 聊天列表即可看到該客戶。

### 問題二：客人預約後，Google Calendar 自動更新

目前只有單向同步：

```text
Google Calendar 行程 → 網站時段顯示為不開放
```

目標改成：

```text
網站新預約 → Calendar 建立「待確認」事件
Sheet 改成已確認 → Calendar 更新為「已確認」
Sheet 改成已取消 → Calendar 刪除事件並釋放時段
```

### 問題三：官方 LINE 在預約前一天提醒客人

目標：

- 定時掃描隔日「已確認」預約。
- 每筆只發送一次 LINE 提醒。
- 寫入提醒時間，避免 Trigger 重跑造成重複訊息。
- LINE UID 缺失或推播發生可判斷的錯誤時，使用既有 Email 作備援。

---

## 2. 明確不做的事

本次不處理：

- 不刪除或改成選填任何既有欄位。
- 不新增「預約人再填一次 LINE UID／預約編號」等欄位。
- 不重做品牌視覺、Hero、配色或字體。
- 不改目前線上視訊、NT$3,800、匯款末五碼與傳截圖流程。
- 不實作購物車、金流串接、圖片上傳到 Google Drive。
- 不加入客戶 Google Calendar 邀請；本次 Calendar 指非非／助理內部日曆。
- 不實作自動改期。
- 不實作預約時段暫時保留。
- 不把聊天 webhook、自動解析圖片或自動對帳擴入本次。

---

## 3. 現況基線

### 前端

檔案：`feifei-ecommerce/landing-page/booking.html`

目前已有：

- LIFF SDK `edge/2`
- LIFF ID：`2009821980-46y6BEMh`
- `liff.init()` 與 `liff.getProfile()`
- 自動帶入 LINE 顯示名稱
- `lineUid` 隨預約資料送出
- 成功頁的文字版「傳匯款截圖」提醒

目前缺口：

- 未登入時不會呼叫 `liff.login()`。
- 沒有 `liff.getFriendship()`。
- 沒有 `liff.requestFriendship()`。
- 一般瀏覽器仍可用空 UID 送出。
- 成功頁沒有可點擊的官方 LINE 聊天按鈕。
- 後端目前信任前端直接傳來的 `lineUid`，存在 UID 被偽造的風險。
- 成功回應沒有預約編號可供聊天匹配。

重要函式／區塊：

- `CONFIG`：約第 391 行
- LIFF 初始化：約第 408 行
- `showConfirm()`：約第 762 行
- `submitBooking()`：約第 836 行
- `showSuccess()`：約第 930 行
- 成功頁 HTML：約第 343 行

### Apps Script 後端

檔案：`feifei-ecommerce/booking-backend/Code.gs`

目前已有：

- 私人 Sheet 預約資料
- 公開 Sheet 時段狀態
- 防重複時段與 Script Lock
- 助理 Email
- 客戶確認／取消 Email
- LINE 已收到／已確認／已取消推播
- Calendar 事件讀取與網站時段 block
- `checkStatusChanges()` 狀態輪詢

目前缺口：

- 沒有建立 Calendar 事件。
- 沒有儲存 Calendar Event ID。
- 沒有前一天提醒函式。
- 沒有提醒去重欄位。
- `sendLinePush()` 只寫 Logger，沒有把成功／失敗結果回傳給呼叫端。
- `doPost()` 回應沒有 booking ID。
- 沒有驗證 LIFF ID token。

重要函式：

- `initSheet()`：約第 39 行
- `getCalendarBlocks()`：約第 138 行
- `doGet()`：約第 391 行
- `doPost()`：約第 406 行
- `checkStatusChanges()`：約第 596 行
- `sendLinePush()`：約第 741 行

### 正式端已知狀態

2026-07-27 讀取正式 Apps Script `doGet()` 回應：

```json
{
  "version": "BOOKING-v6-2026-05-05-add-linename",
  "hasLinePush": true,
  "hasLineReceived": true,
  "tokenSet": true,
  "liffId": "2009821980-46y6BEMh"
}
```

這只能確認正式端有 LINE 函式與 Token，**不能證明**：

- LINE Login channel 已連結正確的官方帳號。
- LIFF view size 是 `Full`。
- LIFF scopes 包含 `openid`、`profile`。
- `checkStatusChanges` Trigger 已存在。
- 2026-07-23 的最新時段後端已重新部署。

執行 session 必須重新核對，不得根據版本字串自行假設。

---

## 4. 目標客戶體驗

### 已是官方 LINE 好友

```text
照原本流程填完全部資料
→ 按原本「送出預約」
→ 直接送出
→ 成功頁按「前往官方 LINE 傳匯款截圖」
→ LINE 聊天已帶入預約編號與固定訊息
→ 客戶選擇截圖並送出
```

除成功頁按鈕外，不增加任何步驟。

### 尚未加官方 LINE 好友

```text
照原本流程填完全部資料
→ 送出按鈕顯示「加入官方 LINE 並送出預約」
→ 點擊後開啟 LINE 原生加好友提示
→ 加入成功後自動繼續送出
→ 成功頁按「前往官方 LINE 傳匯款截圖」
```

唯一新增動作是一次原生加好友確認。

### 從一般瀏覽器開啟、尚未登入 LINE

```text
照原本流程填完
→ 點送出
→ 將現有表單狀態暫存在 sessionStorage
→ 進行 LINE Login
→ 回到同一頁並恢復原有資料及步驟
→ 完成好友檢查後送出
```

要求：

- 不得讓客戶重新填寫。
- 只使用 `sessionStorage`，不要用長期保存個資的 `localStorage`。
- 暫存資料設定 30 分鐘有效期。
- 預約成功後立即清除。

---

## 5. Sheet 資料模型

保留目前 1–15 欄不動，只在尾端新增：

| 欄 | 表頭 | 用途 |
|---|---|---|
| 16 / P | 預約編號 | 成功頁、LINE 訊息、Calendar 對應 |
| 17 / Q | Calendar Event ID | 更新／刪除同一事件，避免重複 |
| 18 / R | 提醒時間 | 非空即代表前一天提醒已送出 |
| 19 / S | LINE 好友狀態 | `已確認好友`、`未確認`、`LIFF錯誤` 等營運資訊 |

注意：

- 新欄位只能 append 在尾端，避免破壞目前大量硬編碼欄位索引。
- 新增 idempotent migration：`migrateBookingAutomationColumns()`。
- `initSheet()` 同步改成 19 欄，但 migration 不得清除既有資料。
- 公開 Sheet 維持日期／時段／狀態三欄，不得公開以上資料。

### 預約編號格式

建議：

```text
F768-260727-A1B2
```

要求：

- 後端產生，不由前端產生。
- 使用日期加 UUID／隨機片段。
- 同一筆預約在所有通知與 Calendar 使用同一編號。
- 不將姓名、電話或生日編碼進編號。

---

## 6. Phase 0：實作前檢查

- [ ] 執行 `git status --short`，確認目標檔案是否乾淨。
- [ ] 讀取正式 Apps Script `doGet()`。
- [ ] 確認前後端時段皆為 `10:30 / 11:30 / 14:30 / 15:30 / 16:30`。
- [ ] 確認 `TUESDAY_EXTRA_SLOTS` 仍為空陣列。
- [ ] 確認 `CALENDAR_ID` 指向業主希望使用的日曆。
- [ ] 確認 Apps Script 擁有者對該 Calendar 有寫入權限。
- [ ] 確認 LINE Login channel 與 Messaging API 官方帳號位於同一 Provider。
- [ ] 取得官方 LINE 的 Basic ID 或可直接開啟一對一聊天的官方 URL。
- [ ] 不得猜測或自行發明官方 LINE URL。
- [ ] 在更動 schema 前，請業主先複製一份 Google Sheet 備份。

若缺少官方 LINE 聊天 URL：

- 前後端其他部分可先完成。
- 成功頁按鈕保留清楚的 config placeholder。
- 不可把錯誤連結部署到正式站。
- 在交付報告中列為唯一明確 blocker。

---

## 7. Phase 1：LINE 身分與低摩擦聯絡

### 7.1 LINE Console 設定

需要確認：

- LIFF app view size：`Full`
- Scopes：
  - `openid`
  - `profile`
- Linked LINE Official Account：正確的非非官方帳號
- Add friend option：啟用
- Endpoint URL：`https://myfeifei768.com.tw/booking.html`

本次不需要 `chat_message.write`，因為成功頁應直接開啟指定的官方帳號聊天，避免 LIFF 從其他聊天室分享進來時把預約訊息送到錯誤對象。

### 7.2 前端 LIFF 狀態

新增明確狀態：

```js
let lineUid = null;
let lineIdToken = null;
let lineFriendFlag = false;
let lineProfile = null;
let liffInitError = null;
let liffReadyPromise = null;
```

將立即執行的 LIFF IIFE 整理成可等待的初始化 Promise：

```js
liffReadyPromise = initLiff();
```

`initLiff()` 負責：

1. `liff.init({ liffId })`
2. 已登入時取得：
   - `liff.getProfile()`
   - `liff.getIDToken()`
   - `liff.getFriendship()`
3. 繼續沿用目前自動帶入 LINE 顯示名稱的行為。
4. 不覆蓋客戶已經手動修改過的 LINE 名稱。
5. 初始化失敗要留下狀態，不能只寫 console。

### 7.3 不新增頁面欄位

不得新增：

- LINE UID 欄位
- LINE Login token 欄位
- 好友狀態 checkbox
- 預約編號輸入欄

可以新增：

- 送出按鈕下方一行短狀態文字，例如：
  - `已連結 LINE，可接收預約提醒`
  - `送出時將請您加入官方 LINE，以接收通知`

此狀態不得變成新的阻塞頁面。

### 7.4 送出按鈕行為

在 `submitBooking()` 寫入 `isSubmitting = true` 前，先執行：

```text
await ensureLineReadyForBooking()
```

行為：

1. 等待 `liffReadyPromise`。
2. 未登入：
   - 將 selected date/time、目前 step、所有表單值、checkbox 狀態寫入 `sessionStorage`。
   - 寫入時間戳與 schema version。
   - 呼叫 `liff.login()`。
3. 已登入但不是好友：
   - 由客戶點擊送出按鈕的同一個 user gesture 呼叫 `liff.requestFriendship()`。
   - 完成後再次呼叫 `liff.getFriendship()`。
   - 若仍不是好友，顯示簡短訊息並保持所有資料，不可清空或跳回第一步。
4. 已登入且是好友：
   - 取得 ID token。
   - 繼續既有 POST。

按鈕文案：

- 好友或尚未確認狀態：保留 `送出預約`
- 確認非好友後：`加入官方 LINE 並送出預約`
- 送出中：保留現有 `送出中...`

### 7.5 表單狀態暫存與恢復

新增：

- `saveBookingDraftForLineLogin()`
- `restoreBookingDraftAfterLineLogin()`
- `clearBookingDraft()`

需保存：

- `selectedDate`
- `selectedTime`
- 目前 step
- 所有既有 input／textarea 值
- `field-agree`
- `field-proof`
- 建立時間
- draft schema version

安全要求：

- 只用 `sessionStorage`。
- 30 分鐘後視為過期並清除。
- 不將 ID token 寫入 storage。
- 成功、取消或 draft 過期時清除。
- 恢復後重新抓取已預約時段；最終仍以後端防撞為準。

### 7.6 後端驗證 ID token

前端 POST 新增：

```json
{
  "lineIdToken": "...",
  "lineFriendFlag": true
}
```

不要再把前端 `lineUid` 當可信來源。

後端新增：

- Script Property：`LINE_LOGIN_CHANNEL_ID`
- `verifyLineIdToken(idToken)`

驗證流程：

1. 對 LINE 官方 ID token verify endpoint 發送 `id_token` 與 `client_id`。
2. 確認 HTTP 200。
3. 確認回傳 `aud` 等於設定的 LINE Login Channel ID。
4. 取得 `sub` 作為真正 `lineUid`。
5. 驗證失敗時回傳清楚的 `LINE_AUTH_REQUIRED`，不得接受前端任意 UID。

後端成功驗證後：

```js
data.lineUid = verifiedToken.sub;
```

既有 `sendLineBookingReceived(data)`、Sheet 第 10 欄與後續確認／取消推播繼續使用此 UID。

`lineFriendFlag` 只作為營運狀態寫入 Sheet，不作為安全驗證依據。

### 7.7 成功頁官方 LINE 按鈕

在既有成功頁的「最後一步：傳匯款截圖」區塊加入主要按鈕：

```text
前往官方 LINE 傳匯款截圖
```

按鈕動作：

1. 使用**指定的官方帳號聊天 URL**，不可使用目前 LIFF context 的不明聊天室。
2. 帶入固定訊息：

```text
您好，我已完成非非768預約。
預約編號：F768-260727-A1B2
預約日期：2026/07/30
預約時段：14:30
接著傳送匯款截圖，謝謝。
```

3. 客戶只需要選擇匯款截圖並送出。
4. 按鈕旁保留目前的文字說明。
5. 不刪除既有 `field-proof` checkbox。

若 LINE 官方訊息連結無法可靠預填：

- 顯示 booking ID。
- 點擊按鈕時先嘗試複製固定訊息，再開啟官方聊天。
- 在 iOS LINE、Android LINE、Safari、Chrome 實機測試。

### 7.8 後端回應

成功回應改成：

```json
{
  "success": true,
  "bookingId": "F768-260727-A1B2",
  "lineConnected": true,
  "warnings": []
}
```

前端需把 `bookingId` 傳給 `showSuccess()`，並顯示於成功頁及 LINE 按鈕訊息。

---

## 8. Phase 2：Google Calendar 自動同步

### 8.1 建立待確認事件

在 `doPost()` 成功 append Sheet row 後：

1. 先記住實際 Sheet row number。
2. 在 Script Lock 外呼叫 `createPendingCalendarEvent(booking)`，避免長時間占鎖。
3. 建立成功後，將 Event ID 寫入第 17 欄。
4. Calendar 失敗不得讓已寫入的預約回傳失敗；加入：

```text
calendar_event_failed
```

至 warnings。

事件規格：

- 開始：預約日期＋時段
- 結束：開始後 60 分鐘
- 時區：Asia/Taipei
- 標題：

```text
【待確認】王小姐｜線上諮詢
```

- 描述只放：
  - 預約編號
  - 姓名
  - 電話
  - IG 帳號
  - 匯款末五碼
  - Sheet 管理提醒

不得放：

- 生年月日
- 諮詢備註全文
- LINE UID

### 8.2 已確認更新

擴充 `checkStatusChanges()`：

- 狀態為 `已確認` 且尚未寫入確認時間時：
  1. 維持現有 Email。
  2. 維持現有 LINE 確認通知。
  3. 讀取第 17 欄 Event ID。
  4. 將標題改為：

```text
【已確認】王小姐｜線上諮詢
```

  5. 更新 description 的狀態。
  6. Event 不存在時重建，並回寫新 ID。

Calendar 更新失敗時：

- 不得阻止 Email／LINE 通知。
- Logger 記錄 booking ID、row 與錯誤。
- 不要錯誤地把 Event ID 清空，除非已確認事件真的不存在。

### 8.3 已取消刪除

在目前 `已取消` 分支：

1. 維持取消 Email 與 LINE。
2. 依 Event ID 找到 Calendar event。
3. 呼叫刪除事件，讓時段真正釋放。
4. 成功後將第 17 欄改成：

```text
已刪除 <timestamp>
```

或另以明確 marker 表示，不要留下可被再次誤用的 event ID。

若 Event 已不存在，視為 idempotent success。

### 8.4 修復函式

新增管理用函式：

```text
backfillMissingCalendarEvents()
```

用途：

- 掃描未取消、未完成且 Event ID 空白的預約。
- 建立缺失事件。
- 可在 Calendar 暫時失敗後手動補回。
- 執行前 Logger 列出預計處理數量。
- 不重建已有有效 Event ID 的事件。

### 8.5 與現有 block 同步相容

現有 `getCalendarBlocks()` 會讀到新建立的預約事件。

要求：

- `syncPublicSheet()` 目前的日期／時段去重邏輯必須保留。
- 同一預約同時存在 Sheet 與 Calendar 時，公開 Sheet 只能有一個 block。
- 取消刪除 Calendar event 後，Sheet 狀態 `已取消` 也不應進公開時段。

---

## 9. Phase 3：前一天 LINE 提醒

### 9.1 改造 sendLinePush

目前 `sendLinePush()` 只 Logger，不將結果回傳。

改成回傳結構：

```js
{
  ok: true,
  status: 200,
  body: ""
}
```

失敗：

```js
{
  ok: false,
  status: 401,
  error: "..."
}
```

要求：

- Token 缺失回傳 `ok: false`。
- 非 200 回傳 `ok: false`。
- fetch exception 回傳 `ok: false`。
- 不在 Logger 印出 access token。
- 現有已收到／已確認／已取消函式要適配新回傳值。

注意 LINE 的限制：

- 被封鎖或非好友時，Messaging API 可能回 200 但使用者實際收不到。
- 本次靠送出前的 `getFriendship()` 大幅降低此情形。
- 不得在文件或 UI 宣稱提醒「保證送達」。

### 9.2 提醒函式

新增：

```text
sendTomorrowBookingReminders()
```

篩選條件：

- 狀態為 `已確認`
- 預約日期是 Asia/Taipei 時區的明天
- 第 18 欄提醒時間為空
- LINE UID 不為空

推播文案至少包含：

- 非非768 療癒系問事
- 客戶姓名
- 預約日期
- 預約時段
- 線上視訊
- 如需更改請聯繫官方 LINE

不得包含：

- 生年月日
- 諮詢備註
- 匯款末五碼

成功後：

- 第 18 欄寫入實際送出時間。

失敗後：

- 不寫提醒時間，讓下次 Trigger 可重試。
- Logger 記錄 booking ID、row、HTTP status。
- 若 UID 空白或可判斷的推播失敗，呼叫 `sendBookingReminderEmail()` 作備援。
- Email 備援成功後，在第 18 欄記錄：

```text
Email備援 <timestamp>
```

避免每次 Trigger 重複寄信。

### 9.3 時區與日期

- Apps Script Project Settings timezone 必須是 `Asia/Taipei`。
- 日期比較使用 `Utilities.formatDate(..., 'Asia/Taipei', 'yyyy-MM-dd')`。
- 不用伺服器預設 UTC 直接比較 Sheet 日期。
- 測試月底、年底與夏令時間無關但跨日的情境。

### 9.4 Trigger

新增 idempotent 管理函式：

```text
installBookingTriggers()
```

目標 Trigger：

- `checkStatusChanges`：每 5 分鐘
- `sendTomorrowBookingReminders`：每天約 18:00 執行

要求：

- 建立前先檢查同 handler 是否已有 Trigger。
- 不得每次執行都新增重複 Trigger。
- 不要刪除其他無關 Trigger。
- Logger 回報「已存在」或「已建立」。

另新增：

```text
listBookingTriggers()
```

供部署後確認，不修改狀態。

Google time-driven trigger 可能在指定時段內稍微浮動，所以產品文案只寫「預約前一天提醒」，不要承諾 18:00 整。

---

## 10. Phase 4：版本、診斷與文件

### 10.1 後端版本

將 `doGet()` 版本更新，例如：

```text
BOOKING-v7-2026-07-27-line-calendar-reminder
```

可安全加入非敏感診斷：

```json
{
  "hasCalendarCreate": true,
  "hasTomorrowReminder": true,
  "timeSlots": ["10:30", "11:30", "14:30", "15:30", "16:30"]
}
```

不得公開：

- Calendar ID
- Sheet ID
- LINE access token
- 客戶資料

### 10.2 測試清單

更新：

- `docs/booking-test-checklist.html`

若專案仍維護 PDF，再重新產生：

- `docs/booking-test-checklist.pdf`

不得只改 HTML 卻宣稱 PDF 已同步。

### 10.3 進度文件

更新 `PROGRESS.md`：

- 記錄實作內容。
- GitHub 程式完成、Apps Script 部署、LINE Console 設定、Trigger 設定分別標示。
- 尚未實際完成者一律用 `⬜ 待執行` 或 `🟡 待驗證`。

---

## 11. 測試矩陣

### 11.1 既有表單回歸

- [ ] 所有原有欄位仍存在。
- [ ] 所有原有 required 規則不變。
- [ ] 生年月日民國格式仍可送出。
- [ ] IG 帳號前置 `@` 處理不變。
- [ ] 匯款末五碼仍需 5 碼。
- [ ] `field-agree` 與 `field-proof` gate 不變。
- [ ] 日期、時段與四步驟流程不變。
- [ ] SLOT_TAKEN、RATE_LIMITED、VALIDATION_ERROR 行為不退化。

### 11.2 LINE 好友情境

- [ ] 已登入＋已是好友：不顯示額外 modal，直接送出。
- [ ] 已登入＋不是好友：只在送出時顯示原生加好友提示。
- [ ] 接受加好友：重新檢查成功後送出。
- [ ] 取消加好友：保留所有已填資料與 Step 4。
- [ ] 重新按送出可以再次完成，不會卡在 `isSubmitting`。
- [ ] LINE 顯示名稱仍自動帶入且可修改。
- [ ] Sheet 第 10 欄是後端驗證後的 UID。
- [ ] Sheet 第 19 欄記錄好友狀態。

### 11.3 一般瀏覽器

- [ ] 未登入 LINE 時，送出前暫存表單。
- [ ] Login redirect 返回後恢復日期、時段、欄位與 checkbox。
- [ ] 不需要重新輸入。
- [ ] draft 超過 30 分鐘會清除。
- [ ] 預約成功後 draft 會清除。
- [ ] sessionStorage 中沒有 ID token。

### 11.4 官方 LINE 聊天按鈕

- [ ] 成功頁顯示 booking ID。
- [ ] 按鈕只開啟非非官方帳號，不會送到來源聊天室。
- [ ] 固定訊息包含 booking ID、日期、時段。
- [ ] 客戶不需重新輸入預約資料。
- [ ] iOS LINE 實機測試。
- [ ] Android LINE 實機測試。
- [ ] Safari／Chrome fallback 測試。
- [ ] 客戶可以接續選擇並傳送匯款截圖。

### 11.5 Calendar

- [ ] 新預約只建立一個待確認事件。
- [ ] Calendar 時區與預約頁一致。
- [ ] 事件長度 60 分鐘。
- [ ] Event ID 正確寫入 Sheet。
- [ ] 已確認更新同一事件，不建立第二個。
- [ ] 已取消刪除事件並釋放網站時段。
- [ ] Event 被人工刪除後，確認流程可安全重建。
- [ ] Calendar API 失敗時預約仍成功且有 warning。
- [ ] `backfillMissingCalendarEvents()` 不重複建立。
- [ ] 公開時段 Sheet 沒有重複 block。

### 11.6 提醒

- [ ] 只有明日＋已確認會提醒。
- [ ] 待確認、已取消、已完成不提醒。
- [ ] 同一筆 Trigger 重跑只發一次。
- [ ] LINE 成功後寫入提醒時間。
- [ ] LINE 非 200 時不誤寫成功時間。
- [ ] UID 空白或可判斷失敗時 Email 備援一次。
- [ ] 文案不含生日、備註或末五碼。
- [ ] 月底與年底跨日測試。

### 11.7 通知回歸

- [ ] 新預約助理 Email 正常。
- [ ] 新預約 LINE 已收到通知正常。
- [ ] 已確認 Email 正常。
- [ ] 已確認 LINE 正常。
- [ ] 已取消 Email 正常。
- [ ] 已取消 LINE 正常。
- [ ] Calendar／提醒錯誤不影響上述既有通知。

---

## 12. 驗收標準

全部成立才可標示完成：

1. 原本所有客戶填寫欄位與必填規則完整保留。
2. 已是好友的客戶除成功頁按鈕外，不增加可感知步驟。
3. 非好友最多增加一次 LINE 原生加好友確認。
4. 一般瀏覽器進 LINE Login 後不需重填表單。
5. 正常預約的 LINE UID 由後端驗證產生，而非信任前端 raw UID。
6. 成功頁能一鍵進入正確的官方 LINE，並帶入 booking ID／日期／時段。
7. 新預約自動建立 Calendar 待確認事件。
8. 確認與取消會更新同一 Calendar event。
9. 已確認預約在前一天收到一次 LINE 提醒。
10. 提醒 Trigger 重跑不會重複推播。
11. 任一 LINE／Calendar 非關鍵操作失敗，不會造成「Sheet 已寫入但客戶看到預約失敗」的舊問題復發。
12. 正式 `doGet()` 顯示 v7 版本與新功能診斷。
13. 至少用兩個 LINE 帳號完成「已是好友／尚未加好友」端到端測試。
14. `PROGRESS.md` 正確區分程式完成、部署完成與實機驗證完成。

---

## 13. 建議實作順序與 commit

建議拆成可審查的 commit：

1. `feat: booking 加入 LIFF 好友確認與表單狀態恢復`
2. `feat: booking 後端驗證 LINE ID token 與產生預約編號`
3. `feat: booking 成功頁加入官方 LINE 傳截圖按鈕`
4. `feat: booking 自動建立與同步 Google Calendar 事件`
5. `feat: booking 加入前一天 LINE 提醒與去重`
6. `docs: 更新 booking 測試清單與部署說明`

不要把無關的現有 dirty worktree 修改混入 commit。

---

## 14. 部署順序

### 14.1 準備

1. 備份私人預約 Sheet。
2. 確認 Calendar 寫入權限。
3. 取得官方 LINE Basic ID／聊天 URL。
4. 完成 LINE Console linked OA、Full view、scopes。
5. 設定 Script Property：
   - `LINE_CHANNEL_ACCESS_TOKEN`（既有）
   - `LINE_LOGIN_CHANNEL_ID`（新增）

### 14.2 後端先部署

1. 將新 `Code.gs` 貼入 Apps Script。
2. 執行 `migrateBookingAutomationColumns()`。
3. 檢查新表頭 P–S，不得影響既有資料。
4. 執行 Calendar 測試函式。
5. 執行 LINE ID token／push 測試。
6. 執行 `installBookingTriggers()`。
7. 執行 `listBookingTriggers()` 確認。
8. 建立 Apps Script 新版本並更新現有 Web App deployment。
9. 打開正式 `doGet()`，確認 v7 與時段。

### 14.3 前端後部署

1. 更新 `booking.html` config 的官方 LINE URL。
2. 本地語法／流程檢查。
3. commit 並 push GitHub Pages。
4. 等待 GitHub Pages 部署完成。
5. 清除快取或使用無痕視窗檢查正式頁。

### 14.4 端到端

依序測試：

1. 已是好友帳號。
2. 尚未加好友帳號。
3. 一般瀏覽器未登入帳號。
4. Sheet 狀態改成已確認。
5. Calendar 更新。
6. 測試用「明日預約」提醒。
7. 取消後 Calendar 刪除與網站時段釋放。

---

## 15. 回復與故障處理

若正式環境出現問題：

- 前端：部署前一個已知正常的 GitHub commit。
- Apps Script：將 Web App deployment 指回前一個版本。
- 新增的 P–S 欄可以保留，不會影響舊版 1–15 欄邏輯。
- Trigger 若是新功能造成問題，只停用本次新增的 reminder handler；不要刪除其他 Trigger。
- Calendar 已建立的事件不可批次刪除，除非先依 booking ID 與 Sheet Event ID 精確核對。
- 不使用 `git reset --hard` 或覆寫使用者其他修改。

---

## 16. 執行 session 最終回報格式

完成後請回報：

```text
程式：
- 前端 LINE 流程：完成／未完成
- LINE ID token 後端驗證：完成／未完成
- 官方 LINE 成功頁按鈕：完成／缺官方 URL
- Calendar 建立／確認／取消同步：完成／未完成
- 前一天提醒與去重：完成／未完成

外部設定：
- LINE Console：已設定／待業主
- Apps Script v7：已部署／待部署
- Sheet migration：已執行／待執行
- Trigger：已建立／待建立
- Calendar 寫入權限：已驗證／待驗證

驗證：
- 自動／本地測試：
- LINE 實機測試：
- Calendar 實測：
- 提醒實測：

尚餘風險或 blocker：
- ...
```

不要只寫「已完成」；必須分開報告原始碼、外部設定、正式部署與實機驗證。
