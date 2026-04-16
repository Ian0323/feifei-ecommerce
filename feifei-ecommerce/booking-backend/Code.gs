var SETTINGS = {
  SHEET_ID: '1IUDCeB087LLFoLyzGxp_4eTSpycYiWjNM8PJ6b7DhwM',
  SHEET_NAME: 'bookings',
  ASSISTANT_EMAIL: 'iankuo1999@gmail.com',
  BRAND_NAME: 'feifei768',
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
    'Submitted', 'Date', 'Time', 'Name', 'Phone',
    'Email', 'Topic', 'Notes', 'Status', 'ConfirmedAt'
  ]]);
  var header = sheet.getRange(1, 1, 1, 10);
  header.setFontWeight('bold');
  header.setBackground('#7B5EA7');
  header.setFontColor('#FFFFFF');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['pending', 'confirmed', 'cancelled', 'done'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 9, 100, 1).setDataValidation(rule);
  for (var i = 1; i <= 10; i++) {
    sheet.autoResizeColumn(i);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getBooked') {
    return getBookedSlots();
  }
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getBookedSlots() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ booked: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  var booked = {};
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[8];
    // Only block slots that are pending or confirmed (not cancelled)
    if (status === 'pending' || status === 'confirmed') {
      var date = row[1];
      var time = row[2];
      if (!booked[date]) {
        booked[date] = [];
      }
      booked[date].push(time);
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ booked: booked }))
    .setMimeType(ContentService.MimeType.JSON);
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
      'pending',
      ''
    ]);
    if (SETTINGS.ASSISTANT_EMAIL) {
      sendAssistantNotification(data);
    }
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
  var subject = '[New Booking] ' + data.name + ' - ' + data.dateDisplay + ' ' + data.time;
  var body = SETTINGS.BRAND_NAME + ' new booking:\n\n'
    + 'Name: ' + data.name + '\n'
    + 'Phone: ' + data.phone + '\n'
    + 'Email: ' + data.email + '\n'
    + 'Date: ' + data.dateDisplay + '\n'
    + 'Time: ' + data.time + '\n'
    + 'Topic: ' + data.topic + '\n'
    + 'Notes: ' + (data.notes || 'none') + '\n\n'
    + 'Change status to "confirmed" in Google Sheet to notify customer.';
  MailApp.sendEmail(SETTINGS.ASSISTANT_EMAIL, subject, body);
}

function checkStatusChanges() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var status = row[8];
    var confirmTime = row[9];
    if (status === 'confirmed' && !confirmTime) {
      var booking = {
        date: row[1], time: row[2], name: row[3],
        phone: row[4], email: row[5], topic: row[6]
      };
      sendCustomerConfirmation(booking);
      sheet.getRange(i + 2, 10).setValue(new Date());
    }
    if (status === 'cancelled' && !confirmTime) {
      var booking2 = {
        date: row[1], time: row[2], name: row[3], email: row[5]
      };
      sendCancellationNotice(booking2);
      sheet.getRange(i + 2, 10).setValue(new Date());
    }
  }
}

function sendCustomerConfirmation(booking) {
  var subject = '[Booking Confirmed] ' + SETTINGS.BRAND_NAME + ' - ' + booking.date + ' ' + booking.time;
  var body = booking.name + ',\n\n'
    + 'Your booking is confirmed!\n\n'
    + 'Date: ' + booking.date + '\n'
    + 'Time: ' + booking.time + '\n'
    + 'Topic: ' + booking.topic + '\n'
    + 'Price: ' + SETTINGS.SERVICE_PRICE + '\n\n'
    + 'Details will be sent by our assistant.\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}

function sendCancellationNotice(booking) {
  var subject = '[Booking Cancelled] ' + SETTINGS.BRAND_NAME + ' - ' + booking.date + ' ' + booking.time;
  var body = booking.name + ',\n\n'
    + 'Sorry, your booking has been cancelled.\n\n'
    + 'Date: ' + booking.date + '\n'
    + 'Time: ' + booking.time + '\n\n'
    + 'Please book another time.\n\n'
    + SETTINGS.BRAND_NAME;
  MailApp.sendEmail(booking.email, subject, body);
}
