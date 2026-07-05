# GitHub 驅動的產品頁優化工作流

更新日期：2026-07-06

本 repo 用來把星泰網站的本機 preview、產品規格詳情、UIUX、SEO、下載連結與 QA 流程放進可追蹤的 GitHub 工作流。正式後台與正式站部署不屬於本階段。

## 分支與 PR 節奏

- `main`：永遠保持可驗證狀態。
- `phase-1-smac-spec-standard`：SMAC / 電動缸標準樣板。
- `phase-2-drivers-spec-review`：驅動器與 ACS 控制器 / 驅動器。
- `phase-2-motors-spec-review`：各類馬達。
- `phase-3-harmonic-drive`：Harmonic Drive 減速機。
- `phase-3-renishaw-feedback`：Renishaw 回授元件。
- `phase-3-positioning-stage`：定位平台。
- `phase-3-bearings-air-mechanical`：空氣軸承 / 滾珠與滾柱軸承。
- `phase-4-couplings`：聯軸器。
- `phase-4-fms-tension`：FMS 張力系統。
- `phase-4-solid-state-relays`：固態繼電器。
- `phase-4-sanyo-denki`：山洋電氣 SANYO DENKI。
- `phase-4-special-environments`：特殊環境。
- `phase-5-ceramic-chucks`：陶瓷吸盤。
- `phase-5-sejinigb`：SEJINIGB。
- `phase-5-blowers`：鼓風機。
- `phase-5-automation-systems`：自動化系統。
- `phase-5-other-feedback`：其他回授元件。

每個 PR 必須附上：

- 修改頁數。
- QA 報告連結。
- AI review 狀態前後差異。
- `source-needed` 或人工例外項目。
- `npm run validate` 結果。

## Labels

`.github/labels.yml` 是 label source of truth：

- `spec-module`：產品規格詳情、accordion、table、CTA。
- `seo`：title、meta、canonical、breadcrumb、schema、heading。
- `uiux`：版面、響應式、可讀性、互動與可及性。
- `download-links`：PDF、CAD、Manual、Catalog、Drawing、Software。
- `source-needed`：官方來源或資料對應待確認。
- `backend-ready`：本機 preview 已接受，可進入後台或伺服器部署準備。
- `blocked-server-large-file`：已知大檔或伺服器上傳限制，不阻塞本機優化。

## 常用驗證指令

```powershell
npm run validate
```

單項 QA：

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

工作流報告：

```powershell
npm run workflow:backlog
npm run workflow:issue-index
npm run workflow:pr-index
npm run workflow:github-readiness
```

## 自動修正常用指令

若 `qa:product-seo` 回報多個 H1：

```powershell
npm run fix:h1-hierarchy:dry-run
npm run fix:h1-hierarchy
```

若 `qa:product-seo` 回報 body 內有 `<title>`：

```powershell
npm run fix:body-title-tags:dry-run
npm run fix:body-title-tags
```

若 `qa:spec` 回報共通安全問題：

```powershell
npm run fix:spec-common:dry-run
npm run fix:spec-common
```

## GitHub Bootstrap

沒有 token 時只跑 dry-run：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

有 fine-grained GitHub token 後，先 smoke：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

smoke 通過後再完整建立 labels、tracking issues 與 PR：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

Token 只放在目前 PowerShell session，不寫入檔案。

## Agent Review 狀態流轉

主要資料來源：`site/reports/product-spec-agent-review.json`。

```text
agent-fix-required
  -> agent-structure-review / agent-source-audit-needed
  -> agent-approved-clean

agent-source-needed
  -> 補官方來源後再回到 fix-required 或 approved-clean
```

AI agent 可自行處理 `agent-fix-required`。只有官方來源衝突、資料缺失、後台限制或業務決策才升級人工。

## 產品規格詳情規則

- `產品規格詳情` 必須位於 `產品系列` 下方。
- 使用真正 `<table>`，表頭保留原廠欄位與單位。
- Accordion 使用 `<button>` 搭配 `aria-expanded` / `aria-controls`，或使用原生 `<details>/<summary>`。
- PDF / CAD / Manual / Catalog / Drawing / Software 必須分類清楚。
- 無下載時顯示 `請洽星泰`，不要使用空連結。
- 不得出現 `href="#"`、`.txt` href、`file:///`、本機磁碟路徑、`pending`、`placeholder`、`data-local-file` 或內部註解。

## SEO / UIUX 規則

- 保留 canonical、title、meta description、breadcrumb 與既有導覽。
- 每頁只保留一個 H1。
- 主內容使用合理 H2/H3。
- 重要內容使用可爬取 HTML。
- CTA 必須可見且可點擊。
- 不新增假價格、庫存、評分或評論。
- 有可見 FAQ 才能加 FAQ schema。

## 大檔與下載策略

- `large-file-risk` 是已知伺服器問題，不阻塞本機優化。
- 若檔案無法穩定上傳或下載過大，優先連至原廠官方下載頁或官方文件 URL，並在報告中標示 `external-source`。
- Git LFS 用於必要的大型文件與圖片；PR 不直接塞未壓縮新圖。

## PR 驗收條件

每個 PR 合併前需確認：

- `npm run validate` pass。
- GitHub Actions `Preview QA` pass。
- 目標頁轉為 `agent-approved-clean`，或來源缺口明確標記為 `source-needed`。
- `產品規格詳情` 位置與命名正確。
- 無本機路徑、`.txt`、`href="#"`、placeholder 或內部工作註解。
- `product-page-structure-seo-qa.html` 無 critical fail；warning 必須在 PR 內說明處理策略。
- SEO 基礎結構未倒退。

## 目前限制

- 若 shell 沒有 `GITHUB_TOKEN` / `GH_TOKEN`，只能產生 GitHub dry-run 與 Markdown 草稿，不能自動建立 issue / PR。
- 本階段只處理本機 preview 與 GitHub 工作流；正式後台儲存、測試網上架、正式站覆蓋另開部署階段。
