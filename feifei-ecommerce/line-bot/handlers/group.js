const config = require("../config");
const { buildSalesIntentReply } = require("./keyword_handler");

const groupState = new Map();

function normalizeText(text) {
  return typeof text === "string" ? text.trim().toLowerCase() : "";
}

function includesAnyKeyword(text, keywords = []) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function getStateKey(event) {
  if (event?.source?.groupId) {
    return `group:${event.source.groupId}`;
  }

  if (event?.source?.roomId) {
    return `room:${event.source.roomId}`;
  }

  return "group:unknown";
}

function getState(event) {
  const key = getStateKey(event);
  if (!groupState.has(key)) {
    groupState.set(key, {
      replyTimestamps: [],
      consecutiveReplies: 0,
      cooldownUntil: 0
    });
  }

  return groupState.get(key);
}

function isWithinQuietHours(now = new Date()) {
  if (!config.quietHours.enabled) {
    return false;
  }

  const hour = now.getHours();
  const { startHour, endHour } = config.quietHours;

  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }

  return hour >= startHour && hour < endHour;
}

function trimReplyTimestamps(state, now) {
  const windowMs = config.cooldown.resetWindowMinutes * 60 * 1000;
  state.replyTimestamps = state.replyTimestamps.filter((timestamp) => now - timestamp < windowMs);
}

function canReplyByRateLimit(state, now) {
  trimReplyTimestamps(state, now);
  return state.replyTimestamps.length < config.replyPolicy.group.maxRepliesPerHour;
}

function isCoolingDown(state, now) {
  return config.cooldown.enabled && state.cooldownUntil && now < state.cooldownUntil;
}

function registerReply(state, now) {
  state.replyTimestamps.push(now);
  state.consecutiveReplies += 1;

  if (
    config.cooldown.enabled &&
    state.consecutiveReplies >= config.cooldown.afterConsecutiveReplies
  ) {
    state.cooldownUntil = now + config.cooldown.durationMinutes * 60 * 1000;
    state.consecutiveReplies = 0;
  }
}

function detectGroupIntent(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return { shouldReply: false, reason: "empty-message" };
  }

  if (includesAnyKeyword(normalized, config.keywords?.mentionAliases || [])) {
    return { shouldReply: true, trigger: "mention", probability: config.replyPolicy.group.mentionReplyProbability };
  }

  if (includesAnyKeyword(normalized, config.keywords?.salesIntent || [])) {
    return { shouldReply: true, trigger: "sales-intent", probability: config.replyPolicy.group.salesIntentReplyProbability };
  }

  for (const keywords of Object.values(config.keywords?.product || {})) {
    if (includesAnyKeyword(normalized, keywords)) {
      return { shouldReply: true, trigger: "product-keyword", probability: config.replyPolicy.group.productKeywordReplyProbability };
    }
  }

  for (const keywords of Object.values(config.keywords?.faq || {})) {
    if (includesAnyKeyword(normalized, keywords)) {
      return { shouldReply: true, trigger: "faq-keyword", probability: config.replyPolicy.group.faqKeywordReplyProbability };
    }
  }

  return {
    shouldReply: Math.random() < config.replyPolicy.group.genericReplyProbability,
    trigger: "generic",
    probability: config.replyPolicy.group.genericReplyProbability
  };
}

async function handleGroupMessage(event, dependencies = {}) {
  const text = normalizeText(event?.message?.text);
  const now = Date.now();
  const state = getState(event);

  if (
    config.scope.targetGroupOnly &&
    process.env.TARGET_GROUP_ID &&
    event?.source?.groupId &&
    event.source.groupId !== process.env.TARGET_GROUP_ID
  ) {
    return {
      shouldReply: false,
      channel: "group",
      reason: "non-target-group"
    };
  }

  const decision = detectGroupIntent(text);

  if (!decision.shouldReply) {
    return {
      shouldReply: false,
      channel: "group",
      reason: decision.reason || "probability-skip"
    };
  }

  if (isCoolingDown(state, now)) {
    return {
      shouldReply: false,
      channel: "group",
      reason: "cooldown"
    };
  }

  if (!canReplyByRateLimit(state, now)) {
    return {
      shouldReply: false,
      channel: "group",
      reason: "rate-limit"
    };
  }

  const quietHours = isWithinQuietHours(new Date(now));
  if (
    quietHours &&
    config.quietHours.suppressGenericGroupReplies &&
    decision.trigger === "generic"
  ) {
    return {
      shouldReply: false,
      channel: "group",
      reason: "quiet-hours"
    };
  }

  if (
    quietHours &&
    decision.trigger === "mention" &&
    !config.quietHours.allowMentionReply
  ) {
    return {
      shouldReply: false,
      channel: "group",
      reason: "quiet-hours-mention-disabled"
    };
  }

  const keywordReply = buildSalesIntentReply(text);
  if (keywordReply.handled) {
    registerReply(state, now);
    return {
      shouldReply: true,
      channel: "group",
      strategy: keywordReply.strategy,
      trigger: decision.trigger,
      replyText: keywordReply.replyText
    };
  }

  if (typeof dependencies.generateClaudeReply === "function") {
    const replyText = await dependencies.generateClaudeReply({
      channel: "group",
      text,
      event,
      trigger: decision.trigger
    });

    if (replyText) {
      registerReply(state, now);
      return {
        shouldReply: true,
        channel: "group",
        strategy: "claude",
        trigger: decision.trigger,
        replyText
      };
    }
  }

  return {
    shouldReply: false,
    channel: "group",
    reason: "no-generator"
  };
}

module.exports = {
  handleGroupMessage,
  detectGroupIntent,
  isWithinQuietHours
};
