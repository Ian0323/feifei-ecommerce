# 非非選品｜進度追蹤

> **最後更新**: 2026-03-14
> **定位**: 個人品牌帶貨（宗教 IP 方向待驗證），長期經營
> **合作模式**: Ian（行銷策略長）+ feifei（品牌主理人），長期抽成合作
> **官網**: https://ian0323.github.io/feifei-ecommerce/
> **Repo**: https://github.com/Ian0323/feifei-ecommerce

---

## Sprint 進度總覽

| Sprint | 目標 | 狀態 | 時間 |
|--------|------|------|------|
| Sprint 1 | 打破僵局，先上線 | ✅ 完成 | 2026-03-14 |
| Sprint 2 | 金流 + 追蹤 | ⬜ 待業主（售價、綠界帳號） | 下一步 |
| Sprint 3 | LINE Bot 上線 | ⬜ 待業主（LINE Channel） | Sprint 2 後 |
| Sprint 4 | 內容策略驗證（IG A/B 測試） | ⬜ 待 feifei 產出內容 | Sprint 3 後 |
| Sprint 5+ | 依 Sprint 4 數據決定 | ⬜ | — |

---

## Sprint 1 ✅ — 打破僵局，先上線

| 項目 | 狀態 | 備註 |
|------|------|------|
| Git repo 初始化 | ✅ | github.com/Ian0323/feifei-ecommerce |
| Landing page 上線 | ✅ | GitHub Pages 已部署 |
| Hero 圖修復 | ✅ | 改用產品預覽圖.jpg |
| CTA 全站改購買導向 | ✅ | 移除所有「加 LINE 諮詢」 |
| Instagram 連結填入 | ✅ | myfeifei768 |
| products.json 更新 | ✅ | CTA、FAQ、ordering 全面改購買導向 |
| SEO meta 更新 | ✅ | 移除 LINE 相關文案 |
| LINE Bot 程式碼修正 | ✅ | model ID、導購 CTA、field name |
| 圖片壓縮 | ✅ | 28.7MB → 383KB |
| CI 部署路徑修正 | ✅ | products.json 自動複製 + fallback fetch |
| plan.md 數據驅動版 | ✅ | 加入商業模式分析、市場數據、驗證機制 |

---

## Sprint 2 ⬜ — 金流 + 追蹤

**阻塞於業主：需要售價和金流帳號**

| 項目 | 狀態 | 備註 |
|------|------|------|
| 業主確認香霧售價 | ⬜ 待業主 | |
| 綠界 ECPay 帳號開通 | ⬜ 待業主 | 或確認替代金流方案 |
| 三款香霧獨立付款連結 | ⬜ 依賴上面兩項 | |
| Landing page CTA 串接付款連結 | ⬜ 依賴上面 | |
| GA4 追蹤碼埋設 | ⬜ 可先做 | |
| products.json 填入正式售價 | ⬜ 依賴售價確認 | |

---

## 待辦 — 等待業主

- [ ] 三款香霧正式售價
- [ ] 綠界 ECPay 帳號開通（或確認金流方式）
- [ ] LINE 官方帳號 Channel ID / Access Token
- [ ] feifei 本人照片 + 推薦語

---

## 已知技術債

- [x] ~~claude-client.js model ID 過期~~ → 已更新
- [x] ~~hero-placeholder.jpg 404~~ → 已修復
- [x] ~~keyword_handler 導購導向 LINE~~ → 已改為官網
- [x] ~~無 Git 版控~~ → 已建立 GitHub repo
- [ ] `config.js` 中 `links.*` 為空字串（待官網正式網址確認後填入）
- [ ] 無自動化測試
- [ ] `index-feifei-ip.html` 仍有舊版 LINE 文案（低優先，非主要頁面）
- [ ] LINE Bot `data/products.json` 與主 `products/products.json` 欄位不一致

---

## 已完成（歷史累積）

### 文件與規劃
- [x] 品牌視覺分析報告
- [x] 語言風格分析報告
- [x] plan.md 數據驅動版（含商業模式、行銷策略、市場數據）
- [x] CLAUDE.md 執行規範
- [x] 舊版檔案封存至 archive/

### Landing Page
- [x] index.html + products.json 資料驅動架構
- [x] Tailwind + GSAP 動畫
- [x] 產品 schema 文件、業主素材需求清單
- [x] GitHub Pages 部署 + CI workflow

### LINE Bot
- [x] server.js + controller.js 骨架
- [x] 一對一 FAQ + 產品推薦 + Claude AI 整合
- [x] 群組節流（冷卻、每小時上限、深夜靜音）
- [x] keyword_handler 導購
- [x] 內部廣播 API
- [x] 本地測試通過

---

## 關鍵決策紀錄

| 日期 | 決策 | 原因 |
|------|------|------|
| 2026-03-14 | plan.md 改為數據驅動版 | 移除缺乏數據的功能，加入驗證機制 |
| 2026-03-14 | 宗教 IP 定位「待驗證」 | 找不到成功案例，需 IG A/B 測試 |
| 2026-03-14 | 農曆行事曆等功能延後 | 需先驗證宗教內容互動率 |
| 2026-03-14 | 合作模式改為長期抽成 | 業主需求變更 |
| 2026-03-14 | 金流必須即時付款 | 業主不想透過 LINE 處理訂單 |
| 2026-03-14 | LINE 定位為社群，不處理訂單 | 業主明確要求 |
| 2026-03-09 | 童裝保留 SHOPLINE（不動） | 與百貨物料綁定 |

---

## 變更紀錄

| 日期 | 變更內容 |
|------|---------|
| 2026-03-14 | plan.md 改為數據驅動版（商業模式分析 + 市場數據 + 功能驗證機制） |
| 2026-03-14 | PROGRESS.md 同步更新 Sprint 結構 |
| 2026-03-14 | Sprint 1 全部完成（官網上線、CTA 改造、圖片壓縮、Git + GitHub Pages） |
| 2026-03-14 | Code Review 修復 8 項問題 |
| 2026-03-09 | 建立 PROGRESS.md |
