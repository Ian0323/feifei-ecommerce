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
  TIME_SLOTS: ['10:30', '11:30', '14:30', '15:30', '16:30'],
  TUESDAY_EXTRA_SLOTS: [], // 僅週二開放的延長時段（2026-07-23 業主要求先關閉；要開回來填 ['18:00'] 即可）
  AVAILABLE_DAYS: [1, 2, 3, 4, 5], // 週一到五
  MIN_ADVANCE_DAYS: 1, // \u660e\u5929\u8d77\u53ef\u9810\u7d04\uff1b\u7576\u5929\u8acb\u79c1\u8a0a\u5b98\u65b9 LINE
  MAX_ADVANCE_DAYS: 30,
  VALID_CONSULT_MODES: ['\u8996\u8a0a', '\u73fe\u5834'],
  VALID_BIRTH_CALENDARS: ['\u6c11\u570b'],
  MAX_FIELD_LENGTH: 500,
  RATE_LIMIT_SECONDS: 60, // 同一 email 最短間隔
  LIFF_ID: '2009821980-46y6BEMh',
  LINE_API_URL: 'https://api.line.me/v2/bot/message/push',
  LINE_ID_TOKEN_VERIFY_URL: 'https://api.line.me/oauth2/v2.1/verify',
  TIMEZONE: 'Asia/Taipei',
  // Sheet columns (1-based): keep 1–15 stable; append automation columns at end
  COL_BOOKING_ID: 16,
  COL_CALENDAR_EVENT_ID: 17,
  COL_REMINDER_AT: 18,
  COL_LINE_FRIEND_STATUS: 19
};

// Channel Access Token 從 Script Properties 讀取（避免硬編碼到原始碼）
// 設定方式：Apps Script Project Settings → Script Properties → Add
// Key: LINE_CHANNEL_ACCESS_TOKEN
// Key: LINE_LOGIN_CHANNEL_ID  （LINE Login channel ID，用於驗證 ID token）
function getLineToken() {
  return PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
}

function getLineLoginChannelId() {
  return PropertiesService.getScriptProperties().getProperty('LINE_LOGIN_CHANNEL_ID');
}

function getSheet() {
  var ss = SpreadsheetApp.openById(SETTINGS.SHEET_ID);
  return ss.getSheetByName(SETTINGS.SHEET_NAME);
}

function getPrivateSheetHeaders_() {
  return [
    '\u63d0\u4ea4\u6642\u9593', '\u9810\u7d04\u65e5\u671f', '\u9810\u7d04\u6642\u6bb5', '\u59d3\u540d', '\u96fb\u8a71',
    'Email', '\u5099\u8a3b', '\u72c0\u614b', '\u78ba\u8a8d\u6642\u9593', 'LINE UID',
    '\u751f\u5e74\u6708\u65e5', 'IG \u5e33\u865f', '\u532f\u6b3e\u672b\u4e94\u78bc', '\u8aee\u8a62\u65b9\u5f0f', 'LINE \u540d\u7a31',
    '\u9810\u7d04\u7de8\u865f', 'Calendar Event ID', '\u63d0\u9192\u6642\u9593', 'LINE \u597d\u53cb\u72c0\u614b'
  ];
}

