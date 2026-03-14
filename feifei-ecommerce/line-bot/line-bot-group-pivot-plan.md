# LINE Bot Group Pivot Plan

## 核心目標

把 `小非` 從偏被動 FAQ bot，轉成：

- 群組內的資深粉絲兼專業小助手
- 只在指定群組活躍
- 被提及、強意圖導購、或極低機率自然接話時才出聲

## 本次已落地

- 擴充 dependencies：
  - `@line/bot-sdk`
  - `dotenv`
  - `@anthropic-ai/sdk`
- 新增 env：
  - `ANTHROPIC_API_KEY`
  - `TARGET_GROUP_ID`
  - `BOT_ADMIN_TOKEN`
- 新增 group-only 限制
- 新增 sales intent 關鍵字
- 新增 `keyword_handler.js`
- 新增群組公告 API
- prompt 改成群組小幫手版本
- 預留 `voice-corpus.md` 作為未來大量短影音語料摘要入口

## 目前策略

- `@小非`：必回
- 強意圖導購：必回
- 一般群組閒聊：2% 機率
- 深夜一般聊天：不回
- 非指定群組：不回

## 下一步

1. 補真實 `TARGET_GROUP_ID`
2. 補 landing page / WACA 真實連結
3. 驗證群組中 sales intent 的真實導購效果
4. 開始把短影音分析濃縮進 `voice-corpus.md`
