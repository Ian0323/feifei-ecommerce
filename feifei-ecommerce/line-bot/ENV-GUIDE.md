# ENV Guide

## 1. 需要的環境變數

目前 line-bot 需要以下變數：

### `PORT`

- 用途：server 啟動 port
- 建議：`3000`

### `LINE_CHANNEL_SECRET`

- 用途：驗證 LINE webhook 簽章
- 來源：LINE Developers Console > Basic settings

### `LINE_CHANNEL_ACCESS_TOKEN`

- 用途：呼叫 LINE reply API 發訊息
- 來源：LINE Developers Console > Messaging API

### `ANTHROPIC_API_KEY`

- 用途：呼叫 Claude 生成回覆
- 來源：Anthropic / Claude API 控台

### `TARGET_GROUP_ID`

- 用途：限制 bot 只在指定的非非群組活躍
- 來源：實際測試群組的 groupId

### `BOT_ADMIN_TOKEN`

- 用途：保護內部群組公告 API
- 來源：自行設定的隨機 secret

## 2. `.env` 範例

```dotenv
PORT=3000
LINE_CHANNEL_SECRET=your_real_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_real_channel_access_token
ANTHROPIC_API_KEY=your_real_anthropic_api_key
TARGET_GROUP_ID=your_real_target_group_id
BOT_ADMIN_TOKEN=your_random_secret
```

## 3. 建議流程

1. 複製 `.env.example` 成 `.env`
2. 填入真實值
3. 不要把 `.env` 提交到 git

## 4. 驗證方式

### 驗證 server 可啟動

```bash
npm start
```

若成功，應看到：

```text
LINE bot server listening on port 3000
```

### 驗證 health check

瀏覽器或工具打：

```text
http://localhost:3000/health
```

應回：

```json
{ "ok": true }
```

## 5. 安全原則

- 不要把真實 token 寫進 `config.js`
- 不要把 `.env` 傳到公開 repo
- 若懷疑 token 外洩，直接重發 access token
