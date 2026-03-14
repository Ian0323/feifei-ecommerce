# LINE Bot Local Run Guide

## 1. Prerequisites

- Node.js 18+
- LINE Official Account with Messaging API enabled
- Claude API key

## 2. Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `CLAUDE_API_KEY`
3. Install dependencies:

```bash
npm install
```

Detailed guides:

- `ENV-GUIDE.md`
- `LINE-SETUP-SOP.md`
- `TEST-CHECKLIST.md`
- `OWNER-LINE-REQUEST.md`
- `line-bot-group-pivot-plan.md`

## 3. Run

```bash
npm start
```

Default health check:

```text
GET /health
```

Webhook endpoint:

```text
POST /webhook/line
```

## 3.1 Local Handler Tests

Without real LINE webhook traffic, you can run:

```bash
npm run test:direct
npm run test:group
```

These commands use:

- `data/sample-webhook-direct.json`
- `data/sample-webhook-group.json`

They validate the controller and handler flow with mock Claude replies.

## 4. Current Status

Implemented:

- Webhook server skeleton
- Signature verification
- Event routing
- Direct message handler
- Group handler
- Claude reply client
- LINE reply API send-back
- FAQ / topics / config data
- Local sample webhook test scripts
- Target-group restriction
- Sales-intent keyword routing
- Internal group broadcast endpoint

Not yet implemented:

- Persistent cooldown storage
- Rich menu setup
- Scheduled topic runner
- Flex Message product cards

## 5. Notes

- Current webhook returns handler results in JSON for development visibility.
- `LINE_CHANNEL_ACCESS_TOKEN` is now used for reply API send-back.
- `ANTHROPIC_API_KEY` is the preferred LLM env var.
- Production hardening still needs retry/error logging and richer message support.
- `enableMockReply` can be used to test without calling Claude API.
