---
version: 4
last-updated: 2026-04-30
---

# Session State — feifei 品牌

> 跨 session 結論追蹤。每次商業討論結束後更新。
> 新 conversation 開始時先讀此檔，避免重複分析。

## 當前共識（最多 10 項）

| # | 結論 | 日期 | 來源 |
|---|------|------|------|
| C-1 | 品牌定位從「命理」改為「愛拜拜」 | 2026-04-07 | 業主會議 |
| C-2 | 香霧定位是水晶/精油能量，不是廟裡祝福延伸 | 2026-04-07 | 業主會議 |
| C-3 | 香霧定價 NT$980/瓶，回購率低 | 2026-04-07 | 業主會議 |
| C-4 | 韓貨慢慢收掉（CP 值不高） | 2026-04-07 | 業主會議 |
| C-5 | IG 為主通路，抖音轉換差 | 2026-04-07 | 業主會議 |
| C-6 | 諮詢 3,800/次，一半捐武財公，主要做感情+工作 | 2026-04-07 | 業主會議 |
| C-7 | 金流要自動化但不想被抽成太多 | 2026-04-07 | 業主會議 |
| C-8 | 香霧加持來源多元化（郭老師+道長+廟裡拜拜） | 2026-04-07 | 業主會議 |
| C-9 | 靈性方向 all-in，品牌 DNA 不需驗證 | 2026-03-21 | 業主確認 |
| C-10 | 規模化需先驗證：數位產品需求 > 會員制 > 產品線擴展 | 2026-04-07 | 三 Agent 研究 |

## 商業策略結論

### B-1：規模化路徑研究（2026-04-07）
- **議題**：香霧回購低 + 韓貨收掉，如何突破營收天花板
- **結論**：知識產品化（電子書/課程）是最推薦先測試的路徑
- **依據**：三 Agent 平行研究，台灣命理師成功變現路徑清一色是「課程+諮詢」
- **Go 條件**：feifei 願意每月 8-10hr 做內容 + 限動投票 >50 人回應
- **決策期限**：2026-04-30
- **反方最強論點**：feifei 可能只想輕鬆賣，不想建事業
- **下一步**：Ian 確認 feifei 的意願 → IG 限動投票測試需求

### B-2：IG 漏斗修補策略（2026-04-30）
- **議題**：業主收到兩份第三方建議——(1) ManyChat 整套 funnel（follow-gating + email 收集 + 推播刷點閱）、(2) 4 張限動 funnel 帶流量
- **結論**：機制吸收（截圖鉤子 + 關鍵字 + DM 承接），但**文案重寫成 feifei 語氣**、結構簡化只做 1 張限動快速版
- **依據**：
  - 第三方文案是「教 IG 成長的人寫給想學的人」，受眾錯位（feifei 客群是 25-44 女性看靈性/生活內容，不是 marketer）
  - 4 張限動 funnel（打破認知→建觀點→給方法→引導回覆）是賣課程結構，賣 NT$980 香霧過度設計
  - 機制本身（留言/限動 → DM 承接 → 連結）跟 IG 2024-2026 帶貨主流相容、合規
- **不做**：follow-gating（違反 IG 政策）、推播刷點閱（演算法會抓）、email 收集（feifei 客群不開信）
- **權限模式**：ManyChat Team Member 邀請，Ian 不取得 IG 密碼
- **執行手冊**：`docs/strategy/manychat-playbook.md`（含限動鉤子情境式文案範本）
- **下一步**：業主完成 ManyChat 帳號授權 → Ian 設定首發 Reels 留言觸發 + 1 張限動觸發（C-3 拜拜知識場景優先，可同時驗證 C-10 數位產品需求）

## 當前待辦

- [ ] 確認 feifei 對品牌的期待：副業 or 事業？（blocking 所有規模化決策）
- [ ] IG 限動投票：「你想要拜拜懶人包嗎？」
- [ ] Reels 統一加口語 CTA + bio 改版
- [ ] 官網文案配合新定位更新（愛拜拜 + 980 定價 + 水晶精油能量）
- [ ] 金流方案確認：月訂單達 20 筆時切換藍新
- [ ] LINE Bot 按鈕串接預約頁面連結
- [x] ~~確認預約諮詢的可預約時段是否需要調整~~ → 2026-04-30 業主確認：加 09:00（每天）+ 17:00（僅週二）
- [ ] 確認業主是否要用自己的 Google Calendar（目前用 Ian 的預設日曆）
- [ ] 跟業主 review 系統成本結構文件（`docs/business/system-cost-structure.md`）
- [ ] 業主端：feifei 註冊 ManyChat、連 IG、加 Ian 為 Admin（B-2 啟動條件）
- [ ] Ian 端：選定首發 Reels + 設定留言觸發 DM flow（playbook Section 3）
- [ ] 設定限動觸發 + C-3 拜拜知識場景鉤子（同時驗證數位產品需求）

## Session 交接摘要

**最後更新**：2026-04-30（第三次更新 — 預約系統實戰除錯 + alias）

