var SETTINGS = {
  SHEET_ID: '1IUDCeB087LLFoLyzGxp_4eTSpycYiWjNM8PJ6b7DhwM',
  SHEET_NAME: '\u9810\u7d04\u7d00\u9304',
  PUBLIC_SHEET_ID: '1mWyyA9N3bHsbCGZWg_FbQGinbev1sKG-gquh60Qtc-E',
  PUBLIC_SHEET_NAME: '\u6642\u6bb5\u72c0\u614b',
  ASSISTANT_EMAIL: 'iankuo1999@gmail.com',
  BRAND_NAME: '\u975e\u975e768',
  SERVICE_PRICE: 'NT$3,800',
  CALENDAR_ID: '',
  TIME_SLOTS: ['10:00', '11:00', '14:00', '15:00', '16:00'],
  AVAILABLE_DAYS: [1, 2, 3, 4, 5], // 週一到五
  MIN_ADVANCE_DAYS: 2,
  MAX_ADVANCE_DAYS: 30,
  VALID_TOPICS: ['\u611f\u60c5', '\u5de5\u4f5c', '\u5176\u4ed6'],
  MAX_FIELD_LENGTH: 500,
  RATE_LIMIT_SECONDS: 60 // 同一 email 最短間隔
};

function getSheet() {
  var ss = SpreadsheetApp.openById(SETTINGS.SHEET_ID);
  return ss.getSheetByName(SETTINGS.SHEET_NAME);
}

function initSheet() {
  var ss = SpreadsheetApp.openById(SETTINGS.SHEET_ID);
  var sheet = ss.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS.SHEET_NAME);
  }
  sheet.getRange(1, 1, 1, 10).setValues([[
    '\u63d0\u4ea4\u6642\u9593', '\u9810\u7d04\u65e5\u671f', '\u9810\u7d04\u6642\u6bb5', '\u59d3\u540d', '\u96fb\u8a71',
    'Email', '\u8aee\u8a62\u4e3b\u984c', '\u5099\u8a3b', '\u72c0\u614b', '\u78ba\u8a8d\u6642\u9593'
  ]]);
  var header = sheet.getRange(1, 1, 1, 10);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['\u5f85\u78ba\u8a8d', '\u5df2\u78ba\u8a8d', '\u5df2\u53d6\u6d88', '\u5df2\u5b8c\u6210'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 9, 100, 1).setDataValidation(rule);
  for (var i = 1; i <= 10; i++) {
    sheet.autoResizeColumn(i);
  }
}

function initPublicSheet() {
  if (!SETTINGS.PUBLIC_SHEET_ID) {
    Logger.log('Please set PUBLIC_SHEET_ID first');
    return;
  }
  var ss = SpreadsheetApp.openById(SETTINGS.PUBLIC_SHEET_ID);
  var sheet = ss.getSheetByName(SETTINGS.PUBLIC_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS.PUBLIC_SHEET_NAME);
  }
  sheet.getRange(1, 1, 1, 3).setValues([[
    '\u9810\u7d04\u65e5\u671f', '\u9810\u7d04\u6642\u6bb5', '\u72c0\u614b'
  ]]);
  var header = sheet.getRange(1, 1, 1, 3);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  Logger.log('Public sheet initialized');
}

function getCalendarBlocks() {
  var calId = SETTINGS.CALENDAR_ID;
  var calendar;
  if (calId) {
    calendar = CalendarApp.getCalendarById(calId);
  } else {
    calendar = CalendarApp.getDefaultCalendar();
  }
  if (!calendar) return [];

  var today = new Date();
  var endDate = new Date(today);
  endDate.setDate(endDate.getDate() + SETTINGS.MAX_ADVANCE_DAYS);
  var events = calendar.getEvents(today, endDate);
  if (events.length === 0) return [];

  var blocks = [];
  for (var d = 0; d <= SETTINGS.MAX_ADVANCE_DAYS; d++) {
    var date = new Date(today);
    date.setDate(date.getDate() + d);
    var dateStr = formatDateKey(date);

    for (var s = 0; s < SETTINGS.TIME_SLOTS.length; s++) {
      var parts = SETTINGS.TIME_SLOTS[s].split(':');
      var slotStart = new Date(date);
      slotStart.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      var slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1hr 用毫秒避免 setHours 跨日問題

      for (var e = 0; e < events.length; e++) {
        var ev = events[e];
        if (ev.isAllDayEvent()) {
          var evDate = formatDateKey(ev.getStartTime());
          var evEndDate = formatDateKey(ev.getEndTime());
          if (dateStr >= evDate && dateStr < evEndDate) {
            blocks.push([dateStr, SETTINGS.TIME_SLOTS[s], '\u4e0d\u958b\u653e']);
            break;
          }
        } else if (ev.getStartTime() < slotEnd && ev.getEndTime() > slotStart) {
          blocks.push([dateStr, SETTINGS.TIME_SLOTS[s], '\u4e0d\u958b\u653e']);
          break;
        }
      }
    }
  }
  return blocks;
}

