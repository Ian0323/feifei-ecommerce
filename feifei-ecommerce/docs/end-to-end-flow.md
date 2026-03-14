# End-to-End Flow

> 用途：統一描述 `IG -> landing page / WACA / LINE` 的實際導流路徑，作為後續開發、驗收與業主溝通基準。

## 1. 目標

把目前專案拆成三條清楚路徑：

1. `香霧導購路徑`
2. `選物商店路徑`
3. `LINE 詢問 / 群組互動路徑`

每條路徑都要回答三件事：

- 使用者從哪裡進來
- 會看到什麼
- 最後要被導到哪裡

## 2. 入口層

主要入口預設為：

- Instagram Bio
- Instagram 限動 / Reels
- LINE 群組
- LINE 一對一私訊

### 對應入口策略

- `IG Bio`
  - 進 `link-in-bio`
- `IG 限動 / Reels`
  - 視內容直接導去：
    - 香霧 landing page
    - WACA 商店
    - LINE 官方帳號
- `LINE 群組`
  - 由小非做互動與導購
- `LINE 一對一`
  - 由小非處理 FAQ / 導購 / 轉人工

## 3. 路徑 A：香霧導購

### 使用情境

- 使用者看了香霧相關內容
- 對產品有興趣，但還沒準備進商店
- 想先看品牌感、產品差異、下單方式

### Flow

```text
IG 限動 / Reels / Bio
  -> landing page
  -> 看三款差異
  -> 點 CTA
  -> Google 表單
  -> 匯款
  -> 業主確認出貨
```

### 關鍵頁面

- `landing-page/index.html`
- Google 表單

### 轉換目標

- 表單提交
- 加入 LINE 詢問

## 4. 路徑 B：選物商店

### 使用情境

- 使用者想直接逛商品
- 對韓國服飾 / 選物有購物意圖
- 需要完整商店、購物車、金流物流

### Flow

```text
IG Bio / 限動
  -> link-in-bio
  -> WACA 商店
  -> 商品頁
  -> 結帳
  -> PayNow / 物流
```

### 關鍵頁面

- `link-in-bio/index.html`
- WACA 商店

### 轉換目標

- 商店下單完成

## 5. 路徑 C：LINE 詢問 / 群組互動

### 使用情境

- 使用者有疑問
- 需要被推薦適合哪一款
- 需要比較產品差異
- 在群組中被小非導購

### Flow

```text
LINE 官方帳號 / 群組
  -> 小非 FAQ / 導購
  -> 導到 landing page / 表單 / WACA
  -> 若遇訂單或售後問題
  -> 轉人工找 feifei
```

### 關鍵節點

- 一對一私訊
- 群組 mention
- FAQ 關鍵字
- 轉人工規則

### 轉換目標

- 解答問題
- 導到正確路徑
- 不讓客人流失

## 6. 各路徑的角色分工

### Landing Page

- 負責：
  - 建立品牌感
  - 解釋三款差異
  - 承接香霧導購
- 不負責：
  - 複雜購物車
  - 自動金流

### WACA

- 負責：
  - 選物交易
  - 後台上架
  - 金流物流
- 不負責：
  - 香霧品牌故事主頁

### LINE Bot

- 負責：
  - FAQ
  - 導購
  - 群組互動
  - 轉人工
- 不負責：
  - 處理售後決策
  - 承諾療效

## 7. 驗收角度

後續驗收要用「路徑」而不是單一頁面驗收。

### 驗收案例

1. `IG -> landing page -> 表單`
2. `IG -> link-in-bio -> WACA -> 結帳`
3. `LINE -> 小非 -> landing page / 表單`
4. `LINE 群組 -> 小非 -> 導購`

## 8. 目前狀態

### 已完成

- landing page 初版
- line-bot 文件與骨架
- line-bot 本地 handler 測試

### 進行中

- line-bot 真實接線前置

### 未完成

- WACA 真實上線驗證
- link-in-bio 串接驗證
- 全路徑端到端驗收

## 9. 下一步

1. 補 link-in-bio 規劃或實作
2. 補 WACA 路徑驗收清單
3. 做整體端到端測試 checklist
