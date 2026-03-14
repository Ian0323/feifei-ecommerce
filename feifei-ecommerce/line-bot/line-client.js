const line = require("@line/bot-sdk");

function getLineClient() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return null;
  }

  return new line.messagingApi.MessagingApiClient({
    channelAccessToken
  });
}

async function replyMessage(replyToken, text) {
  const client = getLineClient();

  if (!replyToken || !text || !client) {
    return {
      ok: false,
      reason: "missing-reply-dependency"
    };
  }

  try {
    await client.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text
        }
      ]
    });

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      reason: "line-api-error",
      error: error.message
    };
  }
}

async function pushMessage(to, text) {
  const client = getLineClient();
  if (!to || !text || !client) {
    return {
      ok: false,
      reason: "missing-push-dependency"
    };
  }

  try {
    await client.pushMessage({
      to,
      messages: [{ type: "text", text }]
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "line-push-error",
      error: error.message
    };
  }
}

module.exports = {
  replyMessage,
  pushMessage
};