**這個 session 完成（程式碼層）**：
1. **網域已實際上線**：`myfeifei768.com.tw` 業主自行完成 DNS + GitHub Pages 綁定，前端從 LIFF console 也驗證 endpoint URL 已改到自訂網域
2. **booking 頁 UX 三大修正**：
   - **月底自動跳下個月**：`monthHasAvailability()` 在 init 時 advance currentMonth；上一月按鈕同步 disable，避免使用者點回空白月份
   - **預約須知一次性引導**：給該區塊 `id="terms-block"`，goToStep ≥ 2 即收起，後續返回 step 1 也不再顯示；selectDate 上游擋下「未勾選同意」
   - **scrollIntoView 取代 scrollTo(top:0)**：goToStep / showError / showSuccess 都改成滑到該步驟容器頂部，避免切換步驟時跳回頁面最上方反覆看到須知與服務介紹
3. **生年月日簡化為民國單選**：移除國曆/民國 radio，前端固定送 `民國`、後端 `VALID_BIRTH_CALENDARS = ['民國']`
4. **doPost 通知容錯（critical fix）**：之前 `sendAssistantNotification` / `sendLineBookingReceived` / `syncPublicSheet` 任一 throw → 外層 catch 接住 → 回傳 success=false，但 sheet.appendRow 早已寫入 → 客戶看到「失敗」重試又被 isSlotTaken 擋下顯示「時段已被預約」。改為三段各自 try/catch，warnings 陣列回報失敗項目，預約寫入成功就一律回成功
5. **Email 寄件人改 GmailApp + alias**：新增 `SETTINGS.SENDER_EMAIL = 'mumuhappy88katrina@gmail.com'` + `SENDER_NAME = '非非768 助理'`，新 helper `sendBrandEmail()` 走 `GmailApp.sendEmail(... {from, name})`。三處 MailApp.sendEmail 全改用 helper。Apps Script 擁有權留在 iankuo1999（業主要 Ian 維護），但客戶看到的 From 是品牌助理
6. **助理測試 PDF**：`docs/booking-test-checklist.html` + `.pdf`（302KB），用 Edge headless 產出，10 大項測試清單給助理逐項打勾

**業主端必做（這個 session 後）**：
- [x] LIFF Endpoint URL 改成 `https://myfeifei768.com.tw/booking.html`（業主已完成）
- [ ] iankuo1999 的 Gmail → 設定 → 帳戶和匯入 → Send mail as 加入 `mumuhappy88katrina@gmail.com` 並驗證
- [ ] mumuhappy88katrina 收件信點驗證連結
- [ ] Apps Script 把 GitHub 上最新 Code.gs（v4-gmail-alias）貼回去，新版本部署（不是新增部署）
- [ ] 第一次跑會要授權 GmailApp 權限
- [ ] 設定 Trigger：`checkStatusChanges` 每 5 分鐘執行一次（否則助理改「已確認」狀態後客戶不會收到確認信）
- [ ] 把測試 PDF 裡「直連網址」欄位填上 `https://myfeifei768.com.tw/booking.html`，再傳給助理測試

**LINE Bot 上線前需做（卡未來，不是現在）**：
- 5 個檔案還寫舊網址 `ian0323.github.io/feifei-ecommerce/`，等 LINE Bot 上線前批量換成 `myfeifei768.com.tw`：
  - `feifei-ecommerce/line-bot/config.js:120`
  - `feifei-ecommerce/line-bot/data/faq.json`（兩處）
  - `feifei-ecommerce/line-bot/data/system-prompt.md`
  - `feifei-ecommerce/line-bot/tests/handlers.test.js`（4 處 assertion）
  - `PROGRESS.md` 內文（已部分更新）

**已知非阻塞警告**：
- 預約頁 console 警告 `cdn.tailwindcss.com should not be used in production`：可忽略，目前流量用 CDN 完全夠
- Gmail Send mail as 後 iankuo1999 的「寄件備份」會看到自己寄出的通知信（正常 Gmail 行為，因為實際送信帳號是 iankuo1999），不影響功能

**未決議題**：
- 業主對藍色具體感受未知（user 在 review，可能要再調色）
- 其他頁面（index/mist/links/go/blessing/brand）是否也要從紫粉改藍 — **暫不動**，等業主先看 booking 頁感覺

**下次 session 開場**：
1. 先問用戶業主對藍色感受 → 是否需要微調
2. 確認顏色定案後 → commit + push 上 GitHub Pages
3. 業主 OK 後再走 DNS 流程（HiNet NS → Cloudflare → GitHub Pages 綁網域）
4. 提醒業主重新部署 Apps Script（時段擴充上線）

**還在排隊的舊待辦**（從上一個 session）：
1. LINE Bot 部署上線後開始累積對話數據（需 100+ 則才有分析價值）
2. 累積 2-4 週後跑 `npm run logs:clean` → persona 分析
3. 設定 LINE Bot 按鈕串接預約連結
4. 處理「確認 feifei 意願」→ 決定規模化方向
5. 推進 ManyChat：業主端授權 → Ian 端首發 Reels + 限動觸發上線 → 4 週後檢視成效