function initSheet() {
  var ss = SpreadsheetApp.openById(SETTINGS.SHEET_ID);
  var sheet = ss.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS.SHEET_NAME);
  }
  var headers = getPrivateSheetHeaders_();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var header = sheet.getRange(1, 1, 1, headers.length);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['\u5f85\u78ba\u8a8d', '\u5df2\u78ba\u8a8d', '\u5df2\u53d6\u6d88', '\u5df2\u5b8c\u6210'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 8, 100, 1).setDataValidation(rule);
  for (var i = 1; i <= headers.length; i++) {
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

// Booking v2 automation columns (P–S). Idempotent — never clears existing data.
// Deploy 後請執行一次：migrateBookingAutomationColumns
function migrateBookingAutomationColumns() {
  var sheet = getSheet();
  var headers = [
    { col: SETTINGS.COL_BOOKING_ID, title: '\u9810\u7d04\u7de8\u865f' },
    { col: SETTINGS.COL_CALENDAR_EVENT_ID, title: 'Calendar Event ID' },
    { col: SETTINGS.COL_REMINDER_AT, title: '\u63d0\u9192\u6642\u9593' },
    { col: SETTINGS.COL_LINE_FRIEND_STATUS, title: 'LINE \u597d\u53cb\u72c0\u614b' }
  ];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    var current = String(sheet.getRange(1, h.col).getValue() || '').trim();
    if (current !== h.title) {
      sheet.getRange(1, h.col).setValue(h.title);
    }
    var headerCell = sheet.getRange(1, h.col);
    headerCell.setFontWeight('bold');
    headerCell.setBackground('#7B5EA7');
    headerCell.setFontColor('#FFFFFF');
    sheet.autoResizeColumn(h.col);
  }
  Logger.log('Booking automation columns P–S ready (idempotent)');
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

function getCalendar_() {
  var calId = SETTINGS.CALENDAR_ID;
  if (calId) {
    return CalendarApp.getCalendarById(calId);
  }
  return CalendarApp.getDefaultCalendar();
}

function getCalendarBlocks() {
  var calendar = getCalendar_();
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
      slotStart.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
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

/**
 * 預約送出專用：只把「這一筆」寫入公開 Sheet，不掃 Calendar、不重建整表。
 * 完整同步交給 checkStatusChanges / syncPublicSheet（背景 Trigger）。
 */
function appendPublicBookingSlot_(date, time, status) {
  if (!SETTINGS.PUBLIC_SHEET_ID) return;

  var dateKey = formatDateKey(date);
  var timeKey = formatTimeKey(time);
  var statusVal = status || '\u5f85\u78ba\u8a8d';

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('appendPublicBookingSlot_: could not acquire lock, skipping');
    return;
  }
  try {
    var target = SpreadsheetApp.openById(SETTINGS.PUBLIC_SHEET_ID)
      .getSheetByName(SETTINGS.PUBLIC_SHEET_NAME);
    if (!target) return;

    var lastRow = target.getLastRow();
    if (lastRow > 1) {
      // getRange(row, column, numRows, numColumns)
      var existing = target.getRange(2, 1, lastRow - 1, 3).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (formatDateKey(existing[i][0]) === dateKey && formatTimeKey(existing[i][1]) === timeKey) {
          target.getRange(i + 2, 3).setValue(statusVal);
          return;
        }
      }
    }
    target.appendRow([dateKey, timeKey, statusVal]);
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

function syncPublicSheet() {
  if (!SETTINGS.PUBLIC_SHEET_ID) return;

  // Calendar 讀取可能很慢，必須在鎖外執行，避免卡住 doPost 預約寫入
  var calBlocks = [];
  try {
    calBlocks = getCalendarBlocks() || [];
  } catch (calErr) {
    Logger.log('syncPublicSheet getCalendarBlocks error: ' + calErr.message);
  }

  // 只在讀寫 Sheet 時短鎖；搶不到就跳過（公開時段可下次再同步）
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) {
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
      // getRange(row, column, numRows, numColumns)
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
    return Utilities.formatDate(val, SETTINGS.TIMEZONE, 'yyyy-MM-dd');
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
    return Utilities.formatDate(val, SETTINGS.TIMEZONE, 'HH:mm');
  }
  var str = String(val);
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatTimeKey(parsed);
  return str;
}

function formatTaipeiNow() {
  return Utilities.formatDate(new Date(), SETTINGS.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function getTaipeiDateString(offsetDays) {
  var d = new Date();
  if (offsetDays) {
    d = new Date(d.getTime() + offsetDays * 86400000);
  }
  return Utilities.formatDate(d, SETTINGS.TIMEZONE, 'yyyy-MM-dd');
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

// ===== Booking ID =====

function generateBookingId() {
  var datePart = Utilities.formatDate(new Date(), SETTINGS.TIMEZONE, 'yyMMdd');
  var rand = Utilities.getUuid().replace(/-/g, '').substring(0, 4).toUpperCase();
  return 'F768-' + datePart + '-' + rand;
}

// ===== LINE ID token 驗證 =====
// 官方文件：POST https://api.line.me/oauth2/v2.1/verify
// body: id_token, client_id
// 成功回傳 sub（= LINE userId）等欄位
function verifyLineIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    return { ok: false, error: 'missing_id_token' };
  }
  var clientId = getLineLoginChannelId();
  if (!clientId) {
    Logger.log('LINE_LOGIN_CHANNEL_ID not set in Script Properties');
    return { ok: false, error: 'channel_id_not_configured' };
  }
  try {
    var response = UrlFetchApp.fetch(SETTINGS.LINE_ID_TOKEN_VERIFY_URL, {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        id_token: idToken,
        client_id: clientId
      },
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var bodyText = response.getContentText();
    if (code !== 200) {
      Logger.log('LINE ID token verify failed ' + code + ': ' + bodyText);
      return { ok: false, error: 'verify_http_' + code, status: code };
    }
    var payload = JSON.parse(bodyText);
    if (!payload || !payload.sub) {
      return { ok: false, error: 'missing_sub' };
    }
    if (payload.aud && String(payload.aud) !== String(clientId)) {
      Logger.log('LINE ID token aud mismatch');
      return { ok: false, error: 'aud_mismatch' };
    }
    return {
      ok: true,
      sub: String(payload.sub),
      name: payload.name || '',
      exp: payload.exp || null
    };
  } catch (e) {
    Logger.log('LINE ID token verify exception: ' + e.message);
    return { ok: false, error: 'verify_exception' };
  }
}

function normalizeFriendStatus_(flag) {
  if (flag === true || flag === 'true' || flag === '已確認好友') return '已確認好友';
  if (flag === false || flag === 'false' || flag === '未確認') return '未確認';
  if (typeof flag === 'string' && flag.trim()) return String(flag).trim().substring(0, 40);
  return '未確認';
}

// ===== 版本檢查（方便確認部署是否更新）=====
// 用瀏覽器打開 Web App URL 會看到這個回應
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      version: 'BOOKING-v7.2-2026-07-27-fast-submit',
      hasLinePush: typeof sendLinePush === 'function',
      hasLineReceived: typeof sendLineBookingReceived === 'function',
      hasCalendarCreate: typeof createPendingCalendarEvent === 'function',
      hasTomorrowReminder: typeof sendTomorrowBookingReminders === 'function',
      hasIdTokenVerify: typeof verifyLineIdToken === 'function',
      tokenSet: !!getLineToken(),
      lineLoginChannelIdSet: !!getLineLoginChannelId(),
      liffId: SETTINGS.LIFF_ID,
      timeSlots: SETTINGS.TIME_SLOTS,
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

    // 1b. 驗證 LINE ID token（後端唯一可信 UID 來源；不信任前端 raw lineUid）
    var tokenResult = verifyLineIdToken(data.lineIdToken);
    if (!tokenResult.ok) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'LINE_AUTH_REQUIRED',
          message: '請先透過 LINE 登入後再送出預約',
          detail: tokenResult.error || ''
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    data.lineUid = tokenResult.sub;
    var friendStatus = normalizeFriendStatus_(data.lineFriendFlag);
    var bookingId = generateBookingId();
    data.bookingId = bookingId;

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

    // 3. 加鎖 — 防止 TOCTOU（短鎖 + 重試；避免被 syncPublicSheet/Trigger 長時間卡住）
    var lock = LockService.getScriptLock();
    var gotLock = false;
    var lockAttempts = 0;
    while (lockAttempts < 4 && !gotLock) {
      lockAttempts++;
      gotLock = lock.tryLock(12000);
      if (!gotLock && lockAttempts < 4) {
        Utilities.sleep(400 * lockAttempts);
      }
    }
    if (!gotLock) {
      Logger.log('doPost SERVER_BUSY after ' + lockAttempts + ' lock attempts bookingId=' + bookingId);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'SERVER_BUSY',
          message: '\u7cfb\u7d71\u5fd9\u7891\u4e2d\uff0c\u8acb\u7a0d\u5f8c 10 \u79d2\u518d\u8a66'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sheetRow = null;
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

      // 5. 寫入（文字經過清理）— 欄位 1–19
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
        data.lineUid,
        sanitizeText(birthDisplay, 30),
        sanitizeText(data.igAccount, 50),
        data.paymentLast5,
        data.consultMode,
        sanitizeText(data.lineName, 50),
        bookingId,
        '', // Calendar Event ID — filled after lock
        '', // 提醒時間
        friendStatus
      ]);
      sheetRow = sheet.getLastRow();
    } finally {
      try { lock.releaseLock(); } catch (relErr) { /* ignore */ }
    }

    // 6. 鎖外非關鍵操作 — 任一失敗都不影響預約成功
    //    速度：先擋時段（公開表輕量寫入）→ Calendar → LINE → Email（Email 通常最慢放最後）
    //    完整公開表+Calendar 掃描改由 checkStatusChanges 背景做，避免客戶乾等 10+ 秒
    var warnings = [];

    try {
      appendPublicBookingSlot_(data.date, data.time, '\u5f85\u78ba\u8a8d');
    } catch (errSync) {
      warnings.push('sync_public_sheet_failed');
      Logger.log('appendPublicBookingSlot_ error: ' + errSync.message);
    }

    // Calendar：建立待確認事件（失敗不回滾預約）
    try {
      var eventId = createPendingCalendarEvent({
        bookingId: bookingId,
        date: data.date,
        time: data.time,
        name: data.name,
        phone: data.phone,
        igAccount: data.igAccount,
        paymentLast5: data.paymentLast5,
        status: '\u5f85\u78ba\u8a8d'
      });
      if (eventId && sheetRow) {
        getSheet().getRange(sheetRow, SETTINGS.COL_CALENDAR_EVENT_ID).setValue(eventId);
      } else if (!eventId) {
        warnings.push('calendar_event_failed');
      }
    } catch (errCal) {
      warnings.push('calendar_event_failed');
      Logger.log('createPendingCalendarEvent error bookingId=' + bookingId + ' row=' + sheetRow + ': ' + errCal.message);
    }

    if (data.lineUid) {
      try {
        sendLineBookingReceived(data);
      } catch (errLine) {
        warnings.push('line_push_failed');
        Logger.log('sendLineBookingReceived error: ' + errLine.message);
      }
    }

    if (SETTINGS.ASSISTANT_EMAIL) {
      try {
        sendAssistantNotification(data);
      } catch (errNotify) {
        warnings.push('assistant_email_failed');
        Logger.log('sendAssistantNotification error: ' + errNotify.message);
      }
    }

    var result = {
      success: true,
      bookingId: bookingId,
      lineConnected: true,
      warnings: warnings
    };
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== Google Calendar 同步 =====

function buildCalendarTitle_(statusLabel, name) {
  var safeName = sanitizeText(name || '客戶', 20);
  // strip leading quote from sanitize formula-injection guard for display titles
  if (safeName.charAt(0) === "'") safeName = safeName.substring(1);
  return '【' + statusLabel + '】' + safeName + '｜線上諮詢';
}

function buildCalendarDescription_(booking, statusLabel) {
  return '預約編號：' + (booking.bookingId || '') + '\n'
    + '姓名：' + (booking.name || '') + '\n'
    + '電話：' + (booking.phone || '') + '\n'
    + 'IG 帳號：' + (booking.igAccount || '') + '\n'
    + '匯款末五碼：' + (booking.paymentLast5 || '') + '\n'
    + '狀態：' + (statusLabel || booking.status || '') + '\n'
    + '（內部日曆 · 請至 Google Sheet 管理預約）';
}

function parseSlotDateTime_(dateStr, timeStr) {
  var parts = String(timeStr).split(':');
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  // Use explicit local components; CalendarApp uses script timezone (must be Asia/Taipei)
  var start = new Date(dateStr + 'T00:00:00');
  start.setHours(h, m, 0, 0);
  var end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start, end: end };
}

