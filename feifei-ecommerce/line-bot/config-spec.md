# Config Spec

> 用途：說明 `line-bot/config.js` 的結構，讓後續 AI 或人工能直接接上 bot 主程式。

## 1. 使用原則

- `config.js` 是 line bot 的執行規則來源
- 回覆機率、冷卻、深夜靜音、關鍵字與轉人工規則都優先在這裡改
- 主程式不要硬編碼這些數值

## 2. 主要區塊

### `mode`

- 是否啟用群組回覆
- 是否啟用一對一回覆
- 是否啟用排程話題

### `replyPolicy`

- 群組內不同情境的回覆機率
- 一對一是否先用 FAQ，再 fallback 到 Claude

### `scope`

- 是否只允許指定群組活躍

### `cooldown`

- 連續回覆幾次後進冷卻
- 冷卻多久
- 多久視為新的回覆視窗

### `quietHours`

- 深夜靜音的起訖時間
- 是否壓制一般群組回覆
- 是否仍允許被點名回覆與一對一回覆

### `keywords`

- `mentionAliases`
- `product`
- `faq`
- `salesIntent`
- `escalation`

### `escalation`

- 是否啟用轉人工
- 固定轉人工訊息
- 各類型事件的優先級與是否交給 Claude

### `topicScheduler`

- 是否啟用主動話題
- 每天時段
- 每日上限

### `claude`

- 模型名稱
- 上下文訊息數
- 回覆句數上限
- temperature

## 3. 預設策略

- 群組回覆保守
- 一對一可完整回
- 深夜不主動插話
- 敏感問題一律轉人工

## 4. 下一步接法

後續主程式至少要接這幾段：

1. `controller.js` 讀取 `mode`
2. `handlers/group.js` 讀取 `scope`、`replyPolicy.group`、`cooldown`、`quietHours`
3. `handlers/direct.js` 讀取 `replyPolicy.direct`、`keywords`、`escalation`
4. `scheduler.js` 讀取 `topicScheduler`
