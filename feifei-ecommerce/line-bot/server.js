const express = require("express");
const crypto = require("crypto");
require("dotenv").config();
const { routeLineEvent } = require("./controller");
const { generateClaudeReply } = require("./claude-client");
const { replyMessage, pushMessage } = require("./line-client");
const config = require("./config");

const app = express();

function verifyLineSignature(rawBody, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  return digest === signature;
}

app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody = buffer;
    }
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post(config.broadcasting.path, async (req, res) => {
  const adminToken = process.env.BOT_ADMIN_TOKEN;
  const authHeader = req.header("authorization") || "";
  const expected = adminToken ? `Bearer ${adminToken}` : "";

  if (!adminToken || authHeader !== expected) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const targetGroupId = process.env.TARGET_GROUP_ID;
  const text = req.body?.text;

  if (!targetGroupId || !text) {
    return res.status(400).json({ ok: false, error: "missing-target-or-text" });
  }

  const result = await pushMessage(targetGroupId, text);
  return res.json({ ok: result.ok, result });
});

app.post("/webhook/line", async (req, res) => {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.header("x-line-signature");

  if (secret && !verifyLineSignature(req.rawBody, signature, secret)) {
    return res.status(401).json({ ok: false, error: "invalid-signature" });
  }

  const events = Array.isArray(req.body?.events) ? req.body.events : [];

  const results = await Promise.all(
    events.map((event) =>
      routeLineEvent(event, {
        generateClaudeReply
      })
        .then(async (result) => {
          if (!result?.shouldReply || !result?.replyText || !event?.replyToken) {
            return result;
          }

          const replyResult = await replyMessage(event.replyToken, result.replyText);

          return {
            ...result,
            lineReply: replyResult
          };
        })
        .catch((error) => ({
          shouldReply: false,
          reason: "handler-error",
          error: error.message
        }))
    )
  );

  return res.json({
    ok: true,
    events: events.length,
    results
  });
});

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`LINE bot server listening on port ${port}`);
  });
}
