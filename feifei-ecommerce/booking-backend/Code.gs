var SETTINGS = {
  SHEET_ID: '1IUDCeB087LLFoLyzGxp_4eTSpycYiWjNM8PJ6b7DhwM',
  SHEET_NAME: '\u9810\u7d04\u7d00\u9304',
  PUBLIC_SHEET_ID: '1mWyyA9N3bHsbCGZWg_FbQGinbev1sKG-gquh60Qtc-E',
  PUBLIC_SHEET_NAME: '\u6642\u6bb5\u72c0\u614b',
  ASSISTANT_EMAIL: 'mumuhappy88katrina@gmail.com',
  // \u5bc4\u4ef6\u4eba\u5225\u540d\uff08\u8981\u5148\u5728 Apps Script \u64c1\u6709\u8005\u5e33\u865f\u7684 Gmail \u2192 \u8a2d\u5b9a \u2192 \u5e33\u6236\u548c\u532f\u5165 \u2192 Send mail as \u52a0\u5165\u4e26\u9a57\u8b49\uff09
  // \u672a\u9a57\u8b49\u6703 throw\uff0c\u5916\u5c64 catch \u6703\u8a18\u9304\u70ba email_failed warning
  SENDER_EMAIL: 'mumuhappy88katrina@gmail.com',
  SENDER_NAME: '\u975e\u975e768 \u52a9\u7406',
  BRAND_NAME: '\u975e\u975e768',
  SERVICE_PRICE: 'NT$3,800',
  CALENDAR_ID: '1cb0aeeafa55fb75407aa932bb3b1d84e322a7bab04e54099d432b2cc9bcd976@group.calendar.google.com',
  TIME_SLOTS: ['10:30', '11:30', '14:00', '15:00', '16:00'],
  TUESDAY_EXTRA_SLOTS: ['18:00'], // 僅週二開放的延長時段
  AVAILABLE_DAYS: [1, 2, 3, 4, 5], // 週一到五
  MIN_ADVANCE_DAYS: 1, // \u660e\u5929\u8d77\u53ef\u9810\u7d04\uff1b\u7576\u5929\u8acb\u79c1\u8a0a\u5b98\u65b9 LINE
  MAX_ADVANCE_DAYS: 30,
  VALID_CONSULT_MODES: ['\u8996\u8a0a', '\u73fe\u5834'],
  VALID_BIRTH_CALENDARS: ['\u6c11\u570b'],
  MAX_FIELD_LENGTH: 500,
  RATE_LIMIT_SECONDS: 60, // 同一 email 最短間隔
  LIFF_ID: '2009821980-46y6BEMh',
  LINE_API_URL: 'https://api.line.me/v2/bot/message/push'
};

// Channel Access Token 從 Script Properties 讀取（避免硬編碼到原始碼）
// 設定方式：Apps Script Project Settings → Script Properties → Add
// Key: LINE_CHANNEL_ACCESS_TOKEN
function getLineToken() {
  return PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
}

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
  sheet.getRange(1, 1, 1, 15).setValues([[
    '\u63d0\u4ea4\u6642\u9593', '\u9810\u7d04\u65e5\u671f', '\u9810\u7d04\u6642\u6bb5', '\u59d3\u540d', '\u96fb\u8a71',
    'Email', '\u5099\u8a3b', '\u72c0\u614b', '\u78ba\u8a8d\u6642\u9593', 'LINE UID',
    '\u751f\u5e74\u6708\u65e5', 'IG \u5e33\u865f', '\u532f\u6b3e\u672b\u4e94\u78bc', '\u8aee\u8a62\u65b9\u5f0f', 'LINE \u540d\u7a31'
  ]]);
  var header = sheet.getRange(1, 1, 1, 15);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['\u5f85\u78ba\u8a8d', '\u5df2\u78ba\u8a8d', '\u5df2\u53d6\u6d88', '\u5df2\u5b8c\u6210'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 8, 100, 1).setDataValidation(rule);
  for (var i = 1; i <= 15; i++) {
    sheet.autoResizeColumn(i);
  }
}

