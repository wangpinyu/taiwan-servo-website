# 產品頁共用架構與規格模組標準

更新日期：2026-07-06

本文件定義星泰產品頁本機 preview 的共用架構。目標是保留正式網既有 UIUX 作為基底，逐步把產品頁提升為可選型、可比較、可下載、可詢問的技術型 B2B 產品頁。

## 編輯邊界

- 高自由度可編輯：產品頁 CKEditor 主內容區，後台欄位通常是 `tw_specifications`。
- 結構化可編輯但非自由排版：產品標題、分類、SEO、代表圖、圖片欄位。
- 模板鎖死：側邊 `介紹` 標籤、全站導覽、側欄分類框架、footer、浮動按鈕、部分產品頁固定版型。
- 本機 preview 階段不登入後台、不保存、不上傳、不改測試網。

## 標準模組順序

產品頁主內容區以正式網既有版面為準，只統一模組名稱與新增規格模組位置：

1. 主內容區
2. 產品系列
3. 產品規格詳情
4. 應用領域
5. 技術資料下載

若頁面沒有明確 `產品系列`，但有 `應用領域`，則 `產品規格詳情` 插在 `應用領域` 前。若沒有既有規格模組候選，不自行編寫規格，只列入缺口。

## 模組命名規則

- 產品卡片、系列、型號導覽類統一為 `產品系列`。
- 規格表、型號矩陣、系列比較表統一為 `產品規格詳情`。
- Applications、Industry Applications、推薦應用、主要應用統一為 `應用領域`。
- Downloads、相關下載、原廠文件下載統一為 `技術資料下載`。
- `核心技術能力`、`產品特色`、`快速選型` 等合理內容模組保留，不強制改名。
- 無法判定的標題列入 `product-standardization-report` 與 AI agent 審核報告，不自動改寫；AI agent 先判定歸類，只有來源衝突或後台限制無法處理時才升級為人工例外。

## 產品規格詳情模組要求

- 必須使用真正的 `<table>`，不得用 div 偽表格。
- 表頭需保留原廠語意；有單位的欄位應在表頭呈現，例如 `Peak Force (N)`、`Stroke (mm)`。
- 手機版表格必須允許橫向捲動，並保留視覺提示。
- 型號或 Part Number 欄建議做 sticky first column；表頭建議 sticky。
- PDF、CAD、Manual、Catalog、Drawing、Software 應分清楚，不混在同一個模糊按鈕。
- 下載按鈕需有可辨識文字或 `aria-label`。
- 不得出現 `href="#"`、`.txt` 下載、本機磁碟路徑、`file:///`、`data-local-file`、`data-upload-url`、`data-source-url` 或內部工作註解。
- 產品圖片與系列介紹應歸入 `產品系列`；`產品規格詳情` 不放產品圖片。
- 若沒有型號級下載，顯示 `請洽星泰` 或等價狀態，不留空。
- CTA 目標是銜接詢問流程；目前若不能自動帶入系列/型號，需在 QA 報告中保留 `spec_cta_missing_or_outside_block` 警告，並交由 AI agent 優先修正。

## SMAC 樣板規則

SMAC 電動缸以目前本機 preview 的 373、374、375 系列規格模組作為基準：

- 產品系列卡片負責放原廠系列介紹、產品圖片、定位用途與 2-3 個關鍵特點。
- 產品規格詳情只放 accordion、規格摘要、型號表、PDF/CAD 入口與必要 CTA。
- 規格表欄位依原廠產品表設計，不用跨系列硬統一到錯誤欄位。
- 不把給開發人員看的註解放到前台，例如來源整理說明、待上架、待人工確認流程說明。

## 本機產出與驗收入口

- 本機主控面板：`.codex_tmp/site-mirror-current/index.html`
- 產品標準化報告：`.codex_tmp/site-mirror-current/reports/product-standardization-report.html`
- 產品規格詳情 QA：`.codex_tmp/site-mirror-current/reports/product-spec-module-qa.html`
- AI agent 審核決策：`.codex_tmp/site-mirror-current/reports/product-spec-agent-review.html`
