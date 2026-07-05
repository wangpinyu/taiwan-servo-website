# GitHub 驅動產品頁優化工作流

更新日期：2026-07-06

本文件定義如何在私人 GitHub repository 中持續完成星泰產品頁優化。目標是讓 `main` 永遠保持可驗證，所有類別優化都透過分支、PR、CI、AI review 收斂。

## 分支與 PR

- `main`：穩定基準，只合併已通過 QA 的工作。
- `phase-1-smac-spec-standard`：SMAC / 電動缸標準樣板。
- `phase-2-drivers-spec-review`：驅動器與 ACS。
- `phase-3-renishaw-feedback`：Renishaw 與回授元件。
- 其他類別以 `phase-N-<category>` 或 `category-<slug>` 命名。

每個 PR 必須包含：

- 修改類別與產品頁數。
- `npm run validate` 結果。
- `site/reports/product-spec-module-qa.html` 與 `site/reports/product-spec-agent-review.html` 摘要。
- 仍為 `source-needed` 或 `source-audit-needed` 的例外清單。
- 是否可進入後台/伺服器部署準備。

## Issue 與 Label

標準 labels 來源為 `.github/labels.yml`。如果 GitHub 尚未安裝 label sync action，可手動依此檔建立。

- `spec-module`：規格模組、accordion、table、CTA。
- `seo`：title、meta、canonical、schema、heading、internal links。
- `uiux`：桌機/手機版、可讀性、可及性、版面。
- `download-links`：PDF、CAD、manual、catalog、drawing、software。
- `source-needed`：官方來源不足或衝突。
- `backend-ready`：本機 preview 已可準備上架。
- `blocked-server-large-file`：已知大檔或伺服器上傳問題。

## 狀態流轉

產品頁以 `site/reports/product-spec-agent-review.json` 為任務來源。

1. `agent-fix-required`：AI agent 可直接修版。
2. `agent-structure-review`：AI agent 先判定模組歸類與結構。
3. `agent-source-audit-needed`：AI agent 先查來源；來源衝突才升級人工。
4. `agent-source-needed`：沒有足夠來源，不自動補規格。
5. `agent-approved-clean`：本機優化完成。

## 優先順序

1. SMAC / 電動缸樣板。
2. 共通警告批次修正：CTA、accordion aria、表格橫向提示、下載按鈕文案。
3. 第一優先類別：電動缸、驅動器、各類馬達、ACS、Harmonic Drive、Renishaw、定位平台、軸承。
4. 第二優先類別：聯軸器、FMS、固態繼電器、山洋電氣、特殊環境。
5. 第三優先類別：陶瓷吸盤、SEJINIGB、鼓風機、自動化系統。

## 完成門檻

每個類別完成需同時滿足：

- 該類別目標頁面為 `agent-approved-clean`，或明確標記 `source-needed`。
- `npm run validate` pass。
- 無 `href="#"`、`.txt` href、本機路徑、內部註解、`pending`、`placeholder`、`data-local-file`。
- 產品規格詳情位於產品系列下方。
- PDF / CAD / Manual / Catalog / Drawing / Software 分類可讀。
- Desktop 與 Mobile 抽樣無明顯破版、破圖或不可讀表格。

## 後台與正式站部署邊界

本 repo 階段只處理本機 preview 與 GitHub QA。後台保存、測試網上架、正式伺服器覆蓋需另開部署任務，並依 Shin Tai backend 操作規則進行。

