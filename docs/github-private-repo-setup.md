# Private GitHub Repo Setup

最後更新：2026-07-06

本文件記錄星泰網站本機優化工作區的 GitHub private repo 準備方式。

本機 repo：

```text
F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization
```

遠端 repo：

```text
https://github.com/wangpinyu/taiwan-servo-website.git
```

## 目前已完成

- 已建立 Git repo。
- 已推送 `main`。
- 已推送 17 個 phase 分支。
- 已設定 Git LFS 規則，PDF、ZIP、CAD、圖片等大型檔案由 `.gitattributes` 管理。
- 已建立 GitHub Actions：`.github/workflows/preview-qa.yml`。
- 已建立本機 preview 與 QA 指令：
  - `npm run serve`
  - `npm run validate`
- 已建立 GitHub bootstrap 工具：
  - labels
  - tracking issues
  - pull requests
  - smoke dry-run
  - readiness report

## Repo 原則

- Repo 必須保持 private。
- 不存放後台帳密、cookie、token、`.env` 或私密設定。
- 本階段只處理本機 preview 與 GitHub 工作流，不登入後台、不儲存、不上傳、不覆蓋正式伺服器。
- 大型文件與圖片若納入 repo，需走 Git LFS 或先壓縮整理。

## 基本命令

```powershell
cd 'F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization'
npm run validate
git status --short
```

## GitHub API Bootstrap

先 dry-run：

```powershell
npm run github:bootstrap:dry-run
```

少量 smoke：

```powershell
npm run github:bootstrap:smoke:dry-run
```

有 GitHub fine-grained token 後：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

smoke 成功後可全量建立 labels、issues、PRs：

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

Token 不得寫入檔案或 commit。

## GitHub Token 權限

Fine-grained token 建議只給此 private repo，權限至少包含：

- Metadata: read
- Issues: read/write
- Pull requests: read/write
- Contents: read

Labels 由 Issues API 管理，因此通常跟 Issues 權限一起運作。

## 驗證報告

- `site/reports/github-bootstrap-readiness.html`
- `site/reports/github-ready-validation.html`
- `site/reports/local-mirror-readiness-current.html`
- `site/reports/product-spec-module-qa.html`
- `site/reports/product-spec-agent-review.html`
- `site/reports/source-needed-audit.html`
- `site/reports/optimization-backlog.html`

## 後續部署邊界

本 repo 是前台優化與 preview 工作區。正式上架前需另開部署階段，處理：

- 後台 CKEditor 可控欄位映射。
- 代表圖 / 圖片欄位是否可改。
- 伺服器檔案覆蓋策略。
- 大檔、下載連結、原廠外部連結策略。
- 正式網回歸驗證。
