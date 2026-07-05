# 產品規格詳情審核紀錄

更新日期：2026-07-06

本文件是 GitHub-ready preview 的階段性審核紀錄。機器可讀來源以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json`、`site/reports/product-page-structure-seo-qa.json`、`site/reports/product-seo-warning-taxonomy.json` 與 `site/reports/source-needed-audit.json` 為準。

## 目前摘要

- 產品頁總數：248
- `agent-approved-clean`：87
- `agent-fix-required`：142
- `agent-structure-review`：13
- `agent-source-needed`：6
- critical fail：0
- 目前主工作分支：`phase-1-smac-spec-standard`

## Agent Review 狀態說明

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | 本機 preview 已通過目前 AI agent 結構、規格、安全與 SEO 基礎檢查。 | 可進入 PR 審核或後續部署準備。 |
| `agent-fix-required` | 存在 AI 可處理的警告，例如表格欄位、單位、CTA 或下載標籤問題。 | 由對應 phase 分支修正，跑 `npm run validate`。 |
| `agent-structure-review` | 模組歸類或頁面結構需要進一步判定。 | 由 AI 先整理判斷依據；必要時升級人工。 |
| `agent-source-needed` | 找不到足夠官方來源或既有規格模組，不可補寫推測規格。 | 補來源或保留缺口報告。 |

## 類別與分支追蹤

| Priority | Category | Branch | Current focus |
| --- | --- | --- | --- |
| 1 | 電動缸 / SMAC | `phase-1-smac-spec-standard` | 標準樣板與表格欄位收斂 |
| 2 | 驅動器 / ACS | `phase-2-drivers-spec-review` | 驅動器、控制器規格表與下載分類 |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | 馬達規格欄位與型號表 |
| 4 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | 系列比較、扭矩、減速比、CAD |
| 5 | Renishaw 回授元件 | `phase-3-renishaw-feedback` | 回授元件資料完整度與文件分類 |
| 6 | 定位平台 | `phase-3-positioning-stage` | 行程、負載、精度、控制器 |
| 7 | 空氣軸承 / 滾珠與滾柱軸承 | `phase-3-bearings-air-mechanical` | 軸承規格與 CAD |
| 8 | 聯軸器 | `phase-4-couplings` | 聯軸器系列與下載文件 |
| 9 | FMS 張力系統 | `phase-4-fms-tension` | FMS 產品系列與文件分類 |
| 10 | 固態繼電器 | `phase-4-solid-state-relays` | i-Autoc 文件與外部下載策略 |
| 11 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | San Ace / SANMOTION / SANUPS |
| 12 | 特殊環境 | `phase-4-special-environments` | 特殊應用與資料來源確認 |
| 13 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | 少量頁面收斂 |
| 14 | SEJINIGB | `phase-5-sejinigb` | 少量頁面收斂 |
| 15 | 鼓風機 | `phase-5-blowers` | 少量頁面收斂 |
| 16 | 自動化系統 | `phase-5-automation-systems` | 系統型頁面資料架構 |
| 17 | 其他回授元件 | `phase-5-other-feedback` | 其他回授產品頁 |

## Source-needed 頁面

目前 6 頁列為來源或內容型缺口，不能自動補寫規格：

- 241：測試或非標準產品型頁面。
- 253：軟體型頁面，缺官方規格模組來源。
- 254：軟體型頁面，缺官方規格模組來源。
- 255：軟體型頁面，缺官方規格模組來源。
- 268：教育訓練或資訊型頁面，沒有明確規格表。
- 269：教育訓練或資訊型頁面，沒有明確規格表。

詳見 `site/reports/source-needed-audit.html`。

## 目前主要警告類型

來源：`site/reports/product-seo-warning-taxonomy.json`。

- `table-unit-header`：表頭缺少或未偵測到單位。
- `table-model-header`：表格缺少可辨識的系列、型號或 Part Number 欄。
- `spec-table-missing`：規格模組沒有真正表格，需判斷是否為文件型模組或 source-needed。

## 已建立的工具

- `tools/apply-common-spec-module-fixes.mjs`
- `tools/validate-product-spec-modules.mjs`
- `tools/validate-product-page-structure-seo.mjs`
- `tools/generate-product-seo-warning-taxonomy.mjs`
- `tools/generate-product-spec-agent-review.mjs`
- `tools/generate-source-needed-audit.mjs`
- `tools/generate-optimization-backlog.mjs`
- `tools/generate-github-issue-index.mjs`
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

- phase branches 已建立並推送。
- issue drafts 與 PR drafts 由本機工具產生。
- `github-bootstrap-readiness` 狀態仍依目前 shell 是否有 `GITHUB_TOKEN` / `GH_TOKEN` 決定。
- 沒有 token 時，不會自動建立 GitHub labels/issues/PRs。
