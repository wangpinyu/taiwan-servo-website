# 產品規格詳情模組審核紀錄

更新日期：2026-07-06

本文件記錄 GitHub-ready 本機 preview 的產品規格詳情模組審核狀態。機器可讀來源以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json` 與 `site/reports/optimization-backlog.json` 為準。

## 目前總覽

- 產品頁總數：248
- `agent-approved-clean`：242
- `agent-source-needed`：6
- `agent-fix-required`：0
- `agent-structure-review`：0
- `agent-source-audit-needed`：0
- blocking pages：6，皆為缺官方來源或缺既有規格模組，不自動補寫推測內容。
- 目前分支：`phase-1-smac-spec-standard`

## 狀態定義

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | AI agent 審核通過；規格模組 QA 無 critical / warning，且未見內部註解、`.txt`、本機路徑、`href="#"` 等前台風險。 | 可進入類別 PR 驗收與後續上架準備。 |
| `agent-fix-required` | 可由 agent 自行修正的前台結構或可用性問題，例如 CTA、accordion、表格、下載按鈕文字。 | 由 agent 批次或逐頁修正。 |
| `agent-structure-review` | 模組標題或版面歸類不確定，需要結構審核。 | 由 AI agent 先審核；只有無法判定時才升級人工。 |
| `agent-source-audit-needed` | 下載或來源對應可能不明確。 | 查官方來源或既有專案檔案，無法確認則維持待確認。 |
| `agent-source-needed` | 找不到足夠來源或沒有既有規格模組候選。 | 不補寫假規格；列入來源補齊清單。 |

## 本輪已完成

- 新增 `tools/apply-common-spec-module-fixes.mjs`，可重跑共通規格模組修正。
- 新增 npm scripts：
  - `npm run fix:spec-common`
  - `npm run fix:spec-common:dry-run`
- 全站規格模組補上標準 CTA 區塊 `.st-spec-cta`。
- 對缺少 `aria-label` 的 PDF / CAD / Manual / Catalog / Drawing / Software 下載入口補上可辨識標籤。
- 收斂 AI agent review 判定：已審核的未知模組標題若符合合理產品內容或規格子模組，不再停留於 `agent-structure-review`。
- 保留 6 頁 `agent-source-needed`，因沒有足夠來源或沒有既有規格模組候選，不自動生成推測規格。

## 驗證結果

`npm run validate`：

- static site validation：`errors=0`
- product spec QA：`pass=242`、`no-spec-module=6`、`fail=0`、`warn=0`
- AI agent review：`agent-approved-clean=242`、`agent-source-needed=6`
- optimization backlog：`total_blocking_pages=6`

瀏覽器抽樣（Edge headless）：

- 抽樣頁：79、100、173、244、354、398
- 視窗：desktop 1366x900、mobile 390x844
- 結果：標準 CTA 皆存在、無破圖、無 whole-page horizontal overflow。

## 待來源補齊頁面

下列頁面仍維持 `agent-source-needed`，不應由 agent 憑空撰寫規格：

- 241
- 253
- 254
- 255
- 268
- 269

## GitHub 工作流規則

- `main` 保持可驗證狀態。
- 每個類別/品牌用獨立 branch 與 PR 收斂。
- 每個 PR 至少附：
  - 修改頁數
  - QA 報告連結
  - AI review 狀態
  - 待來源確認項
- 合併前必跑：
  - `npm run validate`
  - GitHub Actions `preview-qa.yml`

## 後續優先順序

1. 鎖定 SMAC / 電動缸樣板與本輪共通規格模組修正。
2. 進入第一優先類別：電動缸、驅動器、各類馬達、ACS、Harmonic Drive、Renishaw、定位平台、軸承。
3. 第二優先類別：聯軸器、FMS、固態繼電器、山洋電氣、特殊環境。
4. 第三優先類別：陶瓷吸盤、SEJINIGB、鼓風機、自動化系統。
