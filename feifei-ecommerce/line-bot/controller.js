const config = require("./config");
const { handleDirectMessage } = require("./handlers/direct");
const { handleGroupMessage } = require("./handlers/group");

function normalizeText(text) {
  return typeof text === "string" ? text.trim() : "";
}

function getSourceType(event) {
  if (!event || !event.source || !event.source.type) {
    return "unknown";
  }

  return event.source.type;
}

async function routeLineEvent(event, dependencies = {}) {
  const messageText = normalizeText(event?.message?.text);
  const sourceType = getSourceType(event);

  if (event?.type !== "message" || event?.message?.type !== "text" || !messageText) {
    return {
      shouldReply: false,
      reason: "unsupported-event"
    };
  }

  if (sourceType === "user" && config.mode.enableDirectReply) {
    return handleDirectMessage(event, dependencies);
  }

  if ((sourceType === "group" || sourceType === "room") && config.mode.enableGroupReply) {
    return handleGroupMessage(event, dependencies);
  }

  return {
    shouldReply: false,
    reason: "source-disabled"
  };
}

module.exports = {
  routeLineEvent,
  getSourceType,
  normalizeText
};
