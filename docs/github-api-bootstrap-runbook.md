# GitHub API Bootstrap Runbook

這份文件用於把本機已產生的 GitHub labels、tracking issues 與 pull requests 草案，真正建立到私人 GitHub repo：

`wangpinyu/taiwan-servo-website`

本步驟只處理 GitHub 工作流物件，不會修改後台、不會上架、不會覆蓋伺服器檔案。

## 前置狀態

目前本機已具備：

- 7 個 GitHub label 定義：`.github/labels.yml`
- 18 個 category tracking issue 草案：`site/reports/github-issues/`
- 17 個 PR 草案：`site/reports/github-prs/`
- 18 個遠端分支已推送到 origin
- 248 個產品頁已完成 AI agent review 分流

尚未完成的是：GitHub API 需要 token 才能建立 labels、issues 與 PR。

## Token 權限

建議使用 fine-grained personal access token，權限只給這個 repo：

- Metadata: Read
- Contents: Read
- Issues: Read and write
- Pull requests: Read and write

不要把 token 寫入 repo、文件、截圖或 commit。只在目前 PowerShell session 暫時設定。

## 執行順序

最建議使用安全一鍵流程。它會自動執行 dry-run、smoke、full bootstrap，最後刷新 readiness / handoff / strict validation：

```powershell
$env:GITHUB_TOKEN = "<paste-token-here>"
npm run github:bootstrap:safe
Remove-Item Env:\GITHUB_TOKEN
```

如果需要分段人工檢查，也可以使用下列診斷流程。日常流程仍以 `npm run github:bootstrap:safe` 為準。

先做無 token dry run，確認本機草案可讀：

```powershell
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
npm run workflow:github-remote-verify
```

設定 token：

```powershell
$env:GITHUB_TOKEN = "<paste-token-here>"
```

先建立最小 smoke set：

```powershell
npm run github:bootstrap:smoke
```

確認 GitHub 上已出現：

- labels
- 1 個 tracking issue
- 1 個 PR

再執行完整 bootstrap：

```powershell
npm run github:bootstrap
```

完成後清除 session token：

```powershell
Remove-Item Env:\GITHUB_TOKEN
```

重新產生 readiness、遠端狀態與完整驗證：

```powershell
npm run workflow:github-readiness
npm run workflow:github-remote-verify
npm run workflow:github-api-handoff
npm run validate:strict
```

若使用 `npm run github:bootstrap:safe`，上述 dry-run、smoke、full apply 與 strict validation 會由 runner 串起來執行。

## 預期結果

完成後 `site/reports/github-bootstrap-readiness.json` 應顯示：

- `status`: `ready`
- `tokenPresent`: 視執行當下 session 而定
- `pullRequestRefs`: 大於 0
- `remote-prs`: `pass`

`site/reports/github-remote-state-verification.json` 應顯示：

- `status`: `remote-ready`
- `gitRemote.missingBranches`: 空陣列
- `api.labels.status`: `pass`
- `api.issues.status`: `pass`
- `api.pullRequests.status`: `pass`

GitHub repo 應有：

- 7 個 labels
- 18 個 tracking issues
- 17 個 pull requests

## 失敗處理

如果 GitHub API 回傳權限錯誤：

1. 確認 token 只貼在 PowerShell session，沒有被 commit。
2. 確認 token repo scope 是 `wangpinyu/taiwan-servo-website`。
3. 確認 Issues 與 Pull requests 是 read/write。
4. 重新跑 smoke，不要直接重跑完整 bootstrap。

如果 issue 或 PR 已存在，`tools/github-bootstrap.mjs` 會以 title 或 branch 偵測既有項目並跳過，不應重複建立。

如果想先套用 GitHub 物件但暫時不跑完整 strict validation，可使用：

```powershell
npm run github:bootstrap:safe:no-strict
```

但正式交接前仍必須再跑：

```powershell
npm run validate:strict
```

## 完成定義

這一步完成後，只代表 GitHub 工作流已可用。部署、後台保存、測試網上架、正式伺服器覆蓋仍屬於獨立 deployment phase，必須另外取得明確核准。
