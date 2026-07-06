# GitHub 驅動的產品頁優化流程

更新日期：2026-07-06

本文件定義星泰網站本機 preview 與 GitHub PR 工作流。目標是讓 AI agent 可以在本機完成產品頁 UIUX、SEO、產品規格詳情、下載連結與 QA 收斂，再透過分支與 PR 進行可追蹤審查。

## 工作原則

- `main` 永遠維持可驗證狀態。
- 每個品牌或產品類別使用一個 phase branch 與一個 PR。
- 每個 PR 必須附上修改範圍、QA 報告、AI review 狀態與剩餘待確認項。
- AI agent 可自行處理 `agent-fix-required` 與一般結構問題。
- 只有官方來源不足、來源衝突、後台限制或商業判斷才升級人工確認。
- 本階段只處理本機 preview 與 GitHub 工作流，不登入後台、不儲存、不上傳、不覆蓋正式伺服器。

## Phase 分支

| Phase | Branch | 範圍 |
| --- | --- | --- |
| 1 | `phase-1-smac-spec-standard` | SMAC / 電動缸標準樣板 |
| 2 | `phase-2-drivers-spec-review` | 驅動器、ACS 控制器 / 驅動器 |
| 2 | `phase-2-motors-spec-review` | 各類馬達 |
| 3 | `phase-3-harmonic-drive` | Harmonic Drive 減速機 |
| 3 | `phase-3-renishaw-feedback` | Renishaw 回授元件 |
| 3 | `phase-3-positioning-stage` | 定位平台 |
| 3 | `phase-3-bearings-air-mechanical` | 空氣軸承、滾珠 / 滾柱軸承 |
| 4 | `phase-4-couplings` | 聯軸器 |
| 4 | `phase-4-fms-tension` | FMS 張力系統 |
| 4 | `phase-4-solid-state-relays` | 固態繼電器 |
| 4 | `phase-4-sanyo-denki` | 山洋電氣 SANYO DENKI |
| 4 | `phase-4-special-environments` | 特殊環境 |
| 5 | `phase-5-ceramic-chucks` | 陶瓷吸盤 |
| 5 | `phase-5-sejinigb` | SEJINIGB |
| 5 | `phase-5-blowers` | 鼓風機 |
| 5 | `phase-5-automation-systems` | 自動化系統 |
| 5 | `phase-5-other-feedback` | 其他回授元件 |

## Labels

`.github/labels.yml` 是 label source of truth：

- `spec-module`：產品規格詳情、accordion、table、CTA。
- `seo`：title、meta、canonical、breadcrumb、heading、schema。
- `uiux`：版型、響應式、可讀性、accessibility、視覺階層。
- `download-links`：PDF、CAD、Manual、Catalog、Drawing、Software、external-source。
- `source-needed`：官方來源或資料對應仍需確認。
- `backend-ready`：本機 preview 可準備進入後台或伺服器部署階段。
- `blocked-server-large-file`：已知大檔或伺服器上傳限制，不阻塞本機優化。

## 分層驗證節奏

後續 UIUX 或產品頁批次調整採用分層驗證，避免每次小改都重跑 GitHub API 與部署交接報告。

| 時機 | 指令 | 用途 |
| --- | --- | --- |
| 單頁或小範圍 UIUX 修改後 | `npm run qa:site`、`npm run qa:product-seo`、`npm run qa:spec` | 快速確認修改沒有破壞基本 HTML、SEO 與規格模組。 |
| 一個品牌 / 產品系列批次完成後 | `npm run validate:local-optimization` | 驗證本機 preview、產品規格詳情、下載按鈕、SEO 結構、內部註解清理與 backlog 狀態。 |
| 準備提交 PR / 交接 GPT 審查前 | `npm run validate:external-handoff` | 重新產生 GitHub issue / PR index、GitHub bootstrap handoff、部署分類與完成度稽核。 |
| 合併前或重大批次收斂時 | `npm run validate:strict` | 跑完整嚴格鏈，作為 PR / CI / AI review 的最終證據。 |

原則：

- 內容與 UIUX 開發時，優先跑 `validate:local-optimization`，不要反覆跑完整部署鏈。
- 只有在要交付、開 PR、重新產生 GitHub / 部署報告時，才跑 `validate:external-handoff` 或 `validate:strict`。
- `validate:strict` 仍是合併前標準，但不是每個小改的預設指令。
- 提交前仍需執行 `git diff --check`。

