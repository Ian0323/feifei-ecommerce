const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
}

function assertInlineScriptSyntax(relativePath) {
  const html = read(relativePath);
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
    .map(match => match[1])
    .filter(code => code.trim());
  scripts.forEach(code => new Function(code)); // Parse only; do not execute browser code.
}

const index = read('landing-page/index.html');
assert.ok(index.includes('booking.html?plan=single'));
assert.ok(!index.includes('window.location.replace("membership.html")'));

const membership = read('landing-page/membership.html');
assert.ok(!/<script\b/i.test(membership), 'introduction page must not initialize LIFF');
assert.ok(!/href="booking\.html/i.test(membership), 'introduction page must not link to booking');
assert.ok(!/data-plan-link|<button\b/i.test(membership), 'introduction page must not select or recommend plans');
assert.ok(membership.includes('本頁僅供介紹，不提供登入、方案選擇或預約'));

const booking = read('landing-page/booking.html');
assert.ok(/activePlanIds:\s*\['single'\]/.test(booking));
assert.ok(!booking.includes('更換方案'));
assert.ok(!booking.includes('目前開放方案'));
assert.ok(!booking.includes('目前僅開放單次問事'));
assert.ok(booking.includes("canonicalUrl.searchParams.set('plan', selectedPlanId)"));

const backend = read('booking-backend/Code.gs');
assert.ok(/ACTIVE_BOOKING_PLAN_IDS:\s*\['single'\]/.test(backend));
const validation = backend.indexOf('var validationErrors = validateBookingData(data)');
const sheetWrite = backend.indexOf('sheet.appendRow([');
const enqueue = backend.indexOf('enqueueBookingSideEffects_({');
assert.ok(validation > -1 && validation < sheetWrite && sheetWrite < enqueue,
  'validation must happen before Sheet writes and notification queueing');

assertInlineScriptSyntax('landing-page/index.html');
assertInlineScriptSyntax('landing-page/booking.html');
assertInlineScriptSyntax('landing-page/membership.html');

console.log('single-plan.test.js: PASS');
