# LINE Bot Plan

> 用途：本文件定義 `小非` LINE 專案的第一版規劃，供後續 AI 與人工直接依循。  
> 版本：v1  
> 原則：先做可控 MVP，再逐步擴充群組互動與主動話題。

---

## 1. 專案目標

建立 `小非` 作為 `非非選品` 的 LINE AI 助理，處理以下三類需求：

1. `一對一私訊 FAQ`
2. `產品導購與連結引導`
3. `群組內保守型互動`

第一版不追求高度自主聊天，而是先做到：

- 回答常見問題
- 根據關鍵字引導對應產品
- 把人導到表單、LINE 或商店
- 不亂回、不洗版、不搶主理人角色

---

## 2. 第一版範圍

### 2.1 包含

- LINE Messaging API Webhook
- 一對一私訊回覆
- 群組關鍵字回覆
- FAQ / 產品知識庫
- Claude API 回覆封裝
- 基本節流規則
- 深夜靜音
- 簡單話題庫資料結構

### 2.2 不包含

- 高頻主動聊天
- 複雜 RAG
- 後台管理介面
- 自動訂單查詢
- 自動客訴處理
- 多角色切換

---

## 3. MVP 成功標準

- 一對一私訊收到問題時可正常回覆
- 提到產品關鍵字時可引導正確產品
- 敏感問題會導回 feifei 本人
- 群組不會頻繁亂回
- 深夜不主動發話
- 至少可穩定處理以下類型：
  - 產品差異
  - 使用情境
  - 下單方式
  - 商店或表單連結

---

## 4. 角色與人設原則

以現有 [`system-prompt.md`](C:\Users\Ian Kuo\台灣低碳集團 Dropbox\董事長室\B 專案管理\B6 碳資產電業\claude code專案\購物網站\feifei-ecommerce\line-bot\data\system-prompt.md) 為基底。

### 核心原則

- 公開承認自己是 AI 助理
- 不假裝真人
- 不搶 feifei 的主理人角色
- 語氣溫暖、活潑、簡潔
- 偶爾有能量感，但不過度宗教化

### 禁止事項

- 不編造療效
- 不回覆醫療建議
- 不處理退換貨決策
- 不與使用者長篇爭辯
- 不在群組連續刷存在感

---

## 5. 第一版功能設計

## 5.1 一對一私訊

### 目標

把最常見的詢問自動化，減少 feifei 手動回覆壓力。

### 需支援的意圖

1. `產品推薦`
2. `產品差異`
3. `價格詢問`
4. `怎麼下單`
5. `導到表單 / 商店 / IG / LINE`
6. `客訴 / 訂單 / 退款` 轉人工

### 處理邏輯

- 先用關鍵字與 FAQ 資料匹配
- 命中高信心 FAQ 時，優先回模板
- 沒命中時，再交給 Claude API
- 敏感情境固定引導真人

## 5.2 群組互動

### 目標

只做 `保守型存在感`，不做高頻帶聊。

### 必回情境

- 被明確提問或 @
- 出現產品關鍵字
- 出現導購關鍵字，例如：
  - 推薦
  - 哪一款
  - 怎麼買
  - 下單
  - 價格

### 低頻回覆情境

- 一般聊天只在低機率下回覆
- 初版建議 `10% - 20%`

### 節流規則

- 連回 3 則後冷卻
- 每小時回覆上限
- 深夜靜音 `23:00 - 08:00`

## 5.3 話題庫

第一版先建立資料結構，不一定立刻啟用高頻主動發話。

類型建議：

- 輕鬆問候
- 使用情境提醒
- 軟性產品帶入
- 節日 / 開工 / 週末情境

---

## 6. 技術架構

### 6.1 建議檔案結構

```text
line-bot/
├── line-bot-plan.md
├── package.json
├── server.js
├── controller.js
├── claude-client.js
├── config.js
├── scheduler.js
├── handlers/
│   ├── group.js
│   └── direct.js
├── data/
│   ├── products.json
│   ├── system-prompt.md
│   ├── faq.json
│   └── topics.json
└── rich-menu/
    └── setup.js
```

### 6.2 核心模組

- `server.js`
  - Express 入口
  - LINE Webhook 驗證
- `controller.js`
  - 接收事件
  - 判斷群組 / 一對一
- `handlers/group.js`
  - 群組邏輯
  - 節流與回覆判斷
- `handlers/direct.js`
  - 一對一 FAQ / 導購
- `claude-client.js`
  - 統一處理 Claude API 呼叫
- `config.js`
  - 集中管理：
    - 回覆機率
    - 冷卻時間
    - 深夜靜音
    - 關鍵字

---

## 7. 資料層規劃

### 已存在

- [`line-bot/data/products.json`](C:\Users\Ian Kuo\台灣低碳集團 Dropbox\董事長室\B 專案管理\B6 碳資產電業\claude code專案\購物網站\feifei-ecommerce\line-bot\data\products.json)
- [`line-bot/data/system-prompt.md`](C:\Users\Ian Kuo\台灣低碳集團 Dropbox\董事長室\B 專案管理\B6 碳資產電業\claude code專案\購物網站\feifei-ecommerce\line-bot\data\system-prompt.md)

### 建議新增

- `faq.json`
  - 常見問題與標準答案
- `topics.json`
  - 主動話題模板
- `guardrails.json`
  - 敏感詞、禁止回覆主題、轉人工規則

---

## 8. 業主需提供資料

LINE 專案啟動前，至少需要以下資訊：

1. LINE 官方帳號是否已開通
2. Messaging API 權限
3. Channel Access Token / Secret
4. 是否已有導購群組
5. 群組人數與活躍程度
6. 最常被問的問題 Top 10
7. 要導到哪裡：
   - Google 表單
   - WACA 商店
   - IG
8. 是否需要 Rich Menu

---

## 9. 驗收清單

### 9.1 一對一私訊

- 收到訊息可正常回覆
- FAQ 命中正確
- 可以導到正確連結
- 敏感問題會轉人工

### 9.2 群組

- 被問時會回
- 一般聊天不會過度插話
- 冷卻規則有效
- 深夜靜音有效

### 9.3 穩定性

- Webhook 可運作
- API key 與 LINE token 正常
- 錯誤不會讓整個 bot 當掉

---

## 10. 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| 小非回太多 | 群友反感 | 初版機率保守、設回覆上限 |
| 回錯產品 | 降低信任 | FAQ 優先，LLM 作補充 |
| 敏感話題亂回 | 品牌風險 | 加 guardrails 與轉人工規則 |
| LINE 權限未齊 | 無法實作 | 先確認帳號與 token |
| 產品資料未更新 | 回答過時 | 以 `data/products.json` 為單一資料來源 |

---

## 11. 執行順序

1. 鎖定 MVP 範圍
2. 確認 LINE 官方帳號權限
3. 補 `faq.json`
4. 補 `topics.json`
5. 建 `config.js`
6. 建 Webhook 基本版
7. 建一對一回覆
8. 建群組回覆與節流
9. 測試

---

## 12. 下一步

當前最合理的下一步是：

1. 先建立 `faq.json`
2. 先建立 `topics.json`
3. 定義 `config.js` 欄位規格

在這三份檔案完成前，不急著直接寫 bot 主程式。
