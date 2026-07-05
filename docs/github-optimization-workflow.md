# GitHub 驅動的星泰產品頁優化工作流

最後更新：2026-07-06

本 repo 用來在本機 preview 中完成星泰產品頁 UIUX、SEO、產品規格詳情、下載連結與 QA 優化，再透過 GitHub branch / PR 工作流逐類別收斂。

## 分支與 PR 節奏

- `main`：永遠保持可驗證狀態。
- `phase-1-smac-spec-standard`：SMAC / 電動缸樣板。
- `phase-2-drivers-spec-review`：驅動器、ACS 控制器 / 驅動器。
- `phase-2-motors-spec-review`：各類馬達。
- `phase-3-harmonic-drive`：Harmonic Drive 減速機。
- `phase-3-renishaw-feedback`：Renishaw 回授元件。
- `phase-3-positioning-stage`：定位平台。
- `phase-3-bearings-air-mechanical`：軸承 / 空氣軸承。
- `phase-4-couplings`：聯軸器。
- `phase-4-fms-tension`：FMS 張力系統。
- `phase-4-solid-state-relays`：固態繼電器。
- `phase-4-sanyo-denki`：山洋電氣 SANYO DENKI。
- `phase-4-special-environments`：特殊環境 / 其他類別。
- `phase-5-ceramic-chucks`：陶瓷吸盤。
- `phase-5-sejinigb`：SEJINIGB。
- `phase-5-blowers`：鼓風機。
- `phase-5-automation-systems`：自動化系統。
- `phase-5-other-feedback`：其他回授元件。

每個 PR 必須附：

- 修改頁數。
- QA 報告連結。
- AI review 狀態。
- `source-needed` 或後台限制。
- `npm run validate` 結果。

## Labels

labels 定義在 `.github/labels.yml`：

- `spec-module`：產品規格詳情、accordion、table、CTA。
- `seo`：title、meta、canonical、breadcrumb、schema、heading。
- `uiux`：排版、可讀性、手機版、表格橫向捲動。
- `download-links`：PDF、CAD、Manual、Catalog、Drawing、Software。
- `source-needed`：官方來源不足或資料需查核。
- `backend-ready`：本機 preview 已可準備轉後台。
- `blocked-server-large-file`：大檔伺服器限制，已知問題，不阻塞本機優化。

## 本機驗證

完整驗證：

```powershell
npm run validate
```

拆分驗證：

```powershell
npm run qa:site
npm run qa:docs
npm run qa:mirror
npm run qa:spec
npm run qa:product-seo
npm run qa:product-seo-taxonomy
npm run qa:agent
npm run qa:source-needed
```

`qa:product-seo-taxonomy` 會將剩餘 warning 依修復類型、分類與 phase branch 分組，後續優先用同一類型的批次修正，而不是逐頁猜問題。

若 `qa:product-seo` 回報多個 H1，先使用：

```powershell
npm run fix:h1-hierarchy:dry-run
npm run fix:h1-hierarchy
```

若 `qa:product-seo` 回報 body 內殘留 `<title>`，先使用：

```powershell
npm run fix:body-title-tags:dry-run
npm run fix:body-title-tags
```

這個修正只保留產品頁第一個 H1，後續 H1 降級為 H2，避免破壞 SEO heading hierarchy。

產生 backlog 與 issue index：

```powershell
npm run workflow:backlog
npm run workflow:issue-index
npm run workflow:pr-index
npm run workflow:github-readiness
```

閱讀：

```text
site/reports/github-bootstrap-readiness.html
site/reports/optimization-backlog.html
site/reports/product-spec-agent-review.html
```

## GitHub Bootstrap

不需要 token 的 dry-run：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

有 GitHub fine-grained token 後先跑 smoke：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

smoke 通過後全量建立 labels、tracking issues、pull requests：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

Token 只放在目前 PowerShell session，不寫入檔案。

若不使用 API，可產出手動建立 PR / issue 的 Markdown：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-pr.ps1 -Branch phase-1-smac-spec-standard
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-issue.ps1 -Branch phase-1-smac-spec-standard
```

## Agent Review 狀態流轉

主要資料來源：`site/reports/product-spec-agent-review.json`。

狀態流轉：

```text
agent-fix-required
  -> agent-structure-review / agent-source-audit-needed
  -> agent-approved-clean

agent-source-needed
  -> 保留缺口，不補假資料
```

目前基準：

- 產品頁：248
- `agent-approved-clean`：242
- `agent-source-needed`：6
- `agent-fix-required`：0

## 產品規格詳情規則

- `產品規格詳情` 必須位於 `產品系列` 下方。
- 使用真正 `<table>`，表頭保留原廠欄位與單位。
- Accordion 使用 `<button>`、`aria-expanded`、`aria-controls`。
- PDF / CAD / Manual / Catalog / Drawing / Software 分類清楚。
- 無下載顯示 `請洽星泰`。
- 不得出現 `href="#"`、`.txt` href、本機路徑、`pending`、`placeholder`、`data-local-file`、內部註解。
- 規格不足時使用 `—`、`原廠未公開`、`請洽星泰` 或 `source-needed`。

## SEO / UIUX 規則

- 保留 canonical、title、meta description、breadcrumb 與既有導覽邏輯。
- 每頁單一 H1。
- 主內容模組用 H2/H3 建立層級。
- 重要內容使用可爬取 HTML。
- CTA 必須可見且可點擊。
- 不新增假價格、假庫存、假評分、假評論。
- 有可見 FAQ 才能加 FAQ schema。

## 大檔與下載策略

- `large-file-risk` 是已知伺服器問題，不阻塞本機優化。
- 若檔案無法穩定上傳或過大，優先連至原廠官方下載頁或官方文件 URL，並在報告標示 `external-source`。
- Git LFS 保留大型 PDF / 圖片；PR 不直接塞未壓縮新圖。

## PR 完成條件

每個類別 PR 合併前需確認：

- `npm run validate` pass。
- GitHub Actions `preview-qa.yml` pass。
- 目標頁為 `agent-approved-clean`，或 source gaps 已列為 `source-needed`。
- `產品規格詳情` 位置正確。
- 無本機路徑、`.txt`、`href="#"`、placeholder、內部註解。
- `product-page-structure-seo-qa.html` 沒有 critical fail；warning 需在 PR 中說明處理或保留原因。
- SEO 基本結構未倒退。

## 目前限制

- GitHub CLI 未安裝。
- 若沒有 `GITHUB_TOKEN` / `GH_TOKEN`，只能 dry-run 與產出手動建立內容，不能實際建立 GitHub issues / PRs。
- 本階段只處理本機 preview 與 GitHub 工作流，不登入後台、不上傳、不儲存、不覆蓋正式伺服器。
