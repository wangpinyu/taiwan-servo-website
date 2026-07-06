# Deployment Phase Runbook

這份文件只描述未來部署階段的做法。它不是目前本機 preview / GitHub PR 階段的上架授權。

目前原則：

- 本機與 GitHub 驗證完成，不等於可以覆蓋正式伺服器。
- 後台保存、測試網上架、正式伺服器覆蓋，都必須另開 deployment phase 並取得明確核准。
- 部署前必須有備份、smoke test 與 rollback 方案。

## 進入部署前的必要條件

部署階段啟動前，至少需要確認：

- `npm run validate:strict` 通過。
- 相關 PR 已完成審查並合併，或明確指定要部署的分支。
- `site/reports/deployment-review-classification.html` 中 `unresolvedNeedsReview` 為 0。
- `site/reports/deployment-package-integrity.html` 顯示 deployment package manifest 檔案存在、bytes 相符、無目標路徑衝突。
- 已確認部署範圍：整站、單一分類、單一產品頁或單一資源類型。
- 已建立正式伺服器與後台內容備份。
- 已指定 rollback 方式與驗收人。

## 部署檔案分類

部署前以 `site/reports/deployment-review-classification.html` 為準：

- `same-path-overwrite`：可作為同路徑覆蓋候選，但仍需備份與 smoke test。
- `backend-managed-download-route`：屬於後台或下載路由管理，不可直接用檔案覆蓋取代。
- `css-relative-asset`：CSS 內引用的相對資源，必須與 CSS bundle 一起保留路徑關係。
- `site-static-asset-review`：favicon、logo 或全站靜態資源，需要單獨審查快取與替換風險。
- `local-placeholder-exclude`：本機 placeholder，不得上傳。

部署 package 本機檔案完整性以 `site/reports/deployment-package-integrity.html` 為準。若出現 missing local file、byte mismatch 或 duplicate target conflict，必須先修正或排除，不得進入正式覆蓋。

## 建議部署流程

1. 備份
   - 備份目標伺服器檔案。
   - 匯出或備份會受影響的後台內容。
   - 記錄備份路徑與恢復方法。

2. 小範圍 smoke test
   - 先選 1 個產品分類、1 個產品頁、1 個服務頁。
   - 部署後確認頁面可開、圖片可顯示、CTA 可點擊。

3. 分批部署
   - 優先處理 `same-path-overwrite`。
   - 後台下載路由與大檔案連結另走後台或檔案管理流程。
   - CSS 相對資源需與 CSS 一起部署，避免圖示或字型失效。

4. 驗收
   - Desktop 與 mobile 各抽樣檢查。
   - 檢查沒有破圖、沒有水平溢出。
   - 檢查 PDF/CAD/下載連結。
   - 檢查 canonical、breadcrumb、H1、meta 與 CTA。

5. Rollback
   - 若 smoke test 失敗，停止擴大部署。
   - 還原備份。
   - 重新執行同一組 smoke test。

## 不可做的事

- 不可上傳 `local-placeholder-exclude`。
- 不可把 `/file/download/...` 或 `/file/output/...` 視為普通靜態檔案覆蓋。
- 不可在未備份狀態下覆蓋正式伺服器。
- 不可把本機 preview 的成功視為正式後台保存成功。

## 部署回報格式

```md
## 部署摘要
- 範圍：
- 分支 / commit：
- 備份位置：

## 部署分類
- same-path-overwrite：
- backend-managed-download-route：
- css-relative-asset：
- site-static-asset-review：
- excluded placeholders：

## 驗收
- Desktop：
- Mobile：
- 下載連結：
- SEO 結構：

## Rollback
- 備份是否可用：
- 是否執行還原：

## 遺留問題
- ...
```