// 已存在的 Sheet 補上 LINE UID 欄位（不影響既有資料）
// 首次啟用 LINE 整合時執行一次即可
function migrateSheetAddLineUid() {
  var sheet = getSheet();
  var currentWidth = sheet.getLastColumn();
  if (currentWidth >= 11) {
    Logger.log('Sheet already has LINE UID column, skipping');
    return;
  }
  sheet.getRange(1, 11).setValue('LINE UID');
  var header = sheet.getRange(1, 11);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  sheet.autoResizeColumn(11);
  Logger.log('LINE UID column added');
}

// 已存在的 Sheet 補上 4 個新欄位（生年月日 / IG 帳號 / 匯款末五碼 / 諮詢方式）
// 部署後請手動執行一次：在 Apps Script 編輯器選 migrateSheetAddBookingFields → Run
function migrateSheetAddBookingFields() {
  var sheet = getSheet();
  var currentWidth = sheet.getLastColumn();
  if (currentWidth >= 14) {
    Logger.log('Sheet already has new booking fields, skipping');
    return;
  }
  var newHeaders = [['生年月日', 'IG 帳號', '匯款末五碼', '諮詢方式']];
  sheet.getRange(1, 11, 1, 4).setValues(newHeaders);
  var header = sheet.getRange(1, 11, 1, 4);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  for (var i = 11; i <= 14; i++) {
    sheet.autoResizeColumn(i);
  }
  Logger.log('Booking fields migration complete (生年月日 / IG 帳號 / 匯款末五碼 / 諮詢方式)');
}

// 為 Sheet 寫入第 15 欄「LINE 名稱」表頭。
// Idempotent — 不檢查 currentWidth，永遠覆寫 O1。
// 為什麼不檢查：若先部署後跑 migration，appendRow 已把 last column 推到 15、
// 但 O1 是空的，舊邏輯會早退讓 header 永遠補不上。
function migrateSheetAddLineName() {
  var sheet = getSheet();
  sheet.getRange(1, 15).setValue('LINE 名稱');
  var header = sheet.getRange(1, 15);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  sheet.autoResizeColumn(15);
  Logger.log('LINE 名稱 header set (idempotent)');
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
    var daySlots = getSlotsForDate(date);

    for (var s = 0; s < daySlots.length; s++) {
      var parts = daySlots[s].split(':');
      var slotStart = new Date(date);
      slotStart.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      var slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1hr 用毫秒避免 setHours 跨日問題

      for (var e = 0; e < events.length; e++) {
        var ev = events[e];
        if (ev.isAllDayEvent()) {
          var evDate = formatDateKey(ev.getStartTime());
          var evEndDate = formatDateKey(ev.getEndTime());
          if (dateStr >= evDate && dateStr < evEndDate) {
            blocks.push([dateStr, daySlots[s], '\u4e0d\u958b\u653e']);
            break;
          }
        } else if (ev.getStartTime() < slotEnd && ev.getEndTime() > slotStart) {
          blocks.push([dateStr, daySlots[s], '\u4e0d\u958b\u653e']);
          break;
        }
      }
    }
  }
  return blocks;
}

