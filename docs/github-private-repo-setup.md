# GitHub 私有 Repo 準備狀態

更新日期：2026-07-06

本文件記錄目前星泰網站本機優化專案在 GitHub 私有 repo 上的準備狀態。目標是讓後續 UIUX、SEO、產品規格詳情、下載連結與部署前檢查都能透過分支、驗證報告與 PR 流程追蹤。

## 本機 Repo

```text
F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization
```

## GitHub Remote

```text
https://github.com/wangpinyu/taiwan-servo-website.git
```

repo 已設定為 private。不要把 cookie、token、`.env`、密碼、憑證或任何私密設定提交到 repo。

## 已完成項目

- Git repo 已初始化。
- `main` 已推送到 GitHub。
- phase / source-audit 分支已建立並推送。
- Git LFS 已設定，涵蓋 PDF、ZIP、CAD、圖片等大型檔案類型。
- GitHub Actions 已建立：`.github/workflows/preview-qa.yml`。
- Issue template、PR template 與 labels 設定檔已建立。
- 本機 preview 與 QA 指令已可執行：
  - `npm run serve`
  - `npm run validate`
  - `npm run validate:strict`
  - `npm run qa:visual-sample`
- GitHub bootstrap 腳本已可產生 labels、tracking issues、PR drafts、readiness report 與遠端狀態驗證報告。

## 常用驗證指令

```powershell
cd 'F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization'
npm run validate:strict
git status --short
```

## GitHub Token 需求

若要由本機腳本直接建立 GitHub labels、issues 與 pull requests，需要 fine-grained GitHub token，權限至少包含：

- Metadata: read
- Contents: read
- Issues: read/write
- Pull requests: read/write

token 只應暫存在目前 PowerShell session，不要寫入檔案或 commit。建議只執行安全 runner，它會先做 dry-run、再做 smoke、最後套用完整 bootstrap 並刷新報告：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:safe
Remove-Item Env:\GITHUB_TOKEN
```

如果沒有 token，本機仍可產生 issue / PR 草案與 readiness 報告，但無法透過 GitHub API 建立遠端 labels、issues 或 PR。

## Bootstrap 指令

無 token 時可先確認草案與遠端分支狀態，不會建立 GitHub 物件：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
npm run workflow:github-remote-verify
```

有 token 時使用安全 runner：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:safe
Remove-Item Env:\GITHUB_TOKEN
```

只有在排查 GitHub API 權限或單一 smoke 問題時，才改用分段指令：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

## 主要報告

- `site/reports/github-bootstrap-readiness.html`
- `site/reports/github-remote-state-verification.html`
- `site/reports/github-api-bootstrap-handoff.html`
- `site/reports/deployment-readiness-audit.html`
- `site/reports/github-ready-validation.html`
- `site/reports/local-mirror-readiness-current.html`
- `site/reports/product-spec-module-qa.html`
- `site/reports/product-page-structure-seo-qa.html`
- `site/reports/product-spec-agent-review.html`
- `site/reports/gpt-optimization-completion-audit.html`
- `site/reports/visual-sample-qa.html`
- `site/reports/source-needed-audit.html`
- `site/reports/optimization-backlog.html`
- `site/reports/github-issues/index.html`
- `site/reports/github-prs/index.html`

## 目前狀態

目前 GitHub readiness 狀態為 `ready-needs-token`。這代表本機 repo、preview、驗證、草案與報告都已準備好；剩下的外部動作是提供一次性 GitHub token，讓腳本建立或更新遠端 labels、issues 與 PR。

部署與後台儲存不在本階段執行。進入部署階段前，需要另外確認伺服器覆蓋策略、後台限制、備份與人工批准。