function createPendingCalendarEvent(booking) {
  var calendar = getCalendar_();
  if (!calendar) {
    Logger.log('createPendingCalendarEvent: calendar not found');
    return null;
  }
  var range = parseSlotDateTime_(booking.date, booking.time);
  var title = buildCalendarTitle_('\u5f85\u78ba\u8a8d', booking.name);
  var description = buildCalendarDescription_(booking, '\u5f85\u78ba\u8a8d');
  var event = calendar.createEvent(title, range.start, range.end, {
    description: description
  });
  return event ? event.getId() : null;
}

function isDeletedEventMarker_(val) {
  var s = String(val || '');
  return s.indexOf('已刪除') === 0 || s.indexOf('\u5df2\u522a\u9664') === 0;
}

function getCalendarEventById_(eventId) {
  if (!eventId || isDeletedEventMarker_(eventId)) return null;
  var calendar = getCalendar_();
  if (!calendar) return null;
  try {
    return calendar.getEventById(String(eventId));
  } catch (e) {
    Logger.log('getCalendarEventById_ error: ' + e.message);
    return null;
  }
}

function updateConfirmedCalendarEvent(booking, sheet, rowNumber, existingEventId) {
  var title = buildCalendarTitle_('\u5df2\u78ba\u8a8d', booking.name);
  var description = buildCalendarDescription_(booking, '\u5df2\u78ba\u8a8d');
  var event = getCalendarEventById_(existingEventId);
  if (event) {
    event.setTitle(title);
    event.setDescription(description);
    return existingEventId;
  }
  // Event missing — rebuild and write new ID
  var newId = createPendingCalendarEvent({
    bookingId: booking.bookingId,
    date: booking.date,
    time: booking.time,
    name: booking.name,
    phone: booking.phone,
    igAccount: booking.igAccount,
    paymentLast5: booking.paymentLast5
  });
  if (newId) {
    // update title to confirmed (createPending uses 待確認)
    var rebuilt = getCalendarEventById_(newId);
    if (rebuilt) {
      rebuilt.setTitle(title);
      rebuilt.setDescription(description);
    }
    if (sheet && rowNumber) {
      sheet.getRange(rowNumber, SETTINGS.COL_CALENDAR_EVENT_ID).setValue(newId);
    }
  }
  return newId;
}