// 取得該日期可預約的時段（一般時段 + 週二延長時段）
function getSlotsForDate(date) {
  var d = (date instanceof Date) ? date : new Date(date + 'T00:00:00');
  var extra = (d.getDay() === 2 && SETTINGS.TUESDAY_EXTRA_SLOTS) ? SETTINGS.TUESDAY_EXTRA_SLOTS : [];
  return SETTINGS.TIME_SLOTS.concat(extra);
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
      var data = source.getRange(2, 1, lastRow - 1, 9).getValues();
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var status = row[7];
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
  if (!data.consultMode) errors.push('缺少諮詢方式');
  if (!data.birthCalendar) errors.push('缺少生年月日曆法');
  if (!data.birthDate) errors.push('缺少生年月日');
  if (!data.igAccount) errors.push('缺少 IG 帳號');
  if (!data.lineName) errors.push('缺少 LINE 名稱');
  if (!data.paymentLast5) errors.push('缺少匯款末五碼');
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

  // 時段是否有效（含週二延長時段）
  if (getSlotsForDate(bookDate).indexOf(data.time) === -1) errors.push('無效的時段');

  // 諮詢方式是否有效
  if (SETTINGS.VALID_CONSULT_MODES.indexOf(data.consultMode) === -1) errors.push('無效的諮詢方式');

  // 生年月日曆法是否有效
  if (SETTINGS.VALID_BIRTH_CALENDARS.indexOf(data.birthCalendar) === -1) errors.push('無效的曆法');

  // 生年月日格式 yyyy/mm/dd（前端組合好送過來）
  if (!/^\d{1,4}\/\d{1,2}\/\d{1,2}$/.test(data.birthDate)) errors.push('生年月日格式無效');

  // 匯款末五碼：5 位數字
  if (!/^\d{5}$/.test(data.paymentLast5)) errors.push('匯款末五碼應為 5 位數字');

  // IG 帳號長度限制
  if (typeof data.igAccount !== 'string' || data.igAccount.length > 50) errors.push('IG 帳號格式無效');

  // LINE 名稱長度限制
  if (typeof data.lineName !== 'string' || data.lineName.length > 50) errors.push('LINE 名稱格式無效');

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
  var data = sheet.getRange(2, 2, lastRow - 1, 7).getValues(); // columns B-H
  for (var i = 0; i < data.length; i++) {
    var rowDate = formatDateKey(data[i][0]);
    var rowTime = formatTimeKey(data[i][1]);
    var rowStatus = data[i][6]; // column H = 狀態
    if (rowDate === date && rowTime === time &&
        (rowStatus === '\u5f85\u78ba\u8a8d' || rowStatus === '\u5df2\u78ba\u8a8d')) {
      return true;
    }
  }
  return false;
}

// ===== 版本檢查（方便確認部署是否更新）=====
// 用瀏覽器打開 Web App URL 會看到這個回應
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      version: 'BOOKING-v6-2026-05-05-add-linename',
      hasLinePush: typeof sendLinePush === 'function',
      hasLineReceived: typeof sendLineBookingReceived === 'function',
      tokenSet: !!getLineToken(),
      liffId: SETTINGS.LIFF_ID,
      now: new Date().toISOString()
    }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
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
      var lineUid = typeof data.lineUid === 'string' ? data.lineUid.substring(0, 50) : '';
      var birthDisplay = data.birthCalendar + ' ' + data.birthDate;
      sheet.appendRow([
        new Date(),
        data.date,
        data.time,
        sanitizeText(data.name, 50),
        data.phone.replace(/[-\s]/g, ''),
        data.email.trim(),
        sanitizeText(data.notes || '', SETTINGS.MAX_FIELD_LENGTH),
        '\u5f85\u78ba\u8a8d',
        '',
        lineUid,
        sanitizeText(birthDisplay, 30),
        sanitizeText(data.igAccount, 50),
        data.paymentLast5,
        data.consultMode,
        sanitizeText(data.lineName, 50)
      ]);
    } finally {
      lock.releaseLock();
    }

    // 6. 鎖外執行非關鍵操作 — 任一失敗都不影響預約成功狀態
    //    （資料已寫入 Sheet，通知/同步可後續手動補；避免客戶看到失敗卻其實已預約）
    var warnings = [];
    if (SETTINGS.ASSISTANT_EMAIL) {
      try {
        sendAssistantNotification(data);
      } catch (e) {
        warnings.push('assistant_email_failed');
        Logger.log('sendAssistantNotification error: ' + e.message);
      }
    }
    if (data.lineUid) {
      try {
        sendLineBookingReceived(data);
      } catch (e) {
        warnings.push('line_push_failed');
        Logger.log('sendLineBookingReceived error: ' + e.message);
      }
    }
    try {
      syncPublicSheet();
    } catch (e) {
      warnings.push('sync_public_sheet_failed');
      Logger.log('syncPublicSheet error: ' + e.message);
    }

    var result = { success: true };
    if (warnings.length > 0) result.warnings = warnings;
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== Email 通知 =====