function syncPublicSheet() {
  if (!SETTINGS.PUBLIC_SHEET_ID) return;

  // 加鎖防止並發寫入衝突（等最多 30 秒）
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('syncPublicSheet: could not acquire lock, skipping');
    return;
  }
  try {
    var source = getSheet();
    var lastRow = source.getLastRow();

    var target = SpreadsheetApp.openById(SETTINGS.PUBLIC_SHEET_ID)
      .getSheetByName(SETTINGS.PUBLIC_SHEET_NAME);
    var targetLastRow = target.getLastRow();
    if (targetLastRow > 1) {
      target.getRange(2, 1, targetLastRow - 1, 3).clearContent();
    }

    var publicRows = [];

    if (lastRow > 1) {
      var data = source.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var status = row[8];
        if (status === '\u5f85\u78ba\u8a8d' || status === '\u5df2\u78ba\u8a8d') {
          publicRows.push([
            formatDateKey(row[1]),
            formatTimeKey(row[2]),
            status
          ]);
        }
      }
    }

    var calBlocks = getCalendarBlocks();
    for (var j = 0; j < calBlocks.length; j++) {
      var block = calBlocks[j];
      var isDuplicate = false;
      for (var k = 0; k < publicRows.length; k++) {
        if (publicRows[k][0] === block[0] && publicRows[k][1] === block[1]) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        publicRows.push(block);
      }
    }

    if (publicRows.length > 0) {
      target.getRange(2, 1, publicRows.length, 3).setValues(publicRows);
    }
  } finally {
    lock.releaseLock();
  }
}

// ===== 格式化工具 =====

function formatDateKey(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  // 嘗試解析非 Date 的值
  var str = String(val);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatDateKey(parsed);
  return str;
}

function formatTimeKey(val) {
  if (val instanceof Date) {
    var h = ('0' + val.getHours()).slice(-2);
    var m = ('0' + val.getMinutes()).slice(-2);
    return h + ':' + m;
  }
  var str = String(val);
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatTimeKey(parsed);
  return str;
}

// ===== 輸入驗證 =====

function sanitizeText(val, maxLen) {
  if (typeof val !== 'string') val = String(val || '');
  val = val.trim().substring(0, maxLen || SETTINGS.MAX_FIELD_LENGTH);
  // 防止 Google Sheets 公式注入：開頭為 =, +, -, @ 時加上單引號前綴
  if (val.length > 0 && '=+-@'.indexOf(val.charAt(0)) !== -1) {
    val = "'" + val;
  }
  return val;
}