function deleteCancelledCalendarEvent(sheet, rowNumber, existingEventId) {
  if (!existingEventId || isDeletedEventMarker_(existingEventId)) {
    return true; // idempotent
  }
  var event = getCalendarEventById_(existingEventId);
  if (!event) {
    // already gone — mark deleted
    if (sheet && rowNumber) {
      sheet.getRange(rowNumber, SETTINGS.COL_CALENDAR_EVENT_ID)
        .setValue('已刪除 ' + formatTaipeiNow());
    }
    return true;
  }
  event.deleteEvent();
  if (sheet && rowNumber) {
    sheet.getRange(rowNumber, SETTINGS.COL_CALENDAR_EVENT_ID)
      .setValue('已刪除 ' + formatTaipeiNow());
  }
  return true;
}

// 掃描未取消、未完成且 Event ID 空白的預約，補建 Calendar 事件
function backfillMissingCalendarEvents() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('backfillMissingCalendarEvents: no data rows');
    return;
  }
  var lastCol = Math.max(sheet.getLastColumn(), SETTINGS.COL_LINE_FRIEND_STATUS);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var candidates = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[7];
    var eventId = row[SETTINGS.COL_CALENDAR_EVENT_ID - 1];
    if ((status === '\u5f85\u78ba\u8a8d' || status === '\u5df2\u78ba\u8a8d') &&
        (!eventId || isDeletedEventMarker_(eventId))) {
      candidates.push(i);
    }
  }
  Logger.log('backfillMissingCalendarEvents: will process ' + candidates.length + ' rows');
  var created = 0;
  for (var c = 0; c < candidates.length; c++) {
    var idx = candidates[c];
    var r = data[idx];
    var booking = {
      bookingId: r[SETTINGS.COL_BOOKING_ID - 1] || '',
      date: formatDateKey(r[1]),
      time: formatTimeKey(r[2]),
      name: r[3],
      phone: r[4],
      igAccount: r[11] || '',
      paymentLast5: r[12] || '',
      status: r[7]
    };
    try {
      var newEventId = createPendingCalendarEvent(booking);
      if (newEventId) {
        if (booking.status === '\u5df2\u78ba\u8a8d') {
          var ev = getCalendarEventById_(newEventId);
          if (ev) {
            ev.setTitle(buildCalendarTitle_('\u5df2\u78ba\u8a8d', booking.name));
            ev.setDescription(buildCalendarDescription_(booking, '\u5df2\u78ba\u8a8d'));
          }
        }
        sheet.getRange(idx + 2, SETTINGS.COL_CALENDAR_EVENT_ID).setValue(newEventId);
        created++;
      }
    } catch (e) {
      Logger.log('backfill row ' + (idx + 2) + ' failed: ' + e.message);
    }
  }
  Logger.log('backfillMissingCalendarEvents: created ' + created);
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
  var bookingId = data.bookingId || '';

  var plainBody = SETTINGS.BRAND_NAME + ' \u65b0\u9810\u7d04\uff1a\n\n'
    + '\u9810\u7d04\u7de8\u865f\uff1a' + bookingId + '\n'
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
    + infoRow('\u9810\u7d04\u7de8\u865f', bookingId)
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
  var lastCol = Math.max(sheet.getLastColumn(), SETTINGS.COL_LINE_FRIEND_STATUS);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[7];
    var confirmTime = row[8];
    var lineUid = row[9] || '';
    var bookingId = row[SETTINGS.COL_BOOKING_ID - 1] || '';
    var calEventId = row[SETTINGS.COL_CALENDAR_EVENT_ID - 1] || '';
    var rowNumber = i + 2;

    if (status === '\u5df2\u78ba\u8a8d' && !confirmTime) {
      var booking = {
        date: formatDateKey(row[1]),
        time: formatTimeKey(row[2]),
        name: row[3],
        phone: row[4],
        email: row[5],
        lineUid: lineUid,
        bookingId: bookingId,
        igAccount: row[11] || '',
        paymentLast5: row[12] || ''
      };
      try {
        sendCustomerConfirmation(booking);
      } catch (eConfirm) {
        Logger.log('sendCustomerConfirmation error row=' + rowNumber + ' bookingId=' + bookingId + ': ' + eConfirm.message);
      }
      if (lineUid) {
        try {
          sendLineBookingConfirmed(booking);
        } catch (eLineC) {
          Logger.log('sendLineBookingConfirmed error row=' + rowNumber + ': ' + eLineC.message);
        }
      }
      try {
        updateConfirmedCalendarEvent(booking, sheet, rowNumber, calEventId);
      } catch (eCalC) {
        Logger.log('updateConfirmedCalendarEvent error bookingId=' + bookingId + ' row=' + rowNumber + ': ' + eCalC.message);
      }
      sheet.getRange(rowNumber, 9).setValue(new Date());
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
          lineUid: lineUid,
          bookingId: bookingId
        };
        try {
          sendCancellationNotice(booking2);
        } catch (eCancel) {
          Logger.log('sendCancellationNotice error row=' + rowNumber + ': ' + eCancel.message);
        }
        if (lineUid) {
          try {
            sendLineBookingCancelled(booking2);
          } catch (eLineX) {
            Logger.log('sendLineBookingCancelled error row=' + rowNumber + ': ' + eLineX.message);
          }
        }
        try {
          deleteCancelledCalendarEvent(sheet, rowNumber, calEventId);
        } catch (eCalX) {
          Logger.log('deleteCancelledCalendarEvent error bookingId=' + bookingId + ' row=' + rowNumber + ': ' + eCalX.message);
        }
        sheet.getRange(rowNumber, 9).setValue('\u53d6\u6d88\u5df2\u901a\u77e5 ' + new Date().toLocaleString());
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
    + (booking.bookingId ? infoRow('\u9810\u7d04\u7de8\u865f', booking.bookingId) : '')
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
    return { ok: false, status: 0, error: 'token_missing' };
  }
  if (!uid) {
    return { ok: false, status: 0, error: 'uid_missing' };
  }
  try {
    var response = UrlFetchApp.fetch(SETTINGS.LINE_API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify({ to: uid, messages: messages }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code !== 200) {
      Logger.log('LINE push failed ' + code + ': ' + body);
      return { ok: false, status: code, error: body, body: body };
    }
    return { ok: true, status: code, body: body };
  } catch (e) {
    Logger.log('LINE push error: ' + e.message);
    return { ok: false, status: 0, error: e.message };
  }
}

