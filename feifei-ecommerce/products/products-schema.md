# Products Schema

> 用途：說明 `products/products.json` 的欄位結構，讓後續 AI 或人工可以快速補資料。

## 1. 使用原則

- `products.json` 是 landing page 的主要資料來源
- 要改產品文案、價格、FAQ、連結，優先改這個檔案
- 不要先改 `landing-page/index.html` 的靜態內容，除非是版型需求

## 2. 主要區塊

### `brand`

- `name`
- `project_name`
- `category`
- `tagline`
- `description`
- `tone`

### `links`

- `order_form`
- `line_official`
- `instagram`

每筆連結建議維持：

- `status`
- `url`
- `note`

### `ordering`

- `method`
- `steps`
- `shipping_note`
- `payment_note`

### `owner_fill_checklist`

- `required_now`
- `good_to_have`

### `faq`

每筆包含：

- `question`
- `answer`

### `products`

每筆包含：

- `id`
- `name_zh`
- `name_en`
- `status`
- `price_twd`
- `price_note`
- `theme_color`
- `background_color`
- `image`
- `one_liner`
- `short_description`
- `use_cases`
- `cta_label`
- `notes`

### `content_status`

供 AI 快速判斷哪些內容還未備齊。

### `data_source_notes`

說明資料流與維護方式。

### `next_actions`

目前待辦事項。

## 3. 補資料優先順序

1. `price_twd`
2. `image.src`
3. `links.order_form.url`
4. `links.line_official.url`
5. `brand.description`
6. `faq`

## 4. Follow 規則

- 新資料先寫回 `products.json`
- 再由頁面自動讀取
- 若新增欄位，先更新此文件，再更新 JSON 與頁面
