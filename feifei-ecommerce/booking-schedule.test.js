const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'landing-page/booking.html'), 'utf8');

function makePage(draft) {
  const elements = {};
  const alerts = [];
  let loginCalls = 0;
  let requests = 0;
  const context = vm.createContext({
    Date, console,
    document: {
      getElementById(id) {
        return elements[id] || (elements[id] = { value: '', checked: false, textContent: '', innerHTML: '' });
      },
      querySelector: () => null
    },
    sessionStorage: { getItem: () => draft ? JSON.stringify(draft) : null },
    alert: message => alerts.push(message),
    clearBookingDraft() {},
    fetchBookedSlots() {},
    renderCalendar() {},
    toggleInquiryDirectionOther() {},
    formatDateDisplay: date => date,
    buildBirthDisplay: () => ({ display: '80/5/12' }),
    getInquiryDirectionDisplay: () => '事業',
    ensureLineReadyForBooking: async () => { loginCalls++; return false; },
    fetch: async () => { requests++; throw new Error('No external requests are allowed in this test'); },
    SELECTED_PLAN: { name: '非非療癒系問事', priceDisplay: 'NT$3,800' },
    CONSULT_MODE_DISPLAY: '線上視訊'
  });
  vm.runInContext(html.match(/    const CONFIG = \{[\s\S]*?\n    \};/)[0], context);
  for (const name of ['getSlotsForDateStr', 'isDateFullyBooked', 'renderTimeSlots',
    'ensureSelectedTimeIsOffered', 'restoreBookingDraftAfterLineLogin', 'showConfirm', 'submitBooking', 'resetSubmitButton']) {
    const match = html.match(new RegExp('    (?:async )?function ' + name + '\\([^]*?\\n    \\}'));
    assert.ok(match, name + ' must exist');
    vm.runInContext(match[0], context);
  }
  vm.runInContext('var slotsLoaded = true; var bookedSlots = {}; var selectedDate = null;'
    + ' var selectedTime = null; var currentStep = 1; var isSubmitting = false;'
    + ' function goToStep(step) { currentStep = step; }'
    + ' function updateLineStatusUI() {}', context);
  return { context, elements, alerts, get loginCalls() { return loginCalls; }, get requests() { return requests; } };
}

function testDisplayedSchedulesAndFullDays() {
  const { context, elements } = makePage();
  const base = ['10:30', '11:30', '14:30', '15:30', '16:30'];
  const cases = [
    ['2026-09-21', ['10:30', '11:30', '14:30', '15:30', '18:15', '19:15']],
    ['2026-09-22', [...base, '18:00', '19:00']],
    ['2026-09-23', base], ['2026-09-24', base], ['2026-09-25', base]
  ];
  for (const [date, slots] of cases) {
    context.selectedDate = date;
    context.renderTimeSlots();
    const buttons = Array.from(elements['time-slots'].innerHTML.matchAll(/onclick="selectTime\('([^']+)'\)"/g), match => match[1]);
    assert.deepEqual(buttons, slots, date);
    context.bookedSlots[date] = Object.fromEntries(base.map(time => [time, '已確認']));
    assert.equal(context.isDateFullyBooked(date), date >= '2026-09-23', 'New evening slots must remain available');
    context.bookedSlots[date] = Object.fromEntries(slots.map(time => [time, '已確認']));
    assert.equal(context.isDateFullyBooked(date), true);
    context.renderTimeSlots();
    assert.equal((elements['time-slots'].innerHTML.match(/<button disabled/g) || []).length, slots.length);
  }
}

function testLoginDraftsPreserveFieldsAndRequireOfferedTime() {
  for (const [time, expectedStep] of [['16:30', 2], ['18:15', 4], [null, 2]]) {
    const draft = {
      schemaVersion: 2, savedAt: Date.now(), currentStep: 4,
      selectedDate: '2026-09-21', selectedTime: time,
      fields: { name: 'Preserved name', payment: '12345' },
      checkboxes: { agree: true, proof: true }
    };
    const page = makePage(draft);
    assert.equal(page.context.restoreBookingDraftAfterLineLogin(), true);
    assert.equal(page.context.currentStep, expectedStep);
    assert.equal(page.context.selectedTime, time === '18:15' ? time : null);
    assert.equal(page.elements['field-name'].value, 'Preserved name');
    assert.equal(page.elements['field-payment'].value, '12345');
    assert.equal(page.elements['field-proof'].checked, true);
    assert.equal(page.alerts.length, time === '16:30' ? 1 : 0);
    assert.equal(page.requests, 0);
  }
}

async function testRemovedTimeCannotProceedToReviewOrSubmit() {
  for (const method of ['showConfirm', 'submitBooking']) {
    const page = makePage();
    page.context.selectedDate = '2026-09-21';
    page.context.selectedTime = '16:30';
    page.context.currentStep = 4;
    await page.context[method]();
    assert.equal(page.context.currentStep, 2, method);
    assert.equal(page.context.selectedTime, null);
    assert.equal(page.loginCalls, 0, 'Invalid time must be rejected before LINE login');
    assert.equal(page.requests, 0, 'Invalid time must not submit a booking');
  }
}

async function testCalendarRejectionKeepsFormAndDoesNotStartNotifications() {
  for (const error of ['SLOT_TAKEN', 'AVAILABILITY_UNAVAILABLE']) {
    const page = makePage();
    const { context, elements } = page;
    const message = error === 'SLOT_TAKEN'
      ? '此時段目前不開放預約，請重新選擇時段'
      : '目前無法確認時段是否開放，尚未建立預約，請稍後再試';
    context.selectedDate = '2026-09-21';
    context.selectedTime = '18:15';
    context.currentStep = 4;
    context.document.getElementById('field-proof').checked = true;
    context.document.getElementById('field-name').value = 'Preserved name';
    context.ensureLineReadyForBooking = async () => true;
    context.getInquiryDirection = () => '事業';
    context.CONSULT_MODE = '視訊';
    context.lineIdToken = 'local-test-only';
    context.lineFriendFlag = true;
    let workers = 0;
    let successes = 0;
    let posts = 0;
    context.kickPostBookingWorker = () => { workers++; };
    context.showSuccess = () => { successes++; };
    context.fetch = async (url, options) => {
      assert.equal(options.method, 'POST');
      posts++;
      return { ok: true, json: async () => ({ success: false, error, message }) };
    };
    await context.submitBooking();
    assert.equal(posts, 1);
    assert.equal(workers, 0, 'Rejected submissions must not start the notification worker');
    assert.equal(successes, 0, 'Rejected submissions must not show booking success');
    assert.deepEqual(page.alerts, [message]);
    assert.equal(context.currentStep, error === 'SLOT_TAKEN' ? 2 : 4);
    assert.equal(elements['field-name'].value, 'Preserved name');
    assert.equal(elements['btn-submit'].disabled, false);
    assert.equal(context.isSubmitting, false);
  }
}

(async () => {
  testDisplayedSchedulesAndFullDays();
  testLoginDraftsPreserveFieldsAndRequireOfferedTime();
  await testRemovedTimeCannotProceedToReviewOrSubmit();
  await testCalendarRejectionKeepsFormAndDoesNotStartNotifications();
  assert.ok(html.includes('*諮詢時間可能會延遲5-10分鐘，非非會等客人情緒平復才會結束，請見諒，謝謝。'));
  console.log('booking-schedule.test.js: PASS (weekday rendering, full days, LINE drafts, invalid submission and Calendar rejection guards)');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