function validateBookingData(data) {
  var errors = [];

  // 必填欄位檢查
  if (!data.date) errors.push('缺少日期');
  if (!data.time) errors.push('缺少時段');
  if (!data.name) errors.push('缺少姓名');
  if (!data.phone) errors.push('缺少電話');
  if (!data.email) errors.push('缺少 Email');
  if (!data.topic) errors.push('缺少主題');
  if (errors.length > 0) return errors;

  // 日期格式 YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('日期格式無效');
    return errors;
  }

  // 日期是否在有效範圍
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var bookDate = new Date(data.date + 'T00:00:00');
  var diffDays = Math.floor((bookDate - today) / 86400000);
  if (diffDays < SETTINGS.MIN_ADVANCE_DAYS) errors.push('日期太近，需提前 ' + SETTINGS.MIN_ADVANCE_DAYS + ' 天');
  if (diffDays > SETTINGS.MAX_ADVANCE_DAYS) errors.push('日期超過可預約範圍');

  // 星期幾檢查
  var dayOfWeek = bookDate.getDay();
  if (SETTINGS.AVAILABLE_DAYS.indexOf(dayOfWeek) === -1) errors.push('該日不開放預約');

  // 時段是否有效
  if (SETTINGS.TIME_SLOTS.indexOf(data.time) === -1) errors.push('無效的時段');

  // 主題是否有效
  if (SETTINGS.VALID_TOPICS.indexOf(data.topic) === -1) errors.push('無效的主題');

  // Email 基本格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.push('Email 格式無效');

  // 手機格式（台灣）
  var phone = data.phone.replace(/[-\s]/g, '');
  if (!/^09\d{8}$/.test(phone)) errors.push('手機號碼格式無效');

  return errors;
}

// ===== 速率限制 =====

function isRateLimited(email) {
  var cache = CacheService.getScriptCache();
  var key = 'booking_' + email.toLowerCase();
  if (cache.get(key)) return true;
  cache.put(key, 'true', SETTINGS.RATE_LIMIT_SECONDS);
  return false;
}

// ===== 時段檢查（含鎖） =====

function isSlotTaken(sheet, date, time) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  var data = sheet.getRange(2, 2, lastRow - 1, 8).getValues(); // columns B-I
  for (var i = 0; i < data.length; i++) {
    var rowDate = formatDateKey(data[i][0]);
    var rowTime = formatTimeKey(data[i][1]);
    var rowStatus = data[i][7]; // column I = 狀態
    if (rowDate === date && rowTime === time &&
        (rowStatus === '\u5f85\u78ba\u8a8d' || rowStatus === '\u5df2\u78ba\u8a8d')) {
      return true;
    }
  }
  return false;
}

// ===== 主要 POST 處理 =====

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 1. 輸入驗證
    var validationErrors = validateBookingData(data);
    if (validationErrors.length > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: validationErrors.join('; ')
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 速率限制
    if (isRateLimited(data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'RATE_LIMITED',
          message: '\u8acb\u7a0d\u5f8c\u518d\u8a66\uff0c\u6bcf\u6b21\u9810\u7d04\u9700\u9593\u9694 ' + SETTINGS.RATE_LIMIT_SECONDS + ' \u79d2'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 加鎖 — 防止 TOCTOU 競爭條件（等最多 30 秒）
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'SERVER_BUSY',
          message: '\u7cfb\u7d71\u5fd9\u7891\u4e2d\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try {
      var sheet = getSheet();

      // 4. 檢查時段是否已被預約
      if (isSlotTaken(sheet, data.date, data.time)) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'SLOT_TAKEN',
            message: '\u8a72\u6642\u6bb5\u5df2\u88ab\u9810\u7d04\uff0c\u8acb\u9078\u64c7\u5176\u4ed6\u6642\u6bb5'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 5. 寫入（文字經過清理）
      sheet.appendRow([
        new Date(),
        data.date,
        data.time,
        sanitizeText(data.name, 50),
        data.phone.replace(/[-\s]/g, ''),
        data.email.trim(),
        data.topic,
        sanitizeText(data.notes || '', SETTINGS.MAX_FIELD_LENGTH),
        '\u5f85\u78ba\u8a8d',
        ''
      ]);
    } finally {
      lock.releaseLock();
    }

    // 6. 鎖外執行非關鍵操作
    if (SETTINGS.ASSISTANT_EMAIL) {
      sendAssistantNotification(data);
    }
    syncPublicSheet();

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== Email 通知 =====

function sendAssistantNotification(data) {
  var displayDate = data.dateDisplay || data.date;
  var subject = '[\u65b0\u9810\u7d04] ' + sanitizeText(data.name, 20) + ' - ' + displayDate + ' ' + data.time;
  var body = SETTINGS.BRAND_NAME + ' \u65b0\u9810\u7d04\uff1a\n\n'
    + '\u59d3\u540d\uff1a' + sanitizeText(data.name, 50) + '\n'
    + '\u96fb\u8a71\uff1a' + data.phone + '\n'
    + 'Email\uff1a' + data.email + '\n'
    + '\u65e5\u671f\uff1a' + displayDate + '\n'
    + '\u6642\u6bb5\uff1a' + data.time + '\n'
    + '\u4e3b\u984c\uff1a' + data.topic + '\n'
    + '\u5099\u8a3b\uff1a' + sanitizeText(data.notes || '\u7121', 200) + '\n\n'
    + '\u8acb\u5230 Google Sheet \u5c07\u72c0\u614b\u6539\u70ba\u300c\u5df2\u78ba\u8a8d\u300d\uff0c\u7cfb\u7d71\u6703\u81ea\u52d5\u901a\u77e5\u5ba2\u6236\u3002';
  MailApp.sendEmail(SETTINGS.ASSISTANT_EMAIL, subject, body);
}

function checkStatusChanges() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    syncPublicSheet();
    return;
  }
  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[8];
    var confirmTime = row[9];

    if (status === '\u5df2\u78ba\u8a8d' && !confirmTime) {
      var booking = {
        date: formatDateKey(row[1]),
        time: formatTimeKey(row[2]),
        name: row[3],
        phone: row[4],
        email: row[5],
        topic: row[6]
      };
      sendCustomerConfirmation(booking);
      sheet.getRange(i + 2, 10).setValue(new Date());
    }

    // 取消：用特殊標記區分已確認過的，避免 confirmTime 擋住取消通知
    if (status === '\u5df2\u53d6\u6d88') {
      var marker = String(confirmTime);
      if (marker.indexOf('\u53d6\u6d88\u5df2\u901a\u77e5') === -1) {
        var booking2 = {
          date: formatDateKey(row[1]),
          time: formatTimeKey(row[2]),
          name: row[3],
          email: row[5]
        };
        sendCancellationNotice(booking2);
        sheet.getRange(i + 2, 10).setValue('\u53d6\u6d88\u5df2\u901a\u77e5 ' + new Date().toLocaleString());
      }
    }
  }
  syncPublicSheet();
}

