# 產品規格詳情審核紀錄

更新日期：2026-07-06

本文件是 GitHub-ready preview 的階段性審核紀錄。詳細機器可讀資料以 `site/reports/product-spec-agent-review.json`、`site/reports/product-spec-module-qa.json`、`site/reports/product-page-structure-seo-qa.json`、`site/reports/product-seo-warning-taxonomy.json` 與 `site/reports/source-needed-audit.json` 為準。

## 目前總覽

- 產品頁：248
- `agent-approved-clean`：237
- `agent-source-needed`：11
- `agent-fix-required`：0
- `agent-structure-review`：0
- critical fail：0

## Agent Review 狀態

| 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| `agent-approved-clean` | 本機 preview 已通過 AI agent 結構、規格、SEO 與下載連結檢查。 | 可納入 PR 審查，等待部署階段。 |
| `agent-fix-required` | AI 可以修正的結構、CTA、表格或連結問題。 | 由 phase branch 持續修正並重跑 `npm run validate`。 |
| `agent-structure-review` | 模組位置或標題歸類需要再次確認。 | AI 先整理，無法判定才升級人工。 |
| `agent-source-audit-needed` | 來源可疑或資料對應需要來源審核。 | 檢查官方來源後再決定。 |
| `agent-source-needed` | 缺官方來源或規格資料，不應自行補寫。 | 由來源補齊工作處理，或保留為例外。 |

## Phase 優先順序

| Priority | Category | Branch | Focus |
| --- | --- | --- | --- |
| 1 | SMAC / 電動缸 | `phase-1-smac-spec-standard` | 標準樣板與可複用規格模組 |
| 2 | 驅動器 / ACS | `phase-2-drivers-spec-review` | 驅動器、控制器、文件分類 |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | 馬達規格表與下載連結 |
| 4 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | 系列、減速比、扭矩、CAD |
| 5 | Renishaw 回授元件 | `phase-3-renishaw-feedback` | 解析度、介面、安裝文件 |
| 6 | 定位平台 | `phase-3-positioning-stage` | 行程、負載、精度 |
| 7 | 空氣軸承 / 滾珠・滾柱軸承 | `phase-3-bearings-air-mechanical` | 軸承規格與 CAD |
| 8 | 聯軸器 | `phase-4-couplings` | 型號、扭矩、下載文件 |
| 9 | FMS 張力系統 | `phase-4-fms-tension` | FMS 產品系列與文件 |
| 10 | 固態繼電器 | `phase-4-solid-state-relays` | i-Autoc 文件與系列對應 |
| 11 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | San Ace / SANMOTION / SANUPS |
| 12 | 特殊環境 | `phase-4-special-environments` | 特殊應用與來源確認 |
| 13 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | 來源補齊與規格表 |
| 14 | SEJINIGB | `phase-5-sejinigb` | 來源補齊與規格表 |
| 15 | 鼓風機 | `phase-5-blowers` | 來源補齊與規格表 |
| 16 | 自動化系統 | `phase-5-automation-systems` | 系統型內容架構 |
| 17 | 其他回授元件 | `phase-5-other-feedback` | 其他回授產品 |

## Source-needed 摘要

目前 11 頁仍需來源或內容判斷：

- `official-source-needed`：5
- `software-source-needed`：3
- `informational-source-needed`：1
- `training-content-no-spec`：1
- `exclude-test-page`：1

詳細清單請看：

- `site/reports/source-needed-audit.html`
- `site/reports/source-needed-audit.json`

## 目前 QA 狀態

`product-spec-module-qa`：

- total：248
- pass：242
- no-spec-module：6
- fail：0
- warn：0

`product-page-structure-seo-qa`：

- total：248
- pass：228
- warn：14
- no-spec-module：6
- fail：0

5 個 warning 目前集中在 `spec-table-missing`，多屬於沒有足夠規格來源或不適合建立型號表的頁面，需與 source-needed audit 一起看。

## 2026-07-06 Phase 4 聯軸器更新

- 已將 9 個 RINGFEDER 聯軸器頁面的 `產品規格詳情` 改為官方文件索引型表格：208、209、210、211、212、213、215、335、336。
- 每頁保留 `產品系列` 既有正式網 UIUX，`產品規格詳情` 放在系列區下方，使用真正 `<table>`、`details`、外部 RINGFEDER 官方 PDF / CAD 下載入口與星泰詢問 CTA。
- 不補寫原廠未提供的扭矩、尺寸或型號規格；本輪只用頁面既有 RINGFEDER 官方下載連結作為可驗證資料入口。
- 9 頁已由 `agent-source-needed` 轉為 `agent-approved-clean`。

## 已建立工具