// 統一寄件入口：用 GmailApp + 驗證過的 alias 寄信，這樣 From 顯示為品牌助理而非 Apps Script 擁有者
// SENDER_EMAIL 必須是「Send mail as」已驗證的 alias，否則 GmailApp.sendEmail 會 throw
function sendBrandEmail(opts) {
  var fromAddr = SETTINGS.SENDER_EMAIL;
  if (fromAddr) {
    GmailApp.sendEmail(opts.to, opts.subject, opts.body, {
      from: fromAddr,
      name: SETTINGS.SENDER_NAME || SETTINGS.BRAND_NAME,
      htmlBody: opts.htmlBody
    });
  } else {
    // 沒設定 alias 就降級用 MailApp（From 是 Apps Script 擁有者）
    MailApp.sendEmail({
      to: opts.to,
      subject: opts.subject,
      body: opts.body,
      htmlBody: opts.htmlBody
    });
  }
}

function sendAssistantNotification(data) {
  var displayDate = data.dateDisplay || data.date;
  var name = sanitizeText(data.name, 50);
  var notes = sanitizeText(data.notes || '\u7121', 200);
  var subject = '[\u65b0\u9810\u7d04] ' + sanitizeText(data.name, 20) + ' - ' + displayDate + ' ' + data.time;

  var igAccount = sanitizeText(data.igAccount || '', 50);
  var lineName = sanitizeText(data.lineName || '', 50);
  var birthDisplay = (data.birthCalendar || '') + ' ' + (data.birthDate || '');
  var consultMode = data.consultMode || '';
  var paymentLast5 = data.paymentLast5 || '';

  var plainBody = SETTINGS.BRAND_NAME + ' \u65b0\u9810\u7d04\uff1a\n\n'
    + '\u59d3\u540d\uff1a' + name + '\n'
    + '\u96fb\u8a71\uff1a' + data.phone + '\n'
    + 'Email\uff1a' + data.email + '\n'
    + '\u751f\u5e74\u6708\u65e5\uff1a' + birthDisplay + '\n'
    + 'IG \u5e33\u865f\uff1a' + igAccount + '\n'
    + 'LINE \u540d\u7a31\uff1a' + lineName + '\n'
    + '\u65e5\u671f\uff1a' + displayDate + '\n'
    + '\u6642\u6bb5\uff1a' + data.time + '\n'
    + '\u8aee\u8a62\u65b9\u5f0f\uff1a' + consultMode + '\n'
    + '\u532f\u6b3e\u672b\u4e94\u78bc\uff1a' + paymentLast5 + '\n'
    + '\u5099\u8a3b\uff1a' + notes + '\n\n'
    + '\u8acb\u5230 Google Sheet \u5c07\u72c0\u614b\u6539\u70ba\u300c\u5df2\u78ba\u8a8d\u300d\uff0c\u7cfb\u7d71\u6703\u81ea\u52d5\u901a\u77e5\u5ba2\u6236\u3002';

  var content = ''
    + '<p style="margin:0 0 6px;font-size:13px;color:#7B5EA7;font-weight:700;letter-spacing:1px;">\u65b0\u9810\u7d04\u901a\u77e5</p>'
    + '<p style="margin:0 0 20px;font-size:20px;color:#2C1810;font-weight:700;">' + name + '</p>'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;border-radius:12px;padding:16px 20px;margin-bottom:20px;">'
    + infoRow('\u65e5\u671f', displayDate)
    + infoRow('\u6642\u6bb5', data.time)
    + infoRow('\u8aee\u8a62\u65b9\u5f0f', consultMode)
    + infoRow('\u751f\u5e74\u6708\u65e5', birthDisplay)
    + infoRow('IG \u5e33\u865f', igAccount)
    + infoRow('LINE \u540d\u7a31', lineName)
    + infoRow('\u96fb\u8a71', data.phone)
    + infoRow('Email', data.email)
    + infoRow('\u532f\u6b3e\u672b\u4e94\u78bc', paymentLast5)
    + infoRow('\u5099\u8a3b', notes)
    + '</table>'
    + '<p style="margin:0;font-size:13px;color:#2C1810;opacity:0.6;line-height:1.6;">'
    + '\u8acb\u5230 Google Sheet \u5c07\u72c0\u614b\u6539\u70ba\u300c\u5df2\u78ba\u8a8d\u300d\uff0c\u7cfb\u7d71\u6703\u81ea\u52d5\u901a\u77e5\u5ba2\u6236\u3002'
    + '</p>';

  sendBrandEmail({
    to: SETTINGS.ASSISTANT_EMAIL,
    subject: subject,
    body: plainBody,
    htmlBody: brandEmailTemplate(content)
  });
}