function sendCustomerConfirmation(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var subject = '[\u9810\u7d04\u78ba\u8a8d] ' + SETTINGS.BRAND_NAME + ' - ' + dateStr + ' ' + timeStr;
  var body = booking.name + ' \u60a8\u597d\uff0c\n\n'
    + '\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u5df2\u78ba\u8a8d\uff01\n\n'
    + '\u65e5\u671f\uff1a' + dateStr + '\n'
    + '\u6642\u6bb5\uff1a' + timeStr + '\n'
    + '\u4e3b\u984c\uff1a' + booking.topic + '\n'
    + '\u8cbb\u7528\uff1a' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '\u8aee\u8a62\u65b9\u5f0f\u5c07\u7531\u52a9\u7406\u53e6\u884c\u901a\u77e5\u3002\n'
    + '\u5982\u9700\u66f4\u6539\u6216\u53d6\u6d88\uff0c\u8acb\u63d0\u524d\u806f\u7e6b\u6211\u5011\u3002\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}

function sendCancellationNotice(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var subject = '[\u9810\u7d04\u53d6\u6d88] ' + SETTINGS.BRAND_NAME + ' - ' + dateStr + ' ' + timeStr;
  var body = booking.name + ' \u60a8\u597d\uff0c\n\n'
    + '\u5f88\u62b1\u6b49\uff0c\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u56e0\u6642\u9593\u7121\u6cd5\u914d\u5408\uff0c\u5df2\u53d6\u6d88\u3002\n\n'
    + '\u539f\u8a02\u65e5\u671f\uff1a' + dateStr + '\n'
    + '\u539f\u8a02\u6642\u6bb5\uff1a' + timeStr + '\n\n'
    + '\u6b61\u8fce\u91cd\u65b0\u9810\u7d04\u5176\u4ed6\u6642\u6bb5\uff0c\u9020\u6210\u4e0d\u4fbf\u8acb\u898b\u8ad2\u3002\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}

function testSync() {
  syncPublicSheet();
  Logger.log('Public sheet synced (with calendar blocks)');
}
