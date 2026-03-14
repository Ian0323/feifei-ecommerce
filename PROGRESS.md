# 非非選品｜宗教 IP 品牌 — 進度追蹤

> **最後更新**: 2026-03-14
> **定位**: 宗教 IP 帶貨品牌（長期經營，非一次性建置）
> **合作模式**: Ian（行銷策略長）+ feifei（品牌主理人），長期抽成合作
> **狀態**: 計畫重整完成，準備啟動 Sprint 1

---

## Sprint 進度總覽

| Sprint | 目標 | 狀態 | 預計時間 |
|--------|------|------|---------|
| Sprint 1 | 打破僵局，先上線 | 🔄 進行中 | 本週 |
| Sprint 2 | 宗教 IP 內容系統 | ⬜ 未開始 | 下週 |
| Sprint 3 | LINE Bot 上線 | ⬜ 未開始 | 第 3 週 |
| Sprint 4 | 金流串接 + 數據追蹤 | ⬜ 未開始 | 第 4 週 |
| Sprint 5 | 選物商店 + link-in-bio | ⬜ 未開始 | 第 5-6 週 |
| Sprint 6+ | 持續營運優化 | ⬜ 未開始 | ongoing |

---

## Sprint 1 檢核表 — 打破僵局，先上線

| 項目 | 狀態 | 備註 |
|------|------|------|
| Git repo 初始化 | ⬜ 未開始 | 從 Dropbox 遷移到 GitHub |
| Landing page 用現有素材上線 | 🔄 進行中 | 程式碼修改完成，待部署 |
| Hero 圖替換 placeholder | ✅ 完成 | 改用產品預覽圖.png |
| CTA 改為購買導向 | ✅ 完成 | 全站移除「加 LINE 諮詢」，改為「立即購買」 |
| Instagram 連結填入 | ✅ 完成 | myfeifei768 已填入 footer + order section |
| products.json 更新 | ✅ 完成 | CTA 改「立即購買」，FAQ 改直接購買導向，ordering 改即時付款 |
| SEO meta 更新 | ✅ 完成 | 移除 LINE 相關文案 |
| LINE Bot 程式碼修正 | ✅ 完成 | model ID 更新、導購 CTA 改官網、field name 修正 |
| GitHub Pages 部署 | ⬜ 未開始 | 需先初始化 git repo |

---

## 已完成（歷史累積）

### 文件與規劃
- [x] 品牌視覺分析報告（基於 16 張圖片）
- [x] 語言風格分析報告（基於逐字稿）
- [x] 主控計畫 plan.md v1（已作廢，封存於 archive/）
- [x] 執行工作規範 CLAUDE.md
- [x] 舊版檔案整理至 archive/
- [x] **plan.md 重寫為宗教 IP 長期經營版** ← 2026-03-14

### Landing Page
- [x] 正式頁面結構 index.html
- [x] 動態資料層 products.json
- [x] 文案調整為 feifei 個人 IP 帶貨版
- [x] Tailwind + GSAP 動畫（無編譯流程）
- [x] 產品 schema 文件 products-schema.md
- [x] 業主素材需求清單 owner-material-request.md

### LINE Bot
- [x] Node.js 骨架：server.js、controller.js
- [x] 一對一 FAQ + 產品推薦邏輯
- [x] 群組 mention / 關鍵字 / 冷卻機制
- [x] 深夜靜音（23:00-08:00）
- [x] Claude API 整合骨架
- [x] System Prompt「非非小幫手」人設定義
- [x] data/faq.json、topics.json、products.json
- [x] 群組節流規則（冷卻、每小時上限、深夜判斷）
- [x] keyword_handler 導購關鍵字回覆
- [x] 內部廣播 API
- [x] 本地測試 smoke test 通過

---

## 待辦 — 等待業主

- [ ] 三款香霧正式售價
- [ ] 綠界 ECPay 帳號開通（或確認金流方式）
- [ ] LINE 官方帳號 Channel ID / Access Token
- [ ] feifei 本人照片 + 推薦語
- [ ] 宗教 IP 內容方向確認（哪間廟、什麼信仰體系）

---

## 已知技術債

- [x] ~~`claude-client.js` model ID 過期~~ → 已更新為 `claude-sonnet-4-6`
- [x] ~~`hero-placeholder.jpg` 不存在~~ → 已改用產品預覽圖.png
- [x] ~~`keyword_handler.js` 導購 CTA 導向 LINE~~ → 已改為導向官網
- [ ] `config.js` 中 `links.*` 全為空字串（待部署後填入）
- [ ] 無 Git 版控（目前在 Dropbox）
- [ ] 無自動化測試
- [ ] `index-feifei-ip.html` 仍有舊版 LINE 文案（低優先，非主要頁面）
- [ ] `landing-page/index.html` 使用 innerHTML 渲染 JSON（XSS 風險低，資料為自有）
- [ ] LINE Bot `data/products.json` 與主 `products/products.json` 欄位不一致

---

## 關鍵決策紀錄

| 日期 | 決策 | 原因 |
|------|------|------|
| 2026-03-14 | 合作模式改為長期抽成 | 業主需求變更 |
| 2026-03-14 | 品牌定位改為宗教 IP | 業主確認走宗教路線 |
| 2026-03-14 | 金流必須即時付款 | 業主不想透過 LINE 處理訂單 |
| 2026-03-14 | LINE 定位為社群經營，不處理訂單 | 業主明確要求 |
| 2026-03-14 | plan.md 全面重寫 | 舊版基於一次性結案，不適用 |
| 2026-03-09 | 童裝保留 SHOPLINE（不動） | 與百貨物料綁定 |
| 2026-03-09 | 香霧核心客群：民間信仰信眾 | 市場洞察 |

---

## 變更紀錄

| 日期 | 變更內容 |
|------|---------|
| 2026-03-14 | plan.md 全面重寫：從一次性結案改為長期經營宗教 IP 品牌 |
| 2026-03-14 | PROGRESS.md 重整：改為 Sprint-based 追蹤 |
| 2026-03-14 | 金流策略確認：即時付款（綠界/WACA），LINE 不處理訂單 |
| 2026-03-14 | Code Review 完成：修復 8 項問題（hero 圖、CTA、model ID、導購邏輯、field name） |
| 2026-03-09 | 建立 PROGRESS.md，從現有系統狀態初始化 |
