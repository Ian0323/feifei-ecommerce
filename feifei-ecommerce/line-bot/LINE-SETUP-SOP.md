# LINE Setup SOP

## 1. 目的

這份文件用來把 `小非` LINE bot 接到真實的 LINE 官方帳號。

完成後應具備：

- Messaging API 已開通
- Webhook URL 已填入
- Channel Secret / Access Token 已取得
- 測試群組可收到 bot 回覆

## 2. 前置條件

- 已有 LINE 官方帳號
- 可登入 LINE Official Account Manager
- 可登入 LINE Developers Console
- line-bot 專案可在本地或伺服器啟動

## 3. 開通 Messaging API

1. 登入 LINE Official Account Manager
2. 找到對應官方帳號
3. 確認已開啟 Messaging API
4. 若尚未開通，依畫面指示建立 provider 與 channel

## 4. 到 LINE Developers Console 取得金鑰

需要取得兩個值：

- `Channel secret`
- `Channel access token`

步驟：

1. 進入該 channel
2. 打開 `Basic settings`
   - 複製 `Channel secret`
3. 打開 `Messaging API`
   - 發行 `Channel access token`
   - 複製 token

## 5. 設定 Webhook URL

在 `Messaging API` 設定頁：

1. 找到 `Webhook settings`
2. 填入：

```text
https://你的網域/webhook/line
```

本地測試可先用 tunnel：

```text
https://你的-ngrok-或-cloudflared-網址/webhook/line
```

3. 打開 `Use webhook`
4. 按 `Verify`

## 6. 建議的本地測試流程

1. 建立 `.env`
2. 填入真實金鑰
3. 啟動：

```bash
npm start
```

4. 用 tunnel 工具把本地 `3000` port 對外
5. 把外部網址填到 LINE Webhook URL
6. 用自己的 LINE 私訊官方帳號發訊息測試

## 7. 群組測試流程

1. 建立測試群組
2. 把官方帳號加進群組
3. 在群組中：
   - 直接問產品問題
   - @ 小非
   - 測試一般聊天
4. 觀察：
   - mention 是否回覆
   - 一般訊息是否過度插話
   - 深夜是否靜音

## 8. 常見問題

### Webhook Verify 失敗

可能原因：

- URL 錯誤
- server 沒啟動
- `LINE_CHANNEL_SECRET` 不正確
- tunnel 沒有轉到正確 port

### 有收到 webhook，但沒有成功回訊息

優先檢查：

- `LINE_CHANNEL_ACCESS_TOKEN` 是否正確
- reply token 是否存在
- server console 是否有 error

### 群組內完全不回

先檢查：

- `enableGroupReply` 是否為 `true`
- 是否在深夜靜音時段
- 是否被冷卻或超過每小時上限

## 9. 真實驗收最小清單

- 一對一 FAQ 回覆成功
- 一對一產品推薦成功
- 群組 mention 成功回覆
- 群組一般聊天不會亂洗版
- webhook verify 成功