function checkStatusChanges() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    syncPublicSheet();
    return;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 10);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[7];
    var confirmTime = row[8];
    var lineUid = row[9] || '';

    if (status === '\u5df2\u78ba\u8a8d' && !confirmTime) {
      var booking = {
        date: formatDateKey(row[1]),
        time: formatTimeKey(row[2]),
        name: row[3],
        phone: row[4],
        email: row[5],
        lineUid: lineUid
      };
      sendCustomerConfirmation(booking);
      if (lineUid) sendLineBookingConfirmed(booking);
      sheet.getRange(i + 2, 9).setValue(new Date());
    }

    // 取消：用特殊標記區分已確認過的，避免 confirmTime 擋住取消通知
    if (status === '\u5df2\u53d6\u6d88') {
      var marker = String(confirmTime);
      if (marker.indexOf('\u53d6\u6d88\u5df2\u901a\u77e5') === -1) {
        var booking2 = {
          date: formatDateKey(row[1]),
          time: formatTimeKey(row[2]),
          name: row[3],
          email: row[5],
          lineUid: lineUid
        };
        sendCancellationNotice(booking2);
        if (lineUid) sendLineBookingCancelled(booking2);
        sheet.getRange(i + 2, 9).setValue('\u53d6\u6d88\u5df2\u901a\u77e5 ' + new Date().toLocaleString());
      }
    }
  }
  syncPublicSheet();
}

