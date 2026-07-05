# 產品規格詳情模組審核紀錄

更新日期：2026-07-06

本紀錄用於追蹤 GitHub 驅動的產品頁優化進度。機器可讀狀態以 `site/reports/product-spec-agent-review.json` 與 `site/reports/optimization-backlog.json` 為準；本檔保留人工可讀的階段摘要與審核規則。

## 目前基準

- 產品頁總數：248
- `agent-approved-clean`：27
- `agent-fix-required`：196
- `agent-structure-review`：13
- `agent-source-needed`：6
- `agent-source-audit-needed`：6
- 類別 tracking issue 草稿：18 份，位於 `site/reports/github-issues/`
- 本輪分支：`phase-1-smac-spec-standard`

## 狀態定義

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | AI agent 檢查通過，頁面可進入本機完成狀態 | 類別 PR 中抽樣視覺驗收 |
| `agent-fix-required` | 有可由 agent 修正的結構、CTA、accordion、表格或下載連結問題 | 依類別分支修正 |
| `agent-structure-review` | 頁面結構或模組歸類需要再判斷 | 先做結構審核，再修正 |
| `agent-source-audit-needed` | 有來源或下載對應疑慮 | 查官方來源或既有檔案對應 |
| `agent-source-needed` | 沒有足夠來源建立規格詳情 | 不補寫推測內容，列入人工或來源追蹤 |

## 優先順序

1. SMAC / 電動缸樣板鎖定。
2. 共通警告批次修正：CTA、accordion aria、表格橫向提示、下載按鈕文字。
3. 第一優先類別：電動缸、驅動器、各類馬達、ACS、Harmonic Drive、Renishaw、定位平台、軸承。
4. 第二優先類別：聯軸器、FMS、固態繼電器、山洋電氣、特殊環境。
5. 第三優先類別：陶瓷吸盤、SEJINIGB、鼓風機、自動化系統。

## 類別工作流

每一類別使用一個分支與一個 PR：

- `main` 保持可驗證。
- PR 必須附上修改頁數、QA 報告、AI review 狀態、待確認項。
- 合併前必跑 `npm run validate` 與 GitHub Actions `preview-qa.yml`。
- 大檔案問題標記為 `blocked-server-large-file`，不阻塞本機 UIUX / SEO 優化。
- 若 PDF / CAD 無法穩定上傳或檔案過大，優先連到原廠官方下載頁或官方文件 URL，並標示 `external-source`。

## 本輪完成事項

- 新增 PR template、issue template、label 定義與 GitHub workflow 說明。
- 新增 `tools/generate-optimization-backlog.mjs`，由 agent review 報告產生類別 backlog 與 issue 草稿。
- `npm run validate` 已納入 backlog 產生流程。
- GitHub Actions artifact 已包含 `site/reports/github-issues/*.md`。
- 已產出 `site/reports/optimization-backlog.html` 與 `site/reports/optimization-backlog.json`。

## 待處理

- 在 GitHub UI 建立第一個 PR：`phase-1-smac-spec-standard` -> `main`。
- 若需要在 GitHub 站上直接建立 labels / issues，可使用 `.github/labels.yml` 與 `site/reports/github-issues/*.md` 匯入。
- 後續 PR 開始實際修正產品頁內容，先從 SMAC / 電動缸開始。
