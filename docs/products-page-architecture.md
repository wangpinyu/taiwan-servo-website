# 產品頁架構標準

最後更新：2026-07-06

本文件定義星泰產品頁在本機 preview 與 GitHub 工作流中的標準結構。目標是保留正式網既有 UIUX 與後台限制，同時讓產品頁具備「可選型、可比較、可下載、可詢問」的 B2B 技術型資訊架構。

## 後台限制分層

- 高自由度可編輯：產品頁 CKEditor 主內容區，主要是 `tw_specifications`。
- 結構化可編輯但非自由排版：產品名稱、分類、SEO 欄位、代表圖、圖片欄位。
- 模板鎖死或全站共用：側邊「介紹」標籤、全站導覽、產品分類側欄框架、footer、浮動按鈕、部分商品固定版型。

本機 preview 可以模擬前台視覺與內容，但後續上架時只把可控內容放回可編輯欄位，不假設能修改模板鎖死區域。

## 主內容模組順序

產品頁主內容區的標準順序如下：

1. 主內容區
2. 產品系列
3. 產品規格詳情
4. 應用領域
5. 技術資料下載

若原頁沒有明確「產品系列」模組，但有應用或下載區，`產品規格詳情` 可插在 `應用領域` 前。若沒有可靠規格來源，不自動新增規格表，只標記為 `source-needed` 或 `no-spec-module`。

## 模組命名規則

- 產品卡片、系列卡片、型號導覽、產品型號規格卡片：統一命名為 `產品系列`。
- 規格比較表、型號矩陣、accordion 規格模組：統一命名為 `產品規格詳情`。
- Applications、Industry Applications、推薦應用領域等：統一命名為 `應用領域`。
- Downloads、資料下載、相關下載、技術文件等：統一命名為 `技術資料下載`。
- `核心技術能力`、`選型指南`、`控制器選項` 等合理產品內容模組可保留，不強制歸入四類；無法判定時列入人工審查。

## 產品規格詳情規則

- 必須位於 `產品系列` 下方，不得放在產品系列前。
- 使用真正的 `<table>`，不得用 div 偽表格。
- 表頭保留原廠欄位與單位，例如 `Peak Force (N)`、`Stroke (mm)`。
- 型號或 Part Number 欄建議 sticky first column；表頭建議 sticky。
- 手機版允許橫向捲動，但需有視覺提示。
- Accordion 使用 `<button>`、`aria-expanded`、`aria-controls`，並提供清楚的「展開 / 收合」文字或符號。
- PDF、CAD、Manual、Catalog、Drawing、Software 必須分類清楚。
- 不得出現 `href="#"`、`.txt` href、`file:///`、本機磁碟路徑、`data-local-file`、`pending`、`placeholder`、`待人工上架`、開發者註解。
- 原廠未公開或資料不足時，使用 `—`、`原廠未公開`、`請洽星泰` 或標記 `source-needed`，不得編造規格。

## CTA 與詢問流程

- 規格模組中至少要有可用的詢問入口。
- CTA 可以先沿用正式網既有詢問流程。
- 若目前無法自動帶入系列或型號，前台不可顯示 TODO；TODO 只留在程式碼或報告中。

## SEO 與可爬取性

- 每頁維持單一 H1。
- 主內容模組使用合理 H2/H3。
- 保留既有 title、meta description、canonical、breadcrumb 與導覽邏輯。
- 重要產品資訊用可爬取 HTML，不放在純圖片或不可讀 JS 中。
- 有可見 FAQ 才能加入 FAQ schema；不得新增假價格、假庫存、假評分、假評論。

## SMAC 樣板規則

SMAC 電動缸是第一個標準樣板：

- `產品系列` 負責系列辨識與選型導覽，每張卡片包含圖片、系列名稱、定位/用途、2-3 個關鍵規格或特點。
- `產品規格詳情` 負責技術比對與文件查核，保留 accordion、摘要規格、原廠表格、PDF/CAD 入口與 CTA。
- 產品規格詳情不得重複產品系列圖片，也不得放開發人員說明文字。

## 主要驗收入口

- 本機入口：`site/index.html`
- 產品規格 QA：`site/reports/product-spec-module-qa.html`
- AI agent review：`site/reports/product-spec-agent-review.html`
- Source-needed audit：`site/reports/source-needed-audit.html`
- GitHub readiness：`site/reports/github-bootstrap-readiness.html`
