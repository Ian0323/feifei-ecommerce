const fs = require("fs");
const path = require("path");
const config = require("../config");
const faqEntries = require("../data/faq.json");
const { buildSalesIntentReply } = require("./keyword_handler");

function loadProductData() {
  const mainPath = path.join(__dirname, "..", "..", "products", "products.json");
  const localPath = path.join(__dirname, "..", "data", "products.json");

  try {
    if (fs.existsSync(mainPath)) {
      return JSON.parse(fs.readFileSync(mainPath, "utf8"));
    }
  } catch (_) { /* fallback to local */ }

  return require(localPath);
}

const productData = loadProductData();

function normalizeText(text) {
  return typeof text === "string" ? text.trim().toLowerCase() : "";
}

function includesAnyKeyword(text, keywords = []) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function findEscalationCategory(text) {
  const escalationKeywords = config.keywords?.escalation || {};

  for (const [category, keywords] of Object.entries(escalationKeywords)) {
    if (includesAnyKeyword(text, keywords)) {
      return category;
    }
  }

  return null;
}

function findFaqMatch(text) {
  return faqEntries.find((item) => includesAnyKeyword(text, item.keywords || [])) || null;
}

function findProductRecommendation(text) {
  const productKeywords = config.keywords?.product || {};

  for (const [productKey, keywords] of Object.entries(productKeywords)) {
    if (!includesAnyKeyword(text, keywords)) {
      continue;
    }

    return productData.products.find((product) => product.id.includes(productKey) || (product.name_zh || "").toLowerCase().includes(productKey)) || null;
  }

  return null;
}

function buildProductReply(product) {
  if (!product) {
    return null;
  }

  const name = product.name_zh || product.name || "";
  const desc = product.short_description || product.description || "";
  const useCases = Array.isArray(product.use_cases) ? product.use_cases.slice(0, 3).join("、") : "";
  const priceText = product.price_twd ? `目前價格是 NT$ ${product.price_twd}。` : "";

  return `${name} 比較適合這種狀態喔。${desc} ${useCases ? `適合時機：${useCases}。` : ""} ${priceText}想直接下單的話可以到官網購買！`.trim();
}

async function handleDirectMessage(event, dependencies = {}) {
  const text = normalizeText(event?.message?.text);

  if (!text) {
    return {
      shouldReply: false,
      reason: "empty-message"
    };
  }

  const escalationCategory = findEscalationCategory(text);
  if (escalationCategory && config.escalation.enabled) {
    return {
      shouldReply: true,
      channel: "direct",
      strategy: "handoff",
      escalationCategory,
      replyText: config.escalation.handoffMessage
    };
  }

  const keywordReply = buildSalesIntentReply(text);
  if (keywordReply.handled) {
    return {
      shouldReply: true,
      channel: "direct",
      strategy: keywordReply.strategy,
      replyText: keywordReply.replyText
    };
  }

  if (config.replyPolicy.direct.useFaqFirst) {
    const faqMatch = findFaqMatch(text);
    if (faqMatch) {
      return {
        shouldReply: true,
        channel: "direct",
        strategy: "faq",
        faqId: faqMatch.id,
        replyText: faqMatch.answer
      };
    }
  }

  const productRecommendation = findProductRecommendation(text);
  if (productRecommendation) {
    return {
      shouldReply: true,
      channel: "direct",
      strategy: "product",
      productId: productRecommendation.id,
      replyText: buildProductReply(productRecommendation)
    };
  }

  if (config.replyPolicy.direct.fallbackToClaude && typeof dependencies.generateClaudeReply === "function") {
    const replyText = await dependencies.generateClaudeReply({
      channel: "direct",
      text,
      event
    });

    if (replyText) {
      return {
        shouldReply: true,
        channel: "direct",
        strategy: "claude",
        replyText
      };
    }
  }

  return {
    shouldReply: true,
    channel: "direct",
    strategy: "fallback",
    replyText: "這個問題我先記下來，如果需要的話可以請 feifei 本人回覆你。想直接看產品的話，可以到官網挑選下單喔！"
  };
}

module.exports = {
  handleDirectMessage,
  findFaqMatch,
  findEscalationCategory,
  findProductRecommendation
};
