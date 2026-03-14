# feifei 品牌 — AI 開發規範

## Source of Truth

- 主控計畫：`plan.md`（含商業模式、行銷策略、市場數據）
- 進度追蹤：`PROGRESS.md`
- 產品數據：`feifei-ecommerce/products/products.json`
- 官網首頁：`feifei-ecommerce/landing-page/index.html`
- LINE Bot：`feifei-ecommerce/line-bot/`
- 歷史參考：`archive/`（不作為執行依據）

## 核心規則

1. **數據驅動** — 功能只在有數據支撐時才做，不靠直覺
2. **先驗證再開發** — 不預先蓋空的區塊，等有真實需求再做
3. **即時付款** — CTA 是「立即購買」，不是「加 LINE 洽詢」
4. **LINE 不處理訂單** — LINE 是社群經營，不是收銀台
5. **內容是引擎** — feifei 的內容產出是一切的前提，沒有內容就沒有流量
6. **先上線，再完善** — 有東西比完美重要

## 新功能決策流程

提議新功能前必須回答：
1. 有什麼數據支撐這個功能值得做？
2. 不做會怎樣？
3. 能不能先用最小方式驗證，再決定要不要正式開發？

## 工作流程

1. 開始前先讀 `plan.md` 和 `PROGRESS.md`
2. 不要建立新的 `plan-vN.md` 或 `index-vN.html`
3. 更新 JSON 優先於直接改 HTML
4. 完成後更新 `PROGRESS.md`
5. 靜態前端不用框架，保持 HTML + Tailwind + 少量 JS

## 文案原則

- 語氣溫柔但直接，像主理人在推薦自己會用的東西
- CTA 是「立即購買」不是「加 LINE 洽詢」
- 不承諾療效、不編造故事
- 宗教/信仰元素的比重依 IG 數據驗證結果調整（見 plan.md Sprint 4）

## 部署

- 官網：GitHub Pages（source: `feifei-ecommerce/landing-page`）
- CI：`.github/workflows/deploy-landing-page.yml` 自動部署
- LINE Bot：待部署（Railway / Render）

## 安全

- Secrets 只放 `.env`，不 hardcode
- 不在程式碼中出現 LINE / Claude API 金鑰
