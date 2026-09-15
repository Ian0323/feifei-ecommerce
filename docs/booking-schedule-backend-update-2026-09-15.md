# 週一、週二時段：正式後端更新步驟

> 本次更新已完成：業主整份覆蓋後端並部署，2026-09-15 11:07（台灣）診斷確認新時段／防撞／單一方案限制已上線，改期通知 false；網站提交 `3cf8530` 已部署並核對。以下原更新片段留作紀錄，無須重複貼上。

本機修正已通過 23 項後端測試，以及前端時段、登入草稿與錯誤回應測試。以下只包含本次時段與 Calendar 防撞差異，套用至**正式 Apps Script 編輯器現有程式**。

本機完整 `Code.gs` 含有先前未提交修改，請使用以下片段逐項更新正式程式，避免帶入其他功能變更。先保存正式程式備份；若找不到指定位置，先比對原程式。

## 1. 更新 SETTINGS 的時段設定

保留原本 `TIME_SLOTS`，將 `TUESDAY_EXTRA_SLOTS` 那一行替換成 `TIME_SLOTS_BY_DAY`：

```javascript
  TIME_SLOTS: ['10:30', '11:30', '14:30', '15:30', '16:30'],
  TIME_SLOTS_BY_DAY: {
    1: ['10:30', '11:30', '14:30', '15:30', '18:15', '19:15'],
    2: ['10:30', '11:30', '14:30', '15:30', '16:30', '18:00', '19:00']
  },
```

## 2. 替換 getSlotsForDate 函式

```javascript
function getSlotsForDate(date) {
  var d = (date instanceof Date) ? date : new Date(date + 'T00:00:00');
  return (SETTINGS.TIME_SLOTS_BY_DAY[d.getDay()] || SETTINGS.TIME_SLOTS).slice();
}
```

## 3. 加入送出前日曆檢查函式

放在 `isSlotTaken()` 結束後、`// ===== Booking ID =====` 前。沿用既有的 `getCalendar_()` 與 `parseSlotDateTime_()`。

```javascript
function isCalendarSlotBlocked_(date, time) {
  var calendar = getCalendar_();
  if (!calendar) throw new Error('Booking calendar unavailable');
  var range = parseSlotDateTime_(date, time);
  var events = calendar.getEvents(range.start, range.end);
  for (var i = 0; i < events.length; i++) {
    if (events[i].getStartTime() < range.end && events[i].getEndTime() > range.start) {
      return true;
    }
  }
  return false;
}
```

## 4. 在 doPost 寫入前加入防線

找到 `doPost()` 中 `if (isSlotTaken(...)) { ... }` 完整區塊，在它結束後、`// 5. 寫入` 之前插入下列內容。這段仍在原本鎖內的 `try` 中，沿用原本的 `finally` 釋放鎖。

```javascript
      var calendarBlocked;
      try {
        calendarBlocked = isCalendarSlotBlocked_(data.date, data.time);
      } catch (calendarError) {
        Logger.log('doPost availability check failed bookingId=' + bookingId + ': ' + calendarError.message);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'AVAILABILITY_UNAVAILABLE',
            message: '目前無法確認時段是否開放，尚未建立預約，請稍後再試'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (calendarBlocked) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'SLOT_TAKEN',
            message: '此時段目前不開放預約，請重新選擇時段'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
```

## 5. 補上部署確認欄位

在 `doGet()` 回傳的 JSON 物件內加入兩行：

```javascript
      hasCalendarAvailabilityCheck: typeof isCalendarSlotBlocked_ === 'function',
      timeSlotsByDay: SETTINGS.TIME_SLOTS_BY_DAY,
```

## 6. 上線順序

1. 保存程式，更新**既有 Web App 部署的新版本**，沿用現有網址。
2. 直接開啟既有 Web App `/exec`（使用一般診斷網址），確認：
   - `hasCalendarAvailabilityCheck: true`。
   - `timeSlotsByDay` 的週一、週二陣列與上方相同。
   - `safety.mode: "LIVE"`、`safety.automationReady: true`、`scriptTimezone: "Asia/Taipei"`。
   - `rescheduleNotificationsEnabled: false`。
3. 沿用既有 Trigger、通知狀態與基準資料；本次不需要重跑初始化、重設通知紀錄或重新安裝 Trigger。
4. 等既有背景同步更新公開時段表，再部署本次 `landing-page/booking.html`。
5. 開啟預約頁確認週一 6 個、週二 7 個時段與延遲提醒，週三至週五仍為原本 5 個；此顯示檢查不需要提交客戶預約。

截至 2026-09-15 09:58（台灣），正式診斷仍為舊 v12.1、LIVE、改期通知關閉，尚未含有上述新欄位。本次未部署或發送測試通知。
