const config = require("../config");

function normalizeText(text) {
  return typeof text === "string" ? text.trim().toLowerCase() : "";
}

function includesAnyKeyword(text, keywords = []) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function getLandingPageUrl() {
  return config.links?.landingPageUrl || "https://myfeifei768.github.io";
}

function getStoreUrl() {
  return config.links?.wacaStoreUrl || "商店連結準備中";
}

function buildSalesIntentReply(text) {
  const normalized = normalizeText(text);
  const landingUrl = getLandingPageUrl();

  if (includesAnyKeyword(normalized, ["選物", "商店"])) {
    return {
      handled: true,
      strategy: "store-link",
      replyText: `想逛非非選物的話，這邊可以直接進商店看看喔 🛍️ ${getStoreUrl()}`
    };
  }

  if (includesAnyKeyword(normalized, ["噴霧", "香霧"])) {
    return {
      handled: true,
      strategy: "landing-page-link",
      replyText: `想看三款香霧怎麼選，直接點這個連結就能看介紹跟下單 💖 ${landingUrl}`
    };
  }

  if (includesAnyKeyword(normalized, config.keywords?.salesIntent || [])) {
    return {
      handled: true,
      strategy: "sales-intent-link",
      replyText: `可以呀～點這個連結就能直接看產品跟下單喔 ✨ ${landingUrl}`
    };
  }

  return {
    handled: false
  };
}

module.exports = {
  buildSalesIntentReply
};