- `tools/apply-common-spec-module-fixes.mjs`
- `tools/resolve-product-standardization-review.mjs`
- `tools/validate-product-spec-modules.mjs`
- `tools/validate-product-page-structure-seo.mjs`
- `tools/generate-product-seo-warning-taxonomy.mjs`
- `tools/generate-product-spec-agent-review.mjs`
- `tools/generate-source-needed-audit.mjs`
- `tools/apply-ringfeder-document-index.mjs`
- `tools/generate-optimization-backlog.mjs`
- `tools/generate-github-issue-index.mjs`
- `tools/generate-github-pr-index.mjs`
- `tools/generate-github-bootstrap-readiness.mjs`
- `tools/github-bootstrap.mjs`

## 驗證指令

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

## 2026-07-06 Source-needed 文件索引收斂

- 新增 `tools/apply-source-needed-document-index.mjs`，將 5 個仍有官方/既有文件來源的一般產品頁改為「官方文件入口」型 `產品規格詳情`。
- 已處理頁面：102 JVL、149 Thomson 減速機、194 SANUPS、195 SANMOTION、270 SANYO DENKI 馬達相關。
- 規格區改用真正 `<table>`、`details`、明確文件連結與 `詢問規格 / Quote` CTA；不新增未經官方來源支持的規格數值。
- 移除前台不應顯示的內部語氣與 `data-original-url` / `data-file-key` 類資料屬性，PDF 入口改為真正可點連結。
- `npm run validate` 結果：`product-spec-module-qa` 242 pass / 6 no-spec-module / 0 fail / 0 warn；`product-page-structure-seo-qa` 242 pass / 6 no-spec-module / 0 fail / 0 warn；`agent-approved-clean` 242，`agent-source-needed` 6。
- 剩餘 6 頁為測試頁、軟體頁、ACS 特點說明與教育訓練影片，依不編造規格原則保留為 `source-needed` 類型，不硬補產品規格表。

## GitHub 狀態

- phase branches 已推送到 origin。
- issue drafts 與 PR drafts 已產出。
- `github-bootstrap-readiness` 目前會依 shell 是否有 `GITHUB_TOKEN` / `GH_TOKEN` 判定是否可 apply。
- 若沒有 token，只能產出 dry-run 與 Markdown drafts，不能實際建立 GitHub labels / issues / PRs。

## 2026-07-06 Thomson UIUX visible quality pass

- Branch: `phase-uiux-thomson-actuators`
- Scope: local preview only; no backend save, no upload, no test-site mutation.
- Updated `detail/100` (`Thomson 電動缸`) as the first Thomson visible UIUX sample page:
  - Replaced the previous mixed/placeholder layout with a clean green-and-white Thomson product page structure.
  - Preserved one H1 and the existing page shell/navigation.
  - Added clear sections: `主內容區`, `產品系列`, `產品規格詳情`, `應用領域`, `技術資料下載`.
  - Kept `產品規格詳情` as a real table inside the standardized spec-module markers.
  - Used local real product/document assets instead of placeholder images.
- Updated Thomson placeholder-image cleanup pages:
  - `detail/170`, `detail/171`, `detail/376`, `detail/377`, `detail/378`, `detail/379`
  - Replaced 18 total `placehold.co` application-card images with existing local Thomson product images from the same page.
  - Fixed `detail/171` card-section heading from `產品規格詳情` to `產品系列` so the real spec module is the only `產品規格詳情` section.
- Validation:
  - `npm run qa:spec`: pass, 242 pass / 6 no-spec-module / 0 fail / 0 warn.
  - `npm run qa:product-seo`: pass, 242 pass / 6 no-spec-module / 0 fail / 0 warn.
  - `npm run validate`: pass, 0 errors.
- Remaining Thomson work:
  - Manually review `detail/100` preview before applying the same visual system broadly.
  - Review non-actuator Thomson pages (`149`, `164`, `191`) separately because their page intent differs from 電動缸/推桿 pages.

## 2026-07-06 Thomson non-actuator page pass

- Branch: `phase-uiux-thomson-actuators`
- Scope: local preview only; no backend save, no upload, no test-site mutation.
- Reviewed Thomson non-actuator pages:
  - `detail/149` Thomson 減速機
  - `detail/164` Thomson滑台
  - `detail/191` Thomson 直線軸承和導軌
- Fixes:
  - `detail/164` and `detail/191`: replaced empty document status badges with `請洽星泰`.
  - Replaced empty `.st-thom-empty` boxes with customer-facing text: `文件需依實際型號與語言版本確認，請由星泰協助提供。`
  - Left `detail/149` layout unchanged because no placeholder image or empty document-state issue was found.
- Validation:
  - `npm run qa:spec`: pass, 242 pass / 6 no-spec-module / 0 fail / 0 warn.
  - `npm run qa:product-seo`: pass, 242 pass / 6 no-spec-module / 0 fail / 0 warn.
  - `npm run validate`: pass, 0 errors.
  - Edge/Playwright visual smoke on `149`, `164`, `191` at desktop 1366x900 and mobile 390x844: HTTP 200, no horizontal overflow, no broken images, no placeholder images, no empty document badges.
