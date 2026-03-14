# feifei 宗教 IP 品牌 — AI 開發規範

## Source of Truth

- 主控計畫：`plan.md`
- 進度追蹤：`PROGRESS.md`
- 產品數據：`feifei-ecommerce/products/products.json`
- 官網首頁：`feifei-ecommerce/landing-page/index.html`
- LINE Bot 程式碼：`feifei-ecommerce/line-bot/`
- 歷史參考：`archive/`（舊版文件，不作為執行依據）

## 核心規則

1. **先上線，再完善** — 有東西比完美重要
2. **即時付款** — CTA 是「立即購買」→ 付款連結，不是「加 LINE 洽詢」
3. **LINE 不處理訂單** — LINE 是社群經營，不是收銀台
4. **宗教內容要真誠** — 不編造靈驗故事、不承諾療效
5. **資料驅動** — 內容從 JSON 檔讀取，更新 JSON 即更新全站
6. **長期思維** — 每個決策考慮 6 個月後的影響

## 工作流程

1. 開始前先讀 `plan.md` 和 `PROGRESS.md`
2. 不要建立新的 `plan-vN.md` 或 `index-vN.html`
3. 更新結構化資料（JSON）優先於直接改 HTML
4. 完成後更新 `PROGRESS.md`
5. 靜態前端不用框架，保持 HTML + Tailwind + 少量 JS

## 文案原則

- 宗教場景為主，身心靈質感為輔
- 語氣溫柔但直接，像主理人在推薦自己真的會用的東西
- 不承諾療效、不編造靈驗故事
- 可以提農曆、拜拜、財神，但不要過度玄學

## 部署

- 官網：GitHub Pages（source: `feifei-ecommerce/landing-page`）
- LINE Bot：待部署（Railway / Render）

## 安全

- Secrets 只放 `.env`，不 hardcode
- 不在程式碼中出現 LINE / Claude API 金鑰
- 保留 archived 文件除非明確要求刪除
