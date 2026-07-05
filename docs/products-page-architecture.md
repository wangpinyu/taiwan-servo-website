# 產品頁架構標準

更新日期：2026-07-06

本文件定義星泰產品頁在本機 preview 與 GitHub 工作流中的共用架構。目標是保留正式網既有 UIUX 與後台限制，同時讓產品頁具備可選型、可比較、可下載、可詢問的 B2B 產品資訊結構。

## 後台限制分層

- 高自由度可編輯：產品頁 CKEditor 主內容區，主要對應 `tw_specifications`。
- 結構化可編輯但非自由排版：標題、分類、SEO、代表圖、圖片欄位。
- 模板鎖死或不應由本輪調整：全站導覽、側邊分類框架、側邊「介紹」標籤、footer、浮動按鈕、部分固定版型。

本機 preview 可以用來驗證內容與排版方向，但不要把 preview 中的模板區修改誤認為後台可直接落地。

## 主內容模組順序

產品頁主內容區以以下順序為標準：

1. 主內容區
2. 產品系列
3. 產品規格詳情
4. 應用領域
5. 技術資料下載

若正式網頁面缺少某一模組，不憑空補寫未經來源支持的內容。若已有 `產品規格詳情` 候選，優先放在 `產品系列` 正下方；若沒有明確系列模組，放在 `應用領域` 前。

## 模組命名規則

- 產品卡片、系列、型號導覽：統一命名為 `產品系列`。
- 規格表、規格比較、accordion 規格區：統一命名為 `產品規格詳情`。
- Applications、Industry Applications、推薦應用領域：統一命名為 `應用領域`。
- Downloads、相關下載、文件下載：統一命名為 `技術資料下載`。
- `核心技術能力`、`選型建議`、`特色` 等合理產品內容模組可保留，不強制歸入標準四類；不確定時列入人工審查報告。

## 產品規格詳情規則

- 必須位於 `產品系列` 後方。
- 使用真正的 `<table>`，不得使用 div 偽表格。
- 表頭保留原廠欄位與單位，例如 `Stroke (mm)`、`Peak Force (N)`、`Torque (Nm)`。
- 型號或 Part Number 欄建議作為第一欄，並在樣式允許時使用 sticky first column。
- 表頭建議 sticky，手機版必須允許橫向捲動並有視覺提示。
- Accordion 必須使用 `<button>` 或原生 `<details>/<summary>`，並提供清楚的展開/收合提示。
- PDF、CAD、Manual、Catalog、Drawing、Software 不可混為同一類。
- 不得出現 `href="#"`、`.txt` href、`file:///`、本機磁碟路徑、`data-local-file`、`pending`、`placeholder` 或內部工作註解。
- 缺少官方來源時不可猜測規格；應標記為 `source-needed` 或使用公開可辯護的缺值文字，例如 `—`、`原廠未公開`、`請洽星泰`。

## CTA 與詢問流程

- 規格模組中至少要有清楚可見的詢問入口。
- CTA 應沿用既有詢問或聯絡流程。
- 若目前無法自動帶入型號，不要把 TODO 顯示在前台；限制記錄在報告或 PR 說明中。

## SEO 保護規則

- 每頁只保留一個 H1。
- 主內容模組使用合理 H2/H3 階層。
- 保留既有 title、meta description、canonical、breadcrumb 與內部連結邏輯。
- 重要內容必須是可爬取 HTML，不只放在圖片、PDF 或不可讀 JS 內。
- 沒有可見 FAQ 時不得加入 FAQ schema。
- 不新增假價格、假庫存、假評分、假評論。

## SMAC 樣板規則

SMAC 電動缸目前是第一個標準樣板：

- `產品系列` 負責系列辨識與選型導覽，包含圖片、系列名稱、定位/用途與 2 到 3 個關鍵規格或特點。
- `產品規格詳情` 負責技術比對與文件查核，包含 accordion、原廠欄位表格、PDF/CAD 入口與 CTA。
- `產品規格詳情` 不放產品圖片，不重複 `產品系列` 的介紹段落。

## 驗收入口

- 本機入口：`site/index.html`
- 產品規格 QA：`site/reports/product-spec-module-qa.html`
- 產品頁 SEO/結構 QA：`site/reports/product-page-structure-seo-qa.html`
- AI agent review：`site/reports/product-spec-agent-review.html`
- Source-needed audit：`site/reports/source-needed-audit.html`
- GitHub readiness：`site/reports/github-bootstrap-readiness.html`