function sendLineBookingReceived(data) {
  var dateDisplay = data.dateDisplay || data.date;
  var text = '✨ ' + SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + '已收到您的預約申請：\n'
    + (data.bookingId ? ('預約編號：' + data.bookingId + '\n') : '')
    + '📅 ' + dateDisplay + '  ' + data.time + '\n'
    + '費用：' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '助理會盡快與非非確認時間，確認後會再通知您 🙏';
  return sendLinePush(data.lineUid, [{ type: 'text', text: text }]);
}

function sendLineBookingConfirmed(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var text = '🌸 ' + SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + (booking.name || '您') + ' 您好，\n'
    + '您的諮詢預約已確認！\n\n'
    + (booking.bookingId ? ('預約編號：' + booking.bookingId + '\n') : '')
    + '📅 日期：' + dateStr + '\n'
    + '🕒 時段：' + timeStr + '\n'
    + '費用：' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '諮詢方式將由助理另行通知。\n'
    + '如需更改或取消，請提前聯繫我們 🙏';
  return sendLinePush(booking.lineUid, [{ type: 'text', text: text }]);
}

function sendLineBookingCancelled(booking) {
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var text = SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
    + (booking.name || '您') + ' 您好，\n'
    + '很抱歉，您的諮詢預約因時間無法配合，已取消。\n\n'
    + '原訂日期：' + dateStr + ' ' + timeStr + '\n\n'
    + '歡迎重新預約其他時段，造成不便敬請見諒 🙏';
  return sendLinePush(booking.lineUid, [{ type: 'text', text: text }]);
}

