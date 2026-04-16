# 非非選品｜進度追蹤

> **最後更新**: 2026-04-16
> **定位**: 個人品牌帶貨（宗教 IP 方向待驗證），長期經營
> **合作模式**: Ian（行銷策略長）+ feifei（品牌主理人），長期抽成合作
> **官網**: https://ian0323.github.io/feifei-ecommerce/
> **Repo**: https://github.com/Ian0323/feifei-ecommerce

---

## Sprint 進度總覽

| Sprint | 目標 | 狀態 | 時間 |
|--------|------|------|------|
| Sprint 1 | 打破僵局，先上線 | ✅ 完成 | 2026-03-14 |
| Sprint 1.8 | 預約諮詢系統 | ✅ 完成 | 2026-04-16 |
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

## Sprint 1.5 ✅ — 多入口落地頁系統 + 策略整合

| 項目 | 狀態 | 備註 |
|------|------|------|
| Claude App 策略建議檢視 | ✅ | 5 個 HTML 設計稿 + strategy.md + midjourney prompts |
| products.json 擴充 | ✅ | 加入香調、建議定價、郭老師加持資料、品牌語言規範、多頁面路由 |
| links.html（KOL 個人品牌中心） | ✅ | Route C：link-in-bio 格式，mobile-first，255 行 |
| go.html（限時團購頁） | ✅ | Route D：倒數計時 + 組合選擇器，移除虛構數據，342 行 |
| blessing.html（宮廟聯名頁） | ✅ | Route E：深色宮廟風格，郭老師信任結構，257 行 |
| mist.html（完整品牌敘事頁） | ✅ | Route A：完整說服流程，scroll reveal 動畫，333 行 |
| brand.html（高端品牌頁） | ✅ | Route B：暗色高端風格，標記為未來用，415 行 |
| plan.md 策略整合 | ✅ | 新增 IG 導流優化、內容日曆、品牌三角信任、回購機制、多入口架構、IG 受眾數據 |
| midjourney-prompts.md | ✅ | 存入 docs/，含 7 類 prompt + 使用注意事項 |

**所有新頁面規範：** Tailwind CSS + products.json 資料驅動 + GA4 預留 + 無 hardcoded 產品資料

---

## Sprint 1.8 ✅ — 預約諮詢系統

| 項目 | 狀態 | 備註 |
|------|------|------|
| booking.html 預約頁面 | ✅ | 手機優先、品牌配色、4 步驟流程 |
| Google Apps Script 後端 | ✅ | 接收預約、Email 通知助理、狀態變更自動通知客戶 |
| Google Sheet 預約管理 | ✅ | 助理改狀態為「已確認」→ 1 分鐘內自動 Email 客戶 |
| 已預約時段自動 block | ✅ | 前端從公開 Sheet 讀取，已預約的時段不可選 |
| 客戶個資保護 | ✅ | 私人 Sheet 存完整資料，公開 Sheet 只有日期+時段+狀態 |
| Google Calendar 同步 | ✅ | 業主在日曆 block 時間 → 自動顯示「不開放」 |
| 品牌名稱 | ✅ | 改為「非非768 療育型問事」 |
| GitHub Pages 部署 | ✅ | 自動部署，LINE 可直接連結 |

**架構說明：**
- 預約頁面：`feifei-ecommerce/landing-page/booking.html`
- 後端程式碼：`feifei-ecommerce/booking-backend/Code.gs`（部署在 Google Apps Script）
- 私人 Sheet（預約紀錄）：`1IUDCeB087LLFoLyzGxp_4eTSpycYiWjNM8PJ6b7DhwM`
- 公開 Sheet（時段狀態）：`1mWyyA9N3bHsbCGZWg_FbQGinbev1sKG-gquh60Qtc-E`
- Apps Script 部署 URL：`AKfycbyIm5XPUyfR__N66-59kjUY1vyM8uY3RDeQzlIYj5gepuu7CBTHkOxO3HVU-eoKDlxC`
- 正式網址：`https://ian0323.github.io/feifei-ecommerce/booking.html`

**預約流程：**
```
客戶開啟預約頁（LINE 按鈕）→ 選日期 → 選時段 → 填資料 → 送出
→ Sheet 新增一筆 + Email 通知助理
→ 助理確認後改狀態為「已確認」→ 1 分鐘內自動 Email 通知客戶
→ 已預約的時段自動 block，其他客戶不可再選
```

**業主 block 時段方式：**
- 在 Google Calendar 建事件（單一時段 / 整天 / 多天）→ 自動同步為「不開放」

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
- [x] 多入口落地頁系統（links / go / blessing / mist / brand）
- [x] products.json 擴充（香調、定價、加持資料、頁面路由）

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
| 2026-03-21 | 建立多入口落地頁系統 | 不同流量來源的訪客需要不同的頁面承接（Claude App 策略建議） |
| 2026-03-21 | 移除團購頁虛構社會證明 | 「已售 N 組」等假數據與品牌誠信衝突 |
| 2026-03-21 | brand.html 標記為未來用 | 品牌升級需更多素材和廣告預算，現階段不啟用 |
| 2026-03-14 | plan.md 改為數據驅動版 | 移除缺乏數據的功能，加入驗證機制 |
| 2026-03-14 | 宗教 IP 定位「待驗證」 | 找不到成功案例，需 IG A/B 測試 |
| 2026-03-14 | 農曆行事曆等功能延後 | 需先驗證宗教內容互動率 |
| 2026-03-14 | 合作模式改為長期抽成 | 業主需求變更 |
| 2026-04-16 | 品牌名稱改為「非非768 療育型問事」 | 業主需求 |
| 2026-04-16 | 預約諮詢系統獨立於主站 | 從 LINE 按鈕連結，不與現有頁面整合 |
| 2026-04-16 | 客戶個資用獨立私人 Sheet 保護 | 公開 Sheet 只放時段狀態 |
| 2026-03-14 | 金流必須即時付款 | 業主不想透過 LINE 處理訂單 |
| 2026-03-14 | LINE 定位為社群，不處理訂單 | 業主明確要求 |
| 2026-03-09 | 童裝保留 SHOPLINE（不動） | 與百貨物料綁定 |

---

## 變更紀錄

| 日期 | 變更內容 |
|------|---------|
| 2026-04-16 | 預約諮詢系統上線：booking.html + Apps Script 後端 + Google Sheet 管理 + Calendar 同步 + 已預約時段 block + 客戶個資分離 |
| 2026-03-21 | Claude App 策略建議整合：5 個多入口落地頁、products.json 擴充、plan.md 策略更新、Midjourney prompts 存檔 |
| 2026-03-14 | plan.md 改為數據驅動版（商業模式分析 + 市場數據 + 功能驗證機制） |
| 2026-03-14 | PROGRESS.md 同步更新 Sprint 結構 |
| 2026-03-14 | Sprint 1 全部完成（官網上線、CTA 改造、圖片壓縮、Git + GitHub Pages） |
| 2026-03-14 | Code Review 修復 8 項問題 |
| 2026-03-09 | 建立 PROGRESS.md |
