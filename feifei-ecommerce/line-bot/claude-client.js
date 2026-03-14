const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const config = require("./config");

function loadFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8").trim();
}

function loadSystemPrompt() {
  const promptPath = path.join(__dirname, "data", "system-prompt.md");
  const voiceStylePath = path.join(__dirname, "..", "docs", "voice-style-report.md");
  const customCorpusPath = path.join(__dirname, "data", "voice-corpus.md");

  const basePrompt = loadFileIfExists(promptPath);
  const voiceStylePrompt = loadFileIfExists(voiceStylePath);
  const customCorpusPrompt = loadFileIfExists(customCorpusPath);

  return [basePrompt, voiceStylePrompt, customCorpusPrompt]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function buildUserMessage({ channel, text, trigger }) {
  if (channel === "group") {
    return `你現在在非非選物的 LINE 群組裡。觸發原因：${trigger || "generic"}。請用 1-3 句、像熟客小幫手一樣接話，不要太像客服，不要太長。\n\n群組訊息：${text}`;
  }

  return `你現在在非非選物的 LINE 一對一私訊裡。請用 1-3 句回答，優先幫對方理解怎麼選或去哪裡下單。\n\n私訊內容：${text}`;
}

async function generateClaudeReply({ channel, text, trigger }) {
  if (config.mode.enableMockReply) {
    if (channel === "group") {
      return `小非收到囉，這則先用 mock 回覆測試中。觸發原因：${trigger || "generic"}。`;
    }

    return "小非收到囉，這是一則 mock 回覆，之後會接上 Claude API。";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new Anthropic({
    apiKey
  });
  const systemPrompt = loadSystemPrompt();
  const message = await client.messages.create({
    model: config.claude.model,
    max_tokens: 250,
    temperature: config.claude.temperature,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: buildUserMessage({ channel, text, trigger }) }]
      }
    ]
  });

  return message?.content?.[0]?.text || null;
}

module.exports = {
  generateClaudeReply
};