常用分項檢查：

```powershell
npm run qa:site
npm run qa:docs
npm run qa:mirror
npm run qa:spec
npm run qa:product-seo
npm run qa:product-seo-taxonomy
npm run qa:agent
npm run qa:source-needed
npm run qa:visual-sample
```

GitHub 工作流報告：

```powershell
npm run workflow:backlog
npm run workflow:issue-index
npm run workflow:pr-index
npm run workflow:github-readiness
npm run workflow:github-remote-verify
npm run workflow:github-api-handoff
npm run workflow:deployment-package-integrity
npm run workflow:deployment-readiness
npm run workflow:completion-audit
```

## 自動修正指令

常見規格模組問題：

```powershell
npm run fix:spec-common:dry-run
npm run fix:spec-common
```

產品內容中誤放 `<title>`：

```powershell
npm run fix:body-title-tags:dry-run
npm run fix:body-title-tags
```

多 H1 階層問題：

```powershell
npm run fix:h1-hierarchy:dry-run
npm run fix:h1-hierarchy
```

## GitHub Bootstrap

無 token 時只做 dry-run 與遠端狀態檢查：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
npm run workflow:github-remote-verify
```

有 fine-grained GitHub token 時，預設只用安全 runner。它會依序執行 dry-run、smoke issue、smoke PR、完整 bootstrap、報告刷新與 strict validation：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:safe
Remove-Item Env:\GITHUB_TOKEN
```

分段指令只保留給 API 權限或單一 smoke 問題排查，不作為日常流程：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

token 只能放在 PowerShell session，不得寫入檔案、commit 或聊天紀錄。

## Agent Review 狀態流轉

`site/reports/product-spec-agent-review.json` 是主要任務分派來源。

```text
agent-fix-required
  -> agent-structure-review / agent-source-audit-needed
  -> agent-approved-clean

agent-source-needed
  -> 補官方來源後再回到 fix-required 或 approved-clean
```

目前基準：

- 產品頁：248
- `agent-approved-clean`: 242
- `agent-approved-exception`: 6
- `agent-source-needed`: 0
- `agent-fix-required`: 0
- `agent-structure-review`: 0

## 產品規格詳情規則

- `產品規格詳情` 必須位於 `產品系列` 下方。
- 規格表使用真正 `<table>`。
- 表頭保留原廠欄位與單位。
- Accordion 使用 `<button>` 搭配 `aria-expanded` / `aria-controls`，或語意清楚的 `<details>/<summary>`。
- PDF / CAD / Manual / Catalog / Drawing / Software 必須分類清楚。
- 無下載時顯示 `請洽星泰`，不得留下空連結。
- 不得出現 `href="#"`、`.txt`、`file:///`、本機磁碟路徑、`pending`、`placeholder`、`data-local-file` 或內部工作註解。
- 規格不足時不補假資料，使用 `—`、`原廠未公開`、`請洽星泰` 或標記 `source-needed`。

## SEO / UIUX 規則

- 保留 canonical、title、meta description、breadcrumb 與既有內部連結。
- 每頁維持單一 H1。
- 主內容模組使用合理 H2/H3。
- 重要內容使用可爬取 HTML，不放在純圖片或不可讀 JS 中。
- CTA 使用真實 `<a>` 或現有詢問入口。
- 不新增假價格、假庫存、假評分或假評論。
- 只有頁面上存在可見 FAQ 時才加入 FAQ schema。

## 大檔與下載策略

- `large-file-risk` 是已知伺服器問題，不阻塞本機優化。
- 檔案無法穩定上傳或太大時，優先連至原廠官方下載頁或官方文件 URL，並標記 `external-source`。
- Git LFS 用於大型 PDF、ZIP、CAD、圖片；PR 不直接塞未壓縮新圖。

## PR 驗收門檻

每個 PR 至少需要：

- `npm run validate:strict` pass。
- `npm run qa:visual-sample` pass for the current PR sample set when local visual review is needed.
- GitHub Actions `Preview QA` pass。
- 目標頁轉為 `agent-approved-clean`，或明確列為 `source-needed`。
- `產品規格詳情` 位置正確。
- 無本機路徑、`.txt`、`href="#"`、placeholder 或內部註解外露。
- `product-page-structure-seo-qa.html` 無 critical fail。
- SEO 基礎未倒退。
