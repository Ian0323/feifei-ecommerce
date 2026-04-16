var SETTINGS = {
  SHEET_ID: '1IUDCeB087LLFoLyzGxp_4eTSpycYiWjNM8PJ6b7DhwM',
  SHEET_NAME: '\u9810\u7d04\u7d00\u9304',
  PUBLIC_SHEET_ID: '1mWyyA9N3bHsbCGZWg_FbQGinbev1sKG-gquh60Qtc-E',
  PUBLIC_SHEET_NAME: '\u6642\u6bb5\u72c0\u614b',
  ASSISTANT_EMAIL: 'iankuo1999@gmail.com',
  BRAND_NAME: '\u975e\u975e768',
  SERVICE_PRICE: 'NT$3,800'
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

function syncPublicSheet() {
  if (!SETTINGS.PUBLIC_SHEET_ID) return;
  var source = getSheet();
  var lastRow = source.getLastRow();

  var target = SpreadsheetApp.openById(SETTINGS.PUBLIC_SHEET_ID)
    .getSheetByName(SETTINGS.PUBLIC_SHEET_NAME);
  var targetLastRow = target.getLastRow();
  if (targetLastRow > 1) {
    target.getRange(2, 1, targetLastRow - 1, 3).clearContent();
  }

  if (lastRow <= 1) return;

  var data = source.getRange(2, 1, lastRow - 1, 10).getValues();
  var publicRows = [];
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
  if (publicRows.length > 0) {
    target.getRange(2, 1, publicRows.length, 3).setValues(publicRows);
  }
}

function formatDateKey(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val);
}

function formatTimeKey(val) {
  if (val instanceof Date) {
    var h = ('0' + val.getHours()).slice(-2);
    var m = ('0' + val.getMinutes()).slice(-2);
    return h + ':' + m;
  }
  return String(val);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet();
    sheet.appendRow([
      new Date(),
      data.date,
      data.time,
      data.name,
      data.phone,
      data.email,
      data.topic,
      data.notes || '',
      '\u5f85\u78ba\u8a8d',
      ''
    ]);
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

function sendAssistantNotification(data) {
  var subject = '[\u65b0\u9810\u7d04] ' + data.name + ' - ' + data.dateDisplay + ' ' + data.time;
  var body = SETTINGS.BRAND_NAME + ' \u65b0\u9810\u7d04\uff1a\n\n'
    + '\u59d3\u540d\uff1a' + data.name + '\n'
    + '\u96fb\u8a71\uff1a' + data.phone + '\n'
    + 'Email\uff1a' + data.email + '\n'
    + '\u65e5\u671f\uff1a' + data.dateDisplay + '\n'
    + '\u6642\u6bb5\uff1a' + data.time + '\n'
    + '\u4e3b\u984c\uff1a' + data.topic + '\n'
    + '\u5099\u8a3b\uff1a' + (data.notes || '\u7121') + '\n\n'
    + '\u8acb\u5230 Google Sheet \u5c07\u72c0\u614b\u6539\u70ba\u300c\u5df2\u78ba\u8a8d\u300d\uff0c\u7cfb\u7d71\u6703\u81ea\u52d5\u901a\u77e5\u5ba2\u6236\u3002';
  MailApp.sendEmail(SETTINGS.ASSISTANT_EMAIL, subject, body);
}

function checkStatusChanges() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  var changed = false;
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[8];
    var confirmTime = row[9];
    if (status === '\u5df2\u78ba\u8a8d' && !confirmTime) {
      var booking = {
        date: row[1], time: row[2], name: row[3],
        phone: row[4], email: row[5], topic: row[6]
      };
      sendCustomerConfirmation(booking);
      sheet.getRange(i + 2, 10).setValue(new Date());
      changed = true;
    }
    if (status === '\u5df2\u53d6\u6d88' && !confirmTime) {
      var booking2 = {
        date: row[1], time: row[2], name: row[3], email: row[5]
      };
      sendCancellationNotice(booking2);
      sheet.getRange(i + 2, 10).setValue(new Date());
      changed = true;
    }
  }
  if (changed) {
    syncPublicSheet();
  }
}

function sendCustomerConfirmation(booking) {
  var subject = '[\u9810\u7d04\u78ba\u8a8d] ' + SETTINGS.BRAND_NAME + ' - ' + booking.date + ' ' + booking.time;
  var body = booking.name + ' \u60a8\u597d\uff0c\n\n'
    + '\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u5df2\u78ba\u8a8d\uff01\n\n'
    + '\u65e5\u671f\uff1a' + booking.date + '\n'
    + '\u6642\u6bb5\uff1a' + booking.time + '\n'
    + '\u4e3b\u984c\uff1a' + booking.topic + '\n'
    + '\u8cbb\u7528\uff1a' + SETTINGS.SERVICE_PRICE + '\n\n'
    + '\u8aee\u8a62\u65b9\u5f0f\u5c07\u7531\u52a9\u7406\u53e6\u884c\u901a\u77e5\u3002\n'
    + '\u5982\u9700\u66f4\u6539\u6216\u53d6\u6d88\uff0c\u8acb\u63d0\u524d\u806f\u7e6b\u6211\u5011\u3002\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}

function sendCancellationNotice(booking) {
  var subject = '[\u9810\u7d04\u53d6\u6d88] ' + SETTINGS.BRAND_NAME + ' - ' + booking.date + ' ' + booking.time;
  var body = booking.name + ' \u60a8\u597d\uff0c\n\n'
    + '\u5f88\u62b1\u6b49\uff0c\u60a8\u7684\u8aee\u8a62\u9810\u7d04\u56e0\u6642\u9593\u7121\u6cd5\u914d\u5408\uff0c\u5df2\u53d6\u6d88\u3002\n\n'
    + '\u539f\u8a02\u65e5\u671f\uff1a' + booking.date + '\n'
    + '\u539f\u8a02\u6642\u6bb5\uff1a' + booking.time + '\n\n'
    + '\u6b61\u8fce\u91cd\u65b0\u9810\u7d04\u5176\u4ed6\u6642\u6bb5\uff0c\u9020\u6210\u4e0d\u4fbf\u8acb\u898b\u8ad2\u3002\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}

function testDoGet() {
  syncPublicSheet();
  Logger.log('Public sheet synced');
}
