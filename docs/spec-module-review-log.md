# 產品規格詳情模組審核紀錄

更新日期：2026-07-06

本文件是 GitHub-ready 本機 preview 的產品規格詳情模組審核入口。機器可讀來源以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json`、`site/reports/source-needed-audit.json` 與 `site/reports/optimization-backlog.json` 為準。

## 目前總覽

- 產品頁總數：248
- `agent-approved-clean`：242
- `agent-source-needed`：6
- `agent-fix-required`：0
- `agent-structure-review`：0
- `agent-source-audit-needed`：0
- blocking pages：6，全部是來源不足或非硬體規格頁，不是結構錯誤。
- 目前基準分支：`phase-1-smac-spec-standard`

## Agent Review 狀態定義

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | 本機 preview 與 QA 已通過；無 critical / warning；無本機路徑、`.txt`、`href="#"`、前台可見內部註解。 | 可進入對應類別 PR 與後續部署準備。 |
| `agent-fix-required` | AI agent 可直接修正的結構或內容問題。 | 在對應 phase 分支修正後重跑 `npm run validate`。 |
| `agent-structure-review` | 結構、模組順序、UIUX 或命名仍需審核。 | 由 AI agent 先修正；若規則不明確再交人工。 |
| `agent-source-audit-needed` | 下載或規格來源需要再查核。 | 只做來源稽核；不得猜測規格。 |
| `agent-source-needed` | 官方來源不足或頁型不適合硬體規格表。 | 不補寫規格；保留在 source-needed audit，待來源補齊或排除。 |

## 目前類別狀態

| Priority | Category | Branch | Pages | Source-needed | Status |
| --- | --- | --- | ---: | ---: | --- |
| 1 | 電動缸 | `phase-1-smac-spec-standard` | 14 | 0 | approved |
| 2 | 驅動器 | `phase-2-drivers-spec-review` | 12 | 0 | approved |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | 24 | 0 | approved |
| 4 | ACS 控制器 / 驅動器 | `phase-2-drivers-spec-review` | 18 | 6 | source-needed |
| 5 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | 31 | 0 | approved |
| 6 | Renishaw 回授元件產品 | `phase-3-renishaw-feedback` | 36 | 0 | approved |
| 7 | 定位平台 | `phase-3-positioning-stage` | 11 | 0 | approved |
| 8 | 空氣軸承 / 滾珠•滾柱軸承 | `phase-3-bearings-air-mechanical` | 9 | 0 | approved |
| 9 | 聯軸器 | `phase-4-couplings` | 18 | 0 | approved |
| 10 | FMS 張力系統 | `phase-4-fms-tension` | 24 | 0 | approved |
| 11 | 固態繼電器 | `phase-4-solid-state-relays` | 10 | 0 | approved |
| 12 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | 6 | 0 | approved |
| 13 | 特殊環境 | `phase-4-special-environments` | 11 | 0 | approved |
| 14 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | 1 | 0 | approved |
| 15 | SEJINIGB 滾輪齒排 | `phase-5-sejinigb` | 2 | 0 | approved |
| 16 | 鼓風機 | `phase-5-blowers` | 2 | 0 | approved |
| 17 | 自動化系統 | `phase-5-automation-systems` | 5 | 0 | approved |
| 18 | 其他回授元件 | `phase-5-other-feedback` | 8 | 0 | approved |

## Source-needed 頁面

目前 6 頁全部位於 ACS 控制器 / 驅動器類別：

- 241：測試頁，建議排除硬體規格表。
- 253：軟體頁，需官方軟體來源與下載映射。
- 254：軟體頁，需官方軟體來源與下載映射。
- 255：軟體頁，需官方軟體來源與下載映射。
- 268：說明型頁，需判定是否需要規格模組。
- 269：教育訓練影片頁，建議不強制建立硬體規格表。

詳細處置見：`site/reports/source-needed-audit.html`。

## 已建立的自動修正與驗證

- `tools/apply-common-spec-module-fixes.mjs`
- `tools/validate-product-spec-modules.mjs`
- `tools/generate-product-spec-agent-review.mjs`
- `tools/generate-source-needed-audit.mjs`
- `tools/generate-optimization-backlog.mjs`
- `tools/generate-github-issue-index.mjs`
- `tools/github-bootstrap.mjs`

常用指令：

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
```

## 最新驗證結果

`npm run validate`：

- static site validation：`errors=0`
- local mirror readiness：`errors=0`、`warnings=0`
- product spec QA：`pass=242`、`no-spec-module=6`、`fail=0`、`warn=0`
- AI agent review：`agent-approved-clean=242`、`agent-source-needed=6`
- source-needed audit：6 頁已分類為測試頁、軟體頁、說明型頁或教育訓練頁
- optimization backlog：`total_pages=248`、`total_blocking_pages=6`

## GitHub 工作流要求

- 每個類別或品牌使用一個 phase branch 與一個 PR。
- 每個 PR 必須附上：
  - 修改頁數
  - QA 報告路徑
  - AI review 狀態
  - source-needed 或後台限制例外
- 每個 PR 必須通過：
  - `npm run validate`
  - GitHub Actions `preview-qa.yml`

## 建議下一步

1. 使用 `npm run github:bootstrap:dry-run` 確認 labels / issues / PRs。
2. 若要實際建立 GitHub labels、issues、PRs，提供目前 PowerShell session 的 `GITHUB_TOKEN` 後執行 `npm run github:bootstrap`。
3. 從 `phase-1-smac-spec-standard` 的 SMAC 樣板 PR 開始合併。
4. 依序處理第一優先類別：電動缸、驅動器、各類馬達、ACS、Harmonic Drive、Renishaw、定位平台、軸承。
5. `agent-source-needed` 六頁不補假規格；等官方來源或人工決策後再處理。
