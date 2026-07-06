# Deployment Phase Runbook

本文件定義從本機 preview / GitHub PR 階段進入實際部署階段時必須遵守的流程。它不授權任何後台儲存、伺服器上傳、刪除或正式覆蓋；所有 mutation 必須另行取得明確批准。

## 進入條件

部署階段只能在以下條件都成立後開始：

- 目標分支已通過 `npm run validate:strict`。
- 對應 PR 已完成 AI review 或人工確認。
- `site/reports/deployment-review-classification.html` 的 `unresolvedNeedsReview` 為 0。
- 已確認部署範圍是全站、單一類別、單一品牌，或指定頁面集合。
- 已建立後台內容與伺服器檔案備份策略。
- 已定義 smoke test 與 rollback 方法。

## 部署資源分流

部署前必須依 `site/reports/deployment-review-classification.html` 分流：

- `same-path-overwrite`：可在備份與批准後進行同路徑覆蓋的 `/uploads/...` 圖片或資源。
- `backend-managed-download-route`：由 `/file/download/...` 或 `/file/output/...` 提供的下載檔，必須走後台或檔案管理流程，不可直接盲目覆蓋。
- `css-relative-asset`：CSS 相依圖示、字型或小資源，需跟 CSS bundle 一起處理或在部署時重寫路徑。
- `site-static-asset-review`：favicon、logo 或站台靜態資源，必須獨立審查。
- `local-placeholder-exclude`：本機缺檔或 0-byte placeholder，不得部署到伺服器。

## 建議部署順序

1. 建立備份：
   - 後台可編輯內容備份。
   - 伺服器 `/uploads/...` 目標檔案備份。
   - 目前正式站 HTML / CSS / JS / 圖片可回復包。
2. 小範圍 smoke test：
   - 選 1 個低風險產品頁與 1 個服務頁。
   - 只部署必要資源。
   - 驗證桌機與手機版。
3. 分流部署：
   - 先處理 same-path overwrite 圖片與靜態資源。
   - 再處理後台管理下載檔。
   - 最後處理 CSS bundle 相依資源。
4. 驗證：
   - 首頁、產品分類、產品詳情、服務頁皆可開啟。
   - 重要 CTA、詢問入口、下載連結可用。
   - 無破圖、無 `.txt` href、無 `file:///`、無本機路徑。
   - canonical、breadcrumb、H1、meta 不被破壞。
5. Rollback：
   - 任一 smoke test 失敗且無法快速修正時，立即回復備份。
   - 回復後重新驗證至少首頁、產品分類、受影響詳情頁。

## 禁止事項

- 未備份直接覆蓋伺服器檔案。
- 將 `local-placeholder-exclude` 檔案部署到伺服器。
- 對 `/file/download/...` 或 `/file/output/...` 做盲目同路徑覆蓋。
- 未驗證正式 URL 就宣稱部署完成。
- 把本機 preview 通過誤認為正式站已完成。

## 部署後回報格式

```md
## 部署摘要
- 範圍：
- 部署時間：
- 操作人：

## 部署內容
- same-path-overwrite：
- backend-managed-download-route：
- css-relative-asset：
- site-static-asset-review：
- excluded placeholders：

## 驗證
- Desktop：
- Mobile：
- 下載連結：
- SEO 結構：

## Rollback 狀態
- 備份位置：
- 是否需要回復：

## 待處理
- ...
```