// ===== 前一天提醒 =====

function sendBookingReminderEmail(booking) {
  if (!booking.email) return false;
  var dateStr = formatDateKey(booking.date);
  var timeStr = formatTimeKey(booking.time);
  var subject = '[預約提醒] ' + SETTINGS.BRAND_NAME + ' - 明天 ' + dateStr + ' ' + timeStr;
  var plainBody = (booking.name || '您') + ' 您好，\n\n'
    + '提醒您：明天有預約 ' + SETTINGS.BRAND_NAME + ' 療癒系問事（線上視訊）。\n\n'
    + '日期：' + dateStr + '\n'
    + '時段：' + timeStr + '\n'
    + (booking.bookingId ? ('預約編號：' + booking.bookingId + '\n') : '')
    + '\n如需更改，請聯繫官方 LINE。\n\n'
    + SETTINGS.BRAND_NAME;
  var content = ''
    + '<p style="margin:0 0 8px;font-size:16px;color:#2C1810;">' + (booking.name || '您') + ' 您好，</p>'
    + '<p style="margin:0 0 24px;font-size:15px;color:#2C1810;line-height:1.6;">提醒您：<strong>明天</strong>有預約 ' + SETTINGS.BRAND_NAME + ' 療癒系問事（線上視訊）。</p>'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;border-radius:12px;padding:16px 20px;margin-bottom:24px;">'
    + (booking.bookingId ? infoRow('預約編號', booking.bookingId) : '')
    + infoRow('日期', dateStr)
    + infoRow('時段', timeStr)
    + infoRow('方式', '線上視訊')
    + '</table>'
    + '<p style="margin:0;font-size:13px;color:#2C1810;opacity:0.6;line-height:1.6;">如需更改，請聯繫官方 LINE。</p>';
  sendBrandEmail({
    to: booking.email,
    subject: subject,
    body: plainBody,
    htmlBody: brandEmailTemplate(content)
  });
  return true;
}

