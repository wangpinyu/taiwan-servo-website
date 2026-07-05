# 產品規格詳情模組審核紀錄

最後更新：2026-07-06

本文件是 GitHub-ready preview 內產品規格詳情模組的階段性審核紀錄。機器可讀狀態以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json`、`site/reports/source-needed-audit.json` 與 `site/reports/optimization-backlog.json` 為準。

## 全站摘要

- 產品頁總數：248
- `agent-approved-clean`：242
- `agent-source-needed`：6
- `agent-fix-required`：0
- `agent-structure-review`：0
- `agent-source-audit-needed`：0
- 目前主工作分支：`phase-1-smac-spec-standard`

## Agent Review 狀態定義

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | 本機 preview 與 QA 通過，無 critical/warning，無本機路徑、`.txt`、`href="#"`、內部註解等前台污染。 | 可進入類別 PR 與 AI review。 |
| `agent-fix-required` | AI agent 發現可自動修正的結構或內容問題。 | 在對應 phase 分支修正後重跑 `npm run validate`。 |
| `agent-structure-review` | 模組命名、插入位置、UIUX 或結構需要審核。 | 由 AI agent 或人工確認歸類規則。 |
| `agent-source-audit-needed` | 下載或來源對應需要再審核。 | 查官方來源，不可猜測。 |
| `agent-source-needed` | 無足夠官方來源或頁型不適合建立規格表。 | 不補假資料，保留 source-needed audit。 |

## 類別狀態

| Priority | Category | Branch | Pages | Source-needed | Status |
| --- | --- | --- | ---: | ---: | --- |
| 1 | 電動缸 | `phase-1-smac-spec-standard` | 14 | 0 | approved |
| 2 | 驅動器 | `phase-2-drivers-spec-review` | 12 | 0 | approved |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | 24 | 0 | approved |
| 4 | ACS 控制器 / 驅動器 | `phase-2-drivers-spec-review` | 18 | 6 | source-needed |
| 5 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | 31 | 0 | approved |
| 6 | Renishaw 回授元件 | `phase-3-renishaw-feedback` | 36 | 0 | approved |
| 7 | 定位平台 | `phase-3-positioning-stage` | 11 | 0 | approved |
| 8 | 軸承 / 空氣軸承 | `phase-3-bearings-air-mechanical` | 9 | 0 | approved |
| 9 | 聯軸器 | `phase-4-couplings` | 18 | 0 | approved |
| 10 | FMS 張力系統 | `phase-4-fms-tension` | 24 | 0 | approved |
| 11 | 固態繼電器 | `phase-4-solid-state-relays` | 10 | 0 | approved |
| 12 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | 6 | 0 | approved |
| 13 | 特殊環境 / 其他類別 | `phase-4-special-environments` | 11 | 0 | approved |
| 14 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | 1 | 0 | approved |
| 15 | SEJINIGB | `phase-5-sejinigb` | 2 | 0 | approved |
| 16 | 鼓風機 | `phase-5-blowers` | 2 | 0 | approved |
| 17 | 自動化系統 | `phase-5-automation-systems` | 5 | 0 | approved |
| 18 | 其他回授元件 | `phase-5-other-feedback` | 8 | 0 | approved |

## Source-needed 頁面

目前 6 頁集中在 ACS 控制器 / 驅動器類別：

- 241：測試或非正式產品頁，建議排除。
- 253：軟體型頁，缺少可建立規格表的官方來源。
- 254：軟體型頁，缺少可建立規格表的官方來源。
- 255：軟體型頁，缺少可建立規格表的官方來源。
- 268：資訊型頁，沒有穩定規格欄位。
- 269：教育訓練型頁，不適合建立產品規格表。

詳情見：`site/reports/source-needed-audit.html`。

## 主要工具

- `tools/apply-common-spec-module-fixes.mjs`
- `tools/validate-product-spec-modules.mjs`
- `tools/generate-product-spec-agent-review.mjs`
- `tools/generate-source-needed-audit.mjs`
- `tools/generate-optimization-backlog.mjs`
- `tools/generate-github-issue-index.mjs`
- `tools/generate-github-bootstrap-readiness.mjs`
- `tools/github-bootstrap.mjs`

## 驗證命令

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

目前 `npm run validate` 結果：

- static site validation：errors=0
- local mirror readiness：errors=0，warnings=0
- product spec QA：pass=242，no-spec-module=6，fail=0，warn=0
- AI agent review：agent-approved-clean=242，agent-source-needed=6
- source-needed audit：6 頁已分類處置
- optimization backlog：total_pages=248，total_blocking_pages=6

## GitHub 工作流狀態

- 17 個 phase 分支已推送到 GitHub。
- issue drafts：18
- PR drafts：17
- readiness 狀態：`ready-needs-token`
- 尚未建立 GitHub labels/issues/PRs，原因是目前 shell 沒有 `GITHUB_TOKEN` / `GH_TOKEN`。

建立 GitHub 物件前先跑：

```powershell
npm run github:bootstrap:smoke:dry-run
```

有 token 後先跑 smoke：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

smoke 成功後再全量：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```
