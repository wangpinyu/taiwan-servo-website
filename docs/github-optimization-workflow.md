# GitHub 驅動的星泰產品頁優化工作流

更新日期：2026-07-06

本 repo 是星泰網站本機 preview、產品規格詳情模組、SEO/UIUX QA 與 GitHub PR 工作流的主工作區。目標是先在本機完成可驗證的前端優化，再進入後台或伺服器部署階段。

## 分支與 PR 節奏

- `main`：保持可驗證狀態，只合併通過 QA 的 PR。
- `phase-1-smac-spec-standard`：SMAC / 電動缸標準樣板。
- `phase-2-drivers-spec-review`：驅動器、ACS 控制器 / 驅動器。
- `phase-2-motors-spec-review`：各類馬達。
- `phase-3-harmonic-drive`：Harmonic Drive 減速機。
- `phase-3-renishaw-feedback`：Renishaw 回授元件。
- `phase-3-positioning-stage`：定位平台。
- `phase-3-bearings-air-mechanical`：空氣軸承、滾珠 / 滾柱軸承。
- `phase-4-couplings`：聯軸器。
- `phase-4-fms-tension`：FMS 張力系統。
- `phase-4-solid-state-relays`：固態繼電器。
- `phase-4-sanyo-denki`：山洋電氣。
- `phase-4-special-environments`：特殊環境與其他專題頁。
- `phase-5-ceramic-chucks`：陶瓷吸盤。
- `phase-5-sejinigb`：SEJINIGB。
- `phase-5-blowers`：鼓風機。
- `phase-5-automation-systems`：自動化系統。
- `phase-5-other-feedback`：其他回授元件與剩餘頁面。

每個 PR 必須附：

- 修改頁數與目標分類。
- `npm run validate` 結果。
- QA 報告連結或路徑。
- AI review 狀態變化。
- `source-needed`、後台限制、大檔或外部下載連結等例外。

## Labels

labels 定義在 `.github/labels.yml`：

- `spec-module`：產品規格詳情、表格、accordion、CTA。
- `seo`：title、meta、canonical、breadcrumb、schema、heading。
- `uiux`：版型、響應式、可讀性、可用性、視覺層級。
- `download-links`：PDF、CAD、Manual、Catalog、Drawing、Software 連結。
- `source-needed`：官方來源或下載對應仍需確認。
- `backend-ready`：本機 preview 已可進入後台或部署準備。
- `blocked-server-large-file`：已知伺服器大檔或上傳限制，不阻塞本機優化。

## 本機驗證

完整驗證：

```powershell
npm run validate
```

常用分段驗證：

```powershell
npm run qa:site
npm run qa:mirror
npm run qa:spec
npm run qa:agent
npm run qa:source-needed
```

產生 backlog 與 issue index：

```powershell
npm run workflow:backlog
```

產生 PR index：

```powershell
npm run workflow:pr-index
```

產生 GitHub bootstrap readiness：

```powershell
npm run workflow:github-readiness
```

閱讀 `site/reports/github-bootstrap-readiness.html` 判斷目前是 `ready`、`ready-needs-token` 或 `blocked`。

## GitHub 自動化

先執行 dry-run，不需要 token：

```powershell
npm run github:bootstrap:dry-run
```

確認 dry-run 後，如果要建立 labels、issues、PRs，使用 GitHub fine-grained token。token 只放在目前 PowerShell session 的環境變數，不寫入檔案：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

只建立少量物件做 smoke test：

```powershell
npm run github:bootstrap:smoke:dry-run
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

如果不使用 API，可產出手動建立 PR / issue 的 Markdown：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-pr.ps1 -Branch phase-1-smac-spec-standard
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-issue.ps1 -Branch phase-1-smac-spec-standard
```

## Agent Review 狀態

主要來源是 `site/reports/product-spec-agent-review.json`。

狀態定義：

- `agent-fix-required`：AI agent 可直接修正。
- `agent-structure-review`：結構、UIUX 或命名需要再審。
- `agent-source-audit-needed`：需要官方來源或下載對應稽核。
- `agent-source-needed`：來源不足，不得補寫假資料，需人工或官方資料補齊。
- `agent-approved-clean`：本機 preview 與 QA 已通過。

`agent-source-needed` 頁面的詳細處置見 `site/reports/source-needed-audit.html`。測試頁、軟體頁、教育訓練或說明型頁面，不應強制生成硬體規格表；除非後續取得官方來源與合適 schema。

## 產品規格詳情規則

- `產品規格詳情` 必須位於 `產品系列` 下方。
- 使用真正的 `<table>`，表頭保留原廠欄位與單位。
- accordion 使用 `<button>`、`aria-expanded`、`aria-controls`，並有明確「展開 / 收合」文字。
- PDF / CAD / Manual / Catalog / Drawing / Software 要分類清楚。
- 無下載時顯示「請洽星泰」或相同語意狀態。
- 不得出現 `href="#"`、`.txt` href、本機磁碟路徑、前台可見內部工作註解、`pending`、`placeholder`、`data-local-file`。
- 規格不足時不得猜測；使用 `—`、`原廠未公開`、`請洽星泰`，或標記 `source-needed`。

## SEO / UIUX 規則

- 保留 canonical、title、meta description、breadcrumb 與既有導覽邏輯。
- 每頁維持單一 H1。
- 主內容模組使用合理 H2/H3。
- 重要內容使用可爬取 HTML，不放在純圖片或不可讀 JS。
- CTA 至少在規格模組與頁尾區域可見，並沿用既有詢問流程。
- 不新增假價格、假庫存、假評分、假評論。
- 只有前台可見 FAQ 內容時，才可加入 FAQ schema。

## 大檔與下載策略

- `large-file-risk` 是已知伺服器問題，不阻塞本機優化。
- 若檔案無法穩定上傳或過大，優先使用原廠官方下載頁或官方文件 URL，並在報告中標示 `external-source`。
- Git LFS 保留大型 PDF / 圖片；PR 不直接塞未壓縮新圖。

## 完成判準

每個類別 PR 的最低判準：

- `npm run validate` 通過。
- 目標頁為 `agent-approved-clean`，或 `source-needed` 已有明確理由。
- `產品規格詳情` 位於 `產品系列` 下方。
- 表格、accordion、下載連結、CTA、SEO checks 符合規則。
- 無前台可見開發註解、placeholder 或本機路徑。

## 目前限制

- GitHub CLI 未安裝；PR / issue 可透過 `tools/github-bootstrap.mjs` 的 GitHub API flow 建立。
- 若沒有 `GITHUB_TOKEN` / `GH_TOKEN`，只能做 dry-run 與產出手動建立內容。
- 本階段只處理本機 preview 與 GitHub 工作流，不登入後台、不上傳、不儲存、不覆蓋正式伺服器。