function sendTomorrowBookingReminders() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('sendTomorrowBookingReminders: no rows');
    return;
  }
  var tomorrow = getTaipeiDateString(1);
  var lastCol = Math.max(sheet.getLastColumn(), SETTINGS.COL_LINE_FRIEND_STATUS);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var sent = 0;
  var skipped = 0;
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[7];
    var dateKey = formatDateKey(row[1]);
    var reminderAt = row[SETTINGS.COL_REMINDER_AT - 1];
    var lineUid = row[9] || '';
    var bookingId = row[SETTINGS.COL_BOOKING_ID - 1] || '';
    var rowNumber = i + 2;

    if (status !== '\u5df2\u78ba\u8a8d') {
      skipped++;
      continue;
    }
    if (dateKey !== tomorrow) {
      skipped++;
      continue;
    }
    if (reminderAt) {
      skipped++;
      continue;
    }

    var booking = {
      date: dateKey,
      time: formatTimeKey(row[2]),
      name: row[3],
      email: row[5],
      lineUid: lineUid,
      bookingId: bookingId
    };

    var pushResult = null;
    if (lineUid) {
      var text = '🌙 ' + SETTINGS.BRAND_NAME + ' 療癒系問事\n\n'
        + (booking.name || '您') + ' 您好，\n'
        + '提醒您：明天有預約諮詢（線上視訊）。\n\n'
        + '📅 日期：' + booking.date + '\n'
        + '🕒 時段：' + booking.time + '\n'
        + (booking.bookingId ? ('預約編號：' + booking.bookingId + '\n') : '')
        + '\n如需更改，請聯繫官方 LINE 🙏';
      pushResult = sendLinePush(lineUid, [{ type: 'text', text: text }]);
    }

    if (pushResult && pushResult.ok) {
      sheet.getRange(rowNumber, SETTINGS.COL_REMINDER_AT).setValue(formatTaipeiNow());
      sent++;
      continue;
    }

    // LINE 失敗或 UID 空白 → Email 備援（成功後標記，避免重複）
    Logger.log('reminder LINE failed bookingId=' + bookingId + ' row=' + rowNumber
      + ' status=' + (pushResult ? pushResult.status : 'n/a')
      + ' err=' + (pushResult ? pushResult.error : 'uid_missing'));
    try {
      if (sendBookingReminderEmail(booking)) {
        sheet.getRange(rowNumber, SETTINGS.COL_REMINDER_AT)
          .setValue('Email備援 ' + formatTaipeiNow());
        sent++;
      }
    } catch (eMail) {
      Logger.log('reminder email fallback failed bookingId=' + bookingId + ': ' + eMail.message);
      // 不寫提醒時間，下次 Trigger 可重試
    }
  }
  Logger.log('sendTomorrowBookingReminders: tomorrow=' + tomorrow + ' sent=' + sent + ' skipped=' + skipped);
}

