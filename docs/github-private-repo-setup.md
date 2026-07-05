# Private GitHub Repo Setup

本資料夾已整理成可推送到 GitHub private repo 的工作副本。

本機 repo 位置：

```text
F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization
```

## 目前已完成

- 已建立 Git repo：branch `main`
- 已啟用 Git LFS
- 已設定 `.gitattributes`，PDF、ZIP、CAD、圖片等大型資產走 LFS
- 已建立 GitHub Actions：`.github/workflows/preview-qa.yml`
- 已建立本機預覽工具：`npm run serve`
- 已建立 QA 工具：`npm run validate`
- 已建立網站架構與規格模組文件

## 建立 GitHub Private Repo

1. 到 GitHub 建立新 repository。
2. Repository name 建議：

```text
taiwan-servo-site-optimization
```

3. Visibility 選 `Private`。
4. 不要勾選自動建立 README、.gitignore、license，因為本機已經準備好。

## 推送到 GitHub

在 PowerShell 進入本機 repo：

```powershell
cd 'F:\Taiwan_Servo_website_management_Codex_File\github-ready\taiwan-servo-site-optimization'
```

設定遠端：

```powershell
git remote add origin https://github.com/<your-account>/taiwan-servo-site-optimization.git
```

第一次提交：

```powershell
git add .
git commit -m "Initial private site optimization workspace"
git push -u origin main
```

如果 GitHub 要求登入，使用 GitHub Desktop、Git Credential Manager 或 GitHub CLI 登入即可。不要把 token、cookie、密碼寫入 repo。

## 每次優化後的標準流程

```powershell
npm run validate
git status --short
git add .
git commit -m "Describe the optimization"
git push
```

## GitHub Actions

每次 push 或 PR 會執行：

```powershell
npm run validate
```

並上傳 `site/reports/*.html`、`site/reports/*.json` 作為 artifact，方便審查。

## 注意事項

- `site/documents-cache` 內的 PDF/CAD/ZIP 會透過 Git LFS 管理。
- private repo 仍不代表原廠文件授權已解決；這裡只作為內部優化工作副本。
- 不要加入後台登入資訊、cookie、token、`.env`。
- 上架前仍要依 `deploy-manifest` 與後台限制對照表確認哪些檔案/內容可覆蓋。

