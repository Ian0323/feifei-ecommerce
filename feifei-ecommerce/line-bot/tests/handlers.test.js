const assert = require("assert");
const { routeLineEvent, normalizeText, getSourceType } = require("../controller");
const { handleDirectMessage, findFaqMatch, findEscalationCategory } = require("../handlers/direct");
const { handleGroupMessage, detectGroupIntent, isWithinQuietHours } = require("../handlers/group");
const { buildSalesIntentReply } = require("../handlers/keyword_handler");

const mockClaude = async ({ channel, trigger }) =>
  `[mock ${channel} reply${trigger ? `:${trigger}` : ""}]`;

function makeEvent(text, source = "user") {
  return {
    type: "message",
    message: { type: "text", text },
    source: { type: source, userId: "U123", groupId: source === "group" ? "G123" : undefined },
    replyToken: "test-token"
  };
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function run() {
  console.log("\n=== Controller ===");

  test("normalizeText trims and returns string", () => {
    assert.strictEqual(normalizeText("  hello  "), "hello");
    assert.strictEqual(normalizeText(null), "");
    assert.strictEqual(normalizeText(undefined), "");
  });

  test("getSourceType extracts source type", () => {
    assert.strictEqual(getSourceType({ source: { type: "user" } }), "user");
    assert.strictEqual(getSourceType({ source: { type: "group" } }), "group");
    assert.strictEqual(getSourceType(null), "unknown");
    assert.strictEqual(getSourceType({}), "unknown");
  });

  await testAsync("unsupported event type returns shouldReply false", async () => {
    const result = await routeLineEvent({ type: "follow" });
    assert.strictEqual(result.shouldReply, false);
    assert.strictEqual(result.reason, "unsupported-event");
  });

  await testAsync("empty message returns shouldReply false", async () => {
    const event = makeEvent("");
    const result = await routeLineEvent(event);
    assert.strictEqual(result.shouldReply, false);
  });

  console.log("\n=== Direct Handler ===");

  await testAsync("FAQ match: 淨化 keyword triggers FAQ", async () => {
    const result = await handleDirectMessage(makeEvent("最近壓力大怎麼辦"), {});
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.strategy, "faq");
    assert.ok(result.replyText.includes("淨化"));
  });

  await testAsync("下單 keyword triggers sales intent with URL", async () => {
    const result = await handleDirectMessage(makeEvent("怎麼下單"), {});
    assert.strictEqual(result.shouldReply, true);
    assert.ok(result.replyText.includes("ian0323.github.io"), "should include landing page URL");
  });

  await testAsync("escalation: 退款 triggers handoff", async () => {
    const result = await handleDirectMessage(makeEvent("我要退款"), {});
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.strategy, "handoff");
    assert.ok(result.replyText.includes("feifei"));
  });

  await testAsync("sales intent: 香霧 triggers landing page link", async () => {
    const result = await handleDirectMessage(makeEvent("想看香霧"), {});
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.strategy, "landing-page-link");
    assert.ok(result.replyText.includes("ian0323.github.io"));
  });

  await testAsync("fallback with Claude", async () => {
    const result = await handleDirectMessage(makeEvent("今天天氣好"), { generateClaudeReply: mockClaude });
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.strategy, "claude");
  });

  await testAsync("fallback without Claude", async () => {
    const result = await handleDirectMessage(makeEvent("今天天氣好"), {});
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.strategy, "fallback");
  });

  console.log("\n=== Keyword Handler ===");

  test("香霧 triggers landing page link with URL", () => {
    const result = buildSalesIntentReply("想看香霧");
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.strategy, "landing-page-link");
    assert.ok(result.replyText.includes("ian0323.github.io"));
  });

  test("選物 triggers store link", () => {
    const result = buildSalesIntentReply("想逛選物");
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.strategy, "store-link");
  });

  test("下單 triggers sales intent", () => {
    const result = buildSalesIntentReply("怎麼下單");
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.strategy, "sales-intent-link");
    assert.ok(result.replyText.includes("ian0323.github.io"));
  });

  test("unrelated text not handled", () => {
    const result = buildSalesIntentReply("今天天氣好");
    assert.strictEqual(result.handled, false);
  });

  console.log("\n=== Group Handler ===");

  test("detectGroupIntent: mention triggers reply", () => {
    const result = detectGroupIntent("小非 你推薦哪一瓶");
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.trigger, "mention");
  });

  test("detectGroupIntent: product keyword triggers reply", () => {
    const result = detectGroupIntent("最近想買招財");
    assert.strictEqual(result.shouldReply, true);
    assert.strictEqual(result.trigger, "product-keyword");
  });

  test("quiet hours: 2am is quiet", () => {
    const twoAm = new Date("2026-03-14T02:00:00");
    assert.strictEqual(isWithinQuietHours(twoAm), true);
  });

  test("quiet hours: 2pm is not quiet", () => {
    const twoPm = new Date("2026-03-14T14:00:00");
    assert.strictEqual(isWithinQuietHours(twoPm), false);
  });

  test("quiet hours: 11pm is quiet", () => {
    const elevenPm = new Date("2026-03-14T23:30:00");
    assert.strictEqual(isWithinQuietHours(elevenPm), true);
  });

  console.log("\n=== FAQ Matching ===");

  test("findFaqMatch finds 淨化", () => {
    const match = findFaqMatch("壓力大");
    assert.ok(match);
    assert.strictEqual(match.id, "purifying-use-case");
  });

  test("findFaqMatch finds 招財", () => {
    const match = findFaqMatch("最近業績不好");
    assert.ok(match);
    assert.strictEqual(match.id, "prosperity-use-case");
  });

  test("findFaqMatch returns null for unknown", () => {
    const match = findFaqMatch("量子力學");
    assert.strictEqual(match, null);
  });

  console.log("\n=== Escalation ===");

  test("findEscalationCategory detects 退款", () => {
    assert.strictEqual(findEscalationCategory("我要退款"), "orderIssue");
  });

  test("findEscalationCategory detects 過敏", () => {
    assert.strictEqual(findEscalationCategory("用了過敏怎麼辦"), "medicalOrSensitive");
  });

  test("findEscalationCategory returns null for normal text", () => {
    assert.strictEqual(findEscalationCategory("今天天氣好"), null);
  });

  // Summary
  console.log(`\n${"=".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
}

run();