function brandEmailTemplate(content) {
  return '<!DOCTYPE html>'
    + '<html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background-color:#FDF8F3;font-family:\'Noto Sans TC\',Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;padding:32px 16px;">'
    + '<tr><td align="center">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(44,24,16,0.06);">'
    // Header
    + '<tr><td style="background-color:#7B5EA7;padding:24px 32px;text-align:center;">'
    + '<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:1px;">' + SETTINGS.BRAND_NAME + '</h1>'
    + '<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">\u7642\u80b2\u578b\u554f\u4e8b</p>'
    + '</td></tr>'
    // Body
    + '<tr><td style="padding:32px;">'
    + content
    + '</td></tr>'
    // Footer
    + '<tr><td style="padding:20px 32px;background-color:#F6EFE7;text-align:center;">'
    + '<p style="margin:0;font-size:12px;color:#2C1810;opacity:0.45;">\u5982\u6709\u4efb\u4f55\u554f\u984c\uff0c\u8acb\u900f\u904e LINE \u806f\u7e6b\u6211\u5011</p>'
    + '<p style="margin:6px 0 0;font-size:12px;color:#7B5EA7;font-weight:500;">' + SETTINGS.BRAND_NAME + '</p>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

function infoRow(label, value) {
  return '<tr>'
    + '<td style="padding:8px 0;font-size:14px;color:#2C1810;opacity:0.5;width:70px;vertical-align:top;">' + label + '</td>'
    + '<td style="padding:8px 0;font-size:14px;color:#2C1810;font-weight:500;">' + value + '</td>'
    + '</tr>';
}

function sendCustomerConfirmation(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var subject = '[\u9810\u7d04\u78ba\u8a8d] ' + SETTINGS.BRAND_NAME + ' - ' + dateStr + ' ' + timeStr;

  var content = ''
    + '<p style="margin:0 0 8px;font-size:16px;color:#2C1810;">' + booking.name + ' \u60a8\u597d\uff0c</p>'
    + '<p style="margin:0 0 24px;font-size:15px;color:#2C1810;line-height:1.6;">\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u5df2<span style="color:#7B5EA7;font-weight:700;">\u78ba\u8a8d</span>\uff01\u4ee5\u4e0b\u662f\u60a8\u7684\u9810\u7d04\u8cc7\u8a0a\uff1a</p>'
    // Info card
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;border-radius:12px;padding:16px 20px;margin-bottom:24px;">'
    + infoRow('\u65e5\u671f', dateStr)
    + infoRow('\u6642\u6bb5', timeStr)
    + infoRow('\u8cbb\u7528', '<span style="color:#7B5EA7;font-weight:700;">' + SETTINGS.SERVICE_PRICE + '</span>')
    + '</table>'
    + '<p style="margin:0;font-size:13px;color:#2C1810;opacity:0.6;line-height:1.6;">'
    + '\u8aee\u8a62\u65b9\u5f0f\u5c07\u7531\u52a9\u7406\u53e6\u884c\u901a\u77e5\u3002<br>'
    + '\u5982\u9700\u66f4\u6539\u6216\u53d6\u6d88\uff0c\u8acb\u63d0\u524d\u806f\u7e6b\u6211\u5011\u3002'
    + '</p>';

  var plainBody = booking.name + ' \u60a8\u597d\uff0c\n\n\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u5df2\u78ba\u8a8d\uff01\n\n\u65e5\u671f\uff1a' + dateStr + '\n\u6642\u6bb5\uff1a' + timeStr + '\n\u8cbb\u7528\uff1a' + SETTINGS.SERVICE_PRICE + '\n\n' + SETTINGS.BRAND_NAME;

  sendBrandEmail({
    to: booking.email,
    subject: subject,
    body: plainBody,
    htmlBody: brandEmailTemplate(content)
  });
}

function sendCancellationNotice(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var subject = '[\u9810\u7d04\u53d6\u6d88] ' + SETTINGS.BRAND_NAME + ' - ' + dateStr + ' ' + timeStr;

  var content = ''
    + '<p style="margin:0 0 8px;font-size:16px;color:#2C1810;">' + booking.name + ' \u60a8\u597d\uff0c</p>'
    + '<p style="margin:0 0 24px;font-size:15px;color:#2C1810;line-height:1.6;">\u5f88\u62b1\u6b49\uff0c\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u56e0\u6642\u9593\u7121\u6cd5\u914d\u5408\uff0c\u5df2<span style="color:#D4829C;font-weight:700;">\u53d6\u6d88</span>\u3002</p>'
    // Info card
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;border-radius:12px;padding:16px 20px;margin-bottom:24px;">'
    + infoRow('\u539f\u8a02\u65e5\u671f', dateStr)
    + infoRow('\u539f\u8a02\u6642\u6bb5', timeStr)
    + '</table>'
    + '<p style="margin:0;font-size:13px;color:#2C1810;opacity:0.6;line-height:1.6;">'
    + '\u6b61\u8fce\u91cd\u65b0\u9810\u7d04\u5176\u4ed6\u6642\u6bb5\uff0c\u9020\u6210\u4e0d\u4fbf\u8acb\u898b\u8ad2\u3002'
    + '</p>';

  var plainBody = booking.name + ' \u60a8\u597d\uff0c\n\n\u5f88\u62b1\u6b49\uff0c\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u5df2\u53d6\u6d88\u3002\n\n\u539f\u8a02\u65e5\u671f\uff1a' + dateStr + '\n\u539f\u8a02\u6642\u6bb5\uff1a' + timeStr + '\n\n' + SETTINGS.BRAND_NAME;

  sendBrandEmail({
    to: booking.email,
    subject: subject,
    body: plainBody,
    htmlBody: brandEmailTemplate(content)
  });
}

function testSync() {
  syncPublicSheet();
  Logger.log('Public sheet synced (with calendar blocks)');
}

// ===== LINE 推播 =====

function sendLinePush(uid, messages) {
  var token = getLineToken();
  if (!token) {
    Logger.log('LINE token not configured in Script Properties');
    return;
  }
  if (!uid) return;
  try {
    var response = UrlFetchApp.fetch(SETTINGS.LINE_API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify({ to: uid, messages: messages }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('LINE push failed ' + code + ': ' + response.getContentText());
    }
  } catch (e) {
    Logger.log('LINE push error: ' + e.message);
  }
}

function sendLineBookingReceived(data) {
  var dateDisplay = data.dateDisplay || data.date;
  var text = '✨ ' + SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + '已收到您的預約申請：\n'
    + '📅 ' + dateDisplay + '  ' + data.time + '\n'
    + '費用：' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '助理會盡快與非非確認時間，確認後會再通知您 🙏';
  sendLinePush(data.lineUid, [{ type: 'text', text: text }]);
}

function sendLineBookingConfirmed(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var text = '🌸 ' + SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + (booking.name || '您') + ' 您好，\n'
    + '您的諮詢預約已確認！\n\n'
    + '📅 日期：' + dateStr + '\n'
    + '🕒 時段：' + timeStr + '\n'
    + '費用：' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '諮詢方式將由助理另行通知。\n'
    + '如需更改或取消，請提前聯繫我們 🙏';
  sendLinePush(booking.lineUid, [{ type: 'text', text: text }]);
}

function sendLineBookingCancelled(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var text = SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + (booking.name || '您') + ' 您好，\n'
    + '很抱歉，您的諮詢預約因時間無法配合，已取消。\n\n'
    + '原訂日期：' + dateStr + ' ' + timeStr + '\n\n'
    + '歡迎重新預約其他時段，造成不便敬請見諒 🙏';
  sendLinePush(booking.lineUid, [{ type: 'text', text: text }]);
}

// 測試：直接推一則 LINE 訊息給你自己（完全不碰 Web App 部署）
// 用法：編輯下面 YOUR_UID，貼上你的 LINE UID（從預約頁右上角 debug 顯示抓，開頭是 U）
// 然後在 Apps Script 編輯器直接 Run testDirectLinePush
// 如果這個能收到，代表 Code.gs + Token 都正常，問題單純在 Web App 部署沒更新
function testDirectLinePush() {
  var YOUR_UID = 'Uxxxxxxxxxxxxxxxxxxxx';  // ← 改成你的真實 UID
  if (YOUR_UID.indexOf('Uxxx') === 0) {
    Logger.log('❌ 請先編輯函式，填入你的真實 LINE UID');
    return;
  }
  sendLineBookingReceived({
    date: '2026-05-15',
    dateDisplay: '5/15（五）',
    time: '10:00',
    lineUid: YOUR_UID
  });
  Logger.log('✓ Push 已發送，請檢查你的 LINE 有沒有收到「已收到您的預約申請」訊息');
}

// 測試：檢查 token 設定是否正確（不會真的發訊息）
function testLineToken() {
  var token = getLineToken();
  if (!token) {
    Logger.log('❌ LINE_CHANNEL_ACCESS_TOKEN 未設定，請到 Project Settings → Script Properties 加入');
    return;
  }
  try {
    var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/info', {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code === 200) {
      Logger.log('✅ Token 有效，Bot info: ' + response.getContentText());
    } else {
      Logger.log('❌ Token 無效 (' + code + '): ' + response.getContentText());
    }
  } catch (e) {
    Logger.log('❌ Token 測試失敗: ' + e.message);
  }
}
