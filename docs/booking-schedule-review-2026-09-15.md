# 諮詢時段與通知檢查（2026-09-15）

## 部署結果（2026-09-15 11:07，台灣）

- 業主回報已整份覆蓋 `Code.gs` 並部署；普通 GET 診斷確認新時段、Calendar 防撞功能與單一方案白名單已上線，LIVE、automationReady=true、Asia/Taipei、改期通知 false。
- 依先前授權推送網站前端，提交 `3cf8530`，GitHub Actions `34923218760` 成功；正式 HTML 與本機測試檔一致，前後端週一到週五時段一致。
- 本輪沒有提交測試預約、呼叫 `task=processJobs` 或發送客戶通知；所有通知回歸測試均在本機模擬。
- 目前已核對的健康狀態沒有立即回復舊版的依據。正式原始碼完整比對、Trigger 執行紀錄與實際訊息投遞仍未取得，因此不宣稱已排除所有實際誤發。
- 下方保留部署前的檢查與修正紀錄。

## 結論

本次週一、週二時段設定在本機模擬中沒有造成既有預約自動改期、取消或重複通知。LINE 登入草稿保留已移除時段，以及送出前未驗證 Calendar 的兩個問題均已修正並通過本機測試，前後端部署結果已記錄於上方。

部署前測試使用本機假 Sheet、Calendar、LINE 與 Email，沒有建立正式測試預約或發送真實測試通知。2026-09-15 09:58（台灣）的部署前普通 GET 診斷為 v12.1、LIVE、Asia/Taipei、automationReady=true、rescheduleNotificationsEnabled=false；部署後結果見上方。正式程式完整內容、通知佇列與 Trigger 清單尚未取得。

## 已修：送出預約時沒有重新檢查 Calendar 封鎖

- 位置：`feifei-ecommerce/booking-backend/Code.gs` 的 `isSlotTaken()`、`doPost()`。
- `getCalendarBlocks()` 會依日曆事件產生前台不可選的時段，但 `doPost()` 寫入前只透過 `isSlotTaken()` 比對預約表中的相同日期／時間。
- 重現：在假 Calendar 建立週一 18:15–19:15 的占用事件，確認 `getCalendarBlocks()` 已列出 18:15 不開放；預約表沒有同時段紀錄時，送出 18:15 仍回傳 `success: true`，假預約表增加一列，通知佇列被呼叫一次。
- 影響：保留舊頁面或在公開時段同步前送出的客人，可能建立衝突預約，後續收到「已收到您的預約申請」通知。
- 現已在 `doPost()` 的 Sheet 防撞後、寫入前加入 `isCalendarSlotBlocked_()`，在既有鎖內僅查詢該一小時，拒絕任何重疊事件（含整日與跨日）。相鄰時段不誤擋。
- 查不到日曆、權限或暫時性讀取錯誤時，回傳 `AVAILABILITY_UNAVAILABLE`，不寫入、不排入通知，並釋放鎖。前端保留資料並顯示稍後再試；衝突則返回選時段，不啟動通知工作。
- Google Calendar 的範圍查詢會包含涵蓋整個查詢區間的事件；實作再以事件起訖時間排除僅接觸邊界的相鄰事件。[Google Calendar getEvents 官方文件](https://developers.google.com/apps-script/reference/calendar/calendar#getEvents(Date,Date))
- 日曆查詢會增加一次服務讀取，實際延遲須於正式環境觀察。Google Calendar 的人工編輯不受 Apps Script 鎖控制，無法與 Sheet 寫入形成跨服務的單一交易；本次修正保證送出時重新查詢，不保證阻止查詢完成後其他人立即新增日曆事件。

## 已修：LINE 登入草稿帶回週一 16:30

- 原本登入返回後直接恢復已選時段；更新前儲存的週一 16:30 草稿仍可進入確認頁，最後才被後端拒絕。
- 新增 `ensureSelectedTimeIsOffered()`，於草稿恢復、確認資料及送出前檢查當日開放時段。
- 已移除的時段會清除選取並返回選時段步驟，姓名、付款末五碼及勾選等資料保留；缺少時段的草稿也會回到選時段步驟。
- 此前端修正處理每週開放時段規則；Calendar 即時封鎖由上述後端防線處理。

## 通知與既有預約檢查

| 情境 | 本機模擬結果 |
|---|---|
| 既有週一 16:30 已確認預約 | 日期、時間、狀態與已發提醒紀錄保持不變；不產生改期／取消／確認通知 |
| 改期通知開關為 false 或 true，但預約時間沒有變 | 重複跑狀態檢查皆無額外通知 |
| 改期通知開關為 false，存在舊的待送改期紀錄 | 待送改期通知保持暫停 |
| 週一 18:15、19:15；週二 18:00、19:00；既有週一 16:30 | 收到預約、確認、前一天 LINE 提醒使用紀錄中的正確日期／時間與對應 UID |
| 重複處理同一通知工作或提醒 | 各階段 LINE／Email 通知不重送；Calendar 只建立一個事件 |
| 申請收到／確認 Email | 助理與客戶收件人分別正確，內容時間正確 |
| 新增晚間時段的日曆占用 | 占用該一小時的時段會列入公開封鎖，不誤封下一個相鄰時段 |
| 既有週一 16:30 的公開時段同步 | 保留既有紀錄，不改寫來源預約表 |
| 新預約送出週一 16:30 | 後端驗證階段即拒絕，不驗證 LINE、不寫預約表、不排入通知 |

延遲 5–10 分鐘提醒是頁面文字，不會延後預約時間或新增客戶通知。

## 驗證

- `node feifei-ecommerce/booking-backend/Code.v12.test.js`：23 項測試通過，包含時段／通知回歸、45 個平日時段有效性組合、完整／部分／整日／跨日衝突、3 種日曆讀取失敗、相鄰可預約與重複送出防撞。
- `node feifei-ecommerce/booking-schedule.test.js`：平日時段按鈕、額滿判定、LINE 草稿、無效時段確認／送出防線、Calendar 失敗／衝突回應均通過，拒絕回應不顯示成功或啟動通知工作。
- `node feifei-ecommerce/single-plan.test.js`：單一方案及頁面 JavaScript 語法檢查通過。
- 原本可成功送出的 Calendar 衝突情境，修正後回傳 `SLOT_TAKEN`，並驗證預約表、公開表與通知佇列均無寫入。

## 部署條件

1. Calendar 送出前防撞缺口已修正並通過模擬測試。
2. 取得正式 Apps Script 目前程式及屬性，僅套用本次核准差異；本機 `Code.gs` 含有先前大量未提交修改，不能直接整份當成本次時段更新部署。
3. 維持既有正式通知保護及狀態，核對 `RESCHEDULE_NOTIFICATIONS_ENABLED=false`；不因時段調整清除已發通知紀錄。
4. 先更新後端，再確認公開時段表已同步新晚間時段的 Calendar 封鎖，最後部署前端。
5. 後端診斷回應已增加 `timeSlotsByDay` 及 `hasCalendarAvailabilityCheck`，保留原 `timeSlots` 欄位，供核對部署結果；這個普通 GET 讀取不執行通知工作。