// ===== Trigger 管理（idempotent）=====

function installBookingTriggers() {
  var handlers = {
    checkStatusChanges: { type: 'everyMinutes', minutes: 5 },
    sendTomorrowBookingReminders: { type: 'daily', hour: 18 }
  };
  var existing = ScriptApp.getProjectTriggers();
  var existingHandlers = {};
  for (var i = 0; i < existing.length; i++) {
    existingHandlers[existing[i].getHandlerFunction()] = true;
  }

  if (existingHandlers['checkStatusChanges']) {
    Logger.log('checkStatusChanges trigger: 已存在');
  } else {
    ScriptApp.newTrigger('checkStatusChanges')
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log('checkStatusChanges trigger: 已建立 (every 5 min)');
  }

  if (existingHandlers['sendTomorrowBookingReminders']) {
    Logger.log('sendTomorrowBookingReminders trigger: 已存在');
  } else {
    ScriptApp.newTrigger('sendTomorrowBookingReminders')
      .timeBased()
      .atHour(18)
      .everyDays(1)
      .inTimezone(SETTINGS.TIMEZONE)
      .create();
    Logger.log('sendTomorrowBookingReminders trigger: 已建立 (daily ~18:00 Asia/Taipei)');
  }
}

function listBookingTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  if (!triggers.length) {
    Logger.log('No project triggers');
    return;
  }
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i];
    Logger.log(
      '#' + (i + 1)
      + ' handler=' + t.getHandlerFunction()
      + ' eventType=' + t.getEventType()
      + ' uniqueId=' + t.getUniqueId()
    );
  }
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
    time: '10:30',
    lineUid: YOUR_UID,
    bookingId: 'F768-TEST-0000'
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
