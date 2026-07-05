# GitHub 驅動的星泰產品頁優化工作流

更新日期：2026-07-06

本 repo 是星泰網站前端鏡像、產品頁規格模組、SEO、UIUX 與下載連結整理的 GitHub 工作區。工作流目標是讓每個品牌或產品分類都能在本機 preview 完成、通過 AI review 與 CI，再進入後台或伺服器部署階段。

## 分支與 PR 規則

- `main`：永遠保持可驗證狀態。
- `phase-1-smac-spec-standard`：SMAC / 電動缸標準樣板。
- `phase-2-drivers-spec-review`：驅動器與 ACS 控制器 / 驅動器。
- `phase-2-motors-spec-review`：各類馬達。
- `phase-3-harmonic-drive`：Harmonic Drive 減速機。
- `phase-3-renishaw-feedback`：Renishaw 回授元件產品。
- `phase-3-positioning-stage`：定位平台。
- `phase-3-bearings-air-mechanical`：空氣軸承 / 滾珠與滾柱軸承。
- `phase-4-*`：聯軸器、FMS、固態繼電器、山洋電氣、特殊環境。
- `phase-5-*`：陶瓷吸盤、SEJINIGB、鼓風機、自動化系統、其他回授元件。

每個 PR 必須附：

- 修改頁數與產品分類。
- `npm run validate` 結果。
- 對應 QA 報告連結。
- AI review 狀態摘要。
- `source-needed` 或後台限制的例外說明。

## Issue 與 Label 規則

每個產品分類或品牌建立一個 tracking issue。高風險頁可另拆子 issue。

標籤來源以 `.github/labels.yml` 為準：

- `spec-module`：產品規格詳情、accordion、table、CTA。
- `seo`：title、meta、canonical、schema、heading、內部連結。
- `uiux`：排版、可讀性、手機版、互動狀態。
- `download-links`：PDF、CAD、Manual、Catalog、Drawing、Software。
- `source-needed`：官方來源缺失或來源衝突。
- `backend-ready`：本機 preview 已可進入後台上架準備。
- `blocked-server-large-file`：已知大檔或伺服器限制，不阻塞本機優化。

## 本機命令

完整驗證：

```powershell
npm run validate
```

重新產生 backlog 與 issue 控制表：

```powershell
npm run workflow:backlog
```

重新產生 PR 控制表：

```powershell
npm run workflow:pr-index
```

準備單一 PR：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-pr.ps1 -Branch phase-1-smac-spec-standard
```

準備單一 issue：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-issue.ps1 -Branch phase-1-smac-spec-standard
```

## 狀態流轉

主要資料來源是 `site/reports/product-spec-agent-review.json`。

狀態定義：

- `agent-fix-required`：AI agent 可自行修正。
- `agent-structure-review`：需要檢查版型、模組順序或互動結構。
- `agent-source-audit-needed`：需要再次核對官方來源。
- `agent-source-needed`：官方資料不足或來源衝突，保留缺口，不編造內容。
- `agent-approved-clean`：本機 preview 與 QA 已通過。

完成條件：

- 目標頁為 `agent-approved-clean`，或 `source-needed` 已合理列入報告。
- `npm run validate` 通過。
- `產品規格詳情` 位於 `產品系列` 下方。
- 使用真正 `<table>`，表頭保留原廠欄位與單位。
- Accordion 使用 `<button>`、`aria-expanded`、`aria-controls`，且有明確展開/收合文字。
- 無 `href="#"`、`.txt` href、本機路徑、內部註解、`pending`、`placeholder`、`data-local-file`。
- PDF / CAD / Manual / Catalog / Drawing / Software 分類清楚；無下載時顯示「請洽星泰」或等價狀態。
- 保留 canonical、title、meta、breadcrumb 與既有導覽邏輯。

## 目前已知限制

- GitHub CLI 尚未安裝；若可控瀏覽器沒有登入 private repo，PR / issue 不能由 agent 直接送出。
- 已提供 `prepare-github-pr.ps1` 與 `prepare-github-issue.ps1`，會開啟對應 GitHub 頁面並把 Markdown 草稿複製到剪貼簿。
- 大檔案上傳與 CKFinder 問題屬部署階段，不阻塞本機 preview 優化。若大檔無法穩定上傳，優先改連原廠官方下載頁或官方文件 URL，並在報告標記 `external-source`。

## 部署邊界

本 repo 只處理本機 preview、GitHub QA、AI review 與部署前準備。後台登入、測試網儲存、CKFinder 上傳、正式站覆蓋都屬下一階段，必須另外取得明確操作範圍與確認。
