# Private GitHub Repo Setup

更新日期：2026-07-06

本文件記錄目前 GitHub-ready repo 的狀態與後續啟用 GitHub API bootstrap 的方式。

## 本機 repo

```text
F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization
```

## 遠端 repo

```text
https://github.com/wangpinyu/taiwan-servo-website.git
```

repo 應保持 private。不要把後台密碼、cookie、token、`.env` 或任何登入狀態放進 repo。

## 目前已完成

- Git repo 已初始化。
- `main` 已推送。
- 17 個 phase branches 已推送。
- Git LFS 已由 `.gitattributes` 規範大型 PDF、ZIP、CAD、圖片。
- GitHub Actions 已建立：`.github/workflows/preview-qa.yml`。
- Issue templates、PR template、labels 設定已建立。
- 本機 preview 與 QA 指令已建立：
  - `npm run serve`
  - `npm run validate`
  - `npm run qa:visual-sample`
- GitHub bootstrap 腳本已建立：
  - labels
  - tracking issues
  - pull requests
  - readiness report

## 基本檢查

```powershell
cd 'F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization'
npm run validate:strict
git status --short
```

## GitHub Token 權限

若要由腳本建立 labels、issues 與 PR，需要 fine-grained GitHub token，範圍限於此 private repo。

建議權限：

- Metadata: read
- Contents: read
- Issues: read/write
- Pull requests: read/write

token 只允許放在目前 PowerShell session：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

不得把 token 寫入檔案、commit、issue、PR 或聊天紀錄。

## Bootstrap 流程

先 dry-run：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

有 token 後先跑 smoke：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

smoke 成功後再建立全部 labels、issues、PR：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

## 重要報告

- `site/reports/github-bootstrap-readiness.html`
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
- `site/reports/github-issues/index.md`
- `site/reports/github-prs/index.md`

## 目前限制

目前 readiness 狀態為 `ready-needs-token` 時，代表本機 repo、分支、draft 與報告已準備好，但目前 shell 沒有 `GITHUB_TOKEN` / `GH_TOKEN`，因此尚未真正建立 GitHub labels、issues、PR。
