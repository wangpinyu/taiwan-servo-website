# 產品規格詳情審核紀錄

更新日期：2026-07-06

本文件是 GitHub-ready preview 的階段性審核紀錄。詳細機器可讀資料以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json`、`site/reports/product-page-structure-seo-qa.json`、`site/reports/product-seo-warning-taxonomy.json` 與 `site/reports/source-needed-audit.json` 為準。

## 目前總覽

- 產品頁：248
- `agent-approved-clean`：228
- `agent-source-needed`：20
- `agent-fix-required`：0
- `agent-structure-review`：0
- critical fail：0

## Agent Review 狀態

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | 本機 preview 已通過 AI agent 結構、規格、SEO 與下載連結檢查。 | 可納入 PR 審查，等待部署階段。 |
| `agent-fix-required` | AI 可以修正的結構、CTA、表格或連結問題。 | 由 phase branch 持續修正並重跑 `npm run validate`。 |
| `agent-structure-review` | 模組位置或標題歸類需要再次確認。 | AI 先整理，無法判定才升級人工。 |
| `agent-source-audit-needed` | 來源可疑或資料對應需要來源審核。 | 檢查官方來源後再決定。 |
| `agent-source-needed` | 缺官方來源或規格資料，不應自行補寫。 | 由來源補齊工作處理，或保留為例外。 |

## Phase 優先順序

| Priority | Category | Branch | Focus |
| --- | --- | --- | --- |
| 1 | SMAC / 電動缸 | `phase-1-smac-spec-standard` | 標準樣板與可複用規格模組 |
| 2 | 驅動器 / ACS | `phase-2-drivers-spec-review` | 驅動器、控制器、文件分類 |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | 馬達規格表與下載連結 |
| 4 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | 系列、減速比、扭矩、CAD |
| 5 | Renishaw 回授元件 | `phase-3-renishaw-feedback` | 解析度、介面、安裝文件 |
| 6 | 定位平台 | `phase-3-positioning-stage` | 行程、負載、精度 |
| 7 | 空氣軸承 / 滾珠・滾柱軸承 | `phase-3-bearings-air-mechanical` | 軸承規格與 CAD |
| 8 | 聯軸器 | `phase-4-couplings` | 型號、扭矩、下載文件 |
| 9 | FMS 張力系統 | `phase-4-fms-tension` | FMS 產品系列與文件 |
| 10 | 固態繼電器 | `phase-4-solid-state-relays` | i-Autoc 文件與系列對應 |
| 11 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | San Ace / SANMOTION / SANUPS |
| 12 | 特殊環境 | `phase-4-special-environments` | 特殊應用與來源確認 |
| 13 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | 來源補齊與規格表 |
| 14 | SEJINIGB | `phase-5-sejinigb` | 來源補齊與規格表 |
| 15 | 鼓風機 | `phase-5-blowers` | 來源補齊與規格表 |
| 16 | 自動化系統 | `phase-5-automation-systems` | 系統型內容架構 |
| 17 | 其他回授元件 | `phase-5-other-feedback` | 其他回授產品 |

## Source-needed 摘要

目前 20 頁仍需來源或內容判斷：

- `official-source-needed`：14
- `software-source-needed`：3
- `informational-source-needed`：1
- `training-content-no-spec`：1
- `exclude-test-page`：1

詳細清單請看：

- `site/reports/source-needed-audit.html`
- `site/reports/source-needed-audit.json`

## 目前 QA 狀態

`product-spec-module-qa`：

- total：248
- pass：242
- no-spec-module：6
- fail：0
- warn：0

`product-page-structure-seo-qa`：

- total：248
- pass：228
- warn：14
- no-spec-module：6
- fail：0

14 個 warning 目前集中在 `spec-table-missing`，多屬於沒有足夠規格來源或不適合建立型號表的頁面，需與 source-needed audit 一起看。

## 已建立工具

- `tools/apply-common-spec-module-fixes.mjs`
- `tools/resolve-product-standardization-review.mjs`
- `tools/validate-product-spec-modules.mjs`
- `tools/validate-product-page-structure-seo.mjs`
- `tools/generate-product-seo-warning-taxonomy.mjs`
- `tools/generate-product-spec-agent-review.mjs`
- `tools/generate-source-needed-audit.mjs`
- `tools/generate-optimization-backlog.mjs`
- `tools/generate-github-issue-index.mjs`
- `tools/generate-github-pr-index.mjs`
- `tools/generate-github-bootstrap-readiness.mjs`
- `tools/github-bootstrap.mjs`

## 驗證指令

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

## GitHub 狀態

- phase branches 已推送到 origin。
- issue drafts 與 PR drafts 已產出。
- `github-bootstrap-readiness` 目前會依 shell 是否有 `GITHUB_TOKEN` / `GH_TOKEN` 判定是否可 apply。
- 若沒有 token，只能產出 dry-run 與 Markdown drafts，不能實際建立 GitHub labels / issues / PRs。

## Source-needed action index

- Action index: `docs/source-needed-action-index.md`
- Machine-readable index: `docs/source-needed-action-index.json`
- Current unresolved scope: 20 pages.
- AI source audit queue: 14 pages requiring official manufacturer evidence before any product specification table can be created or revised.
- Non-standard exceptions: 6 ACS test/software/informational/training pages that should not be forced into the hardware `產品規格詳情` schema without a separate content decision.
- The index is intentionally local-preview/GitHub workflow only; it does not authorize backend save, CKFinder upload, or test-site publication.
