# 產品規格詳情模組審核紀錄

更新日期：2026-07-06

本紀錄對應本機 mirror：`.codex_tmp/site-mirror-current/`。目前僅完成本機 preview、QA 報告與 AI agent 審核分級，不代表後台已保存或測試網已上架。

## 目前產出

- 產品頁總數：248
- 已找到規格模組候選：242
- 無規格候選：6
- Overlay 狀態：
  - inserted：191
  - inserted-before-application：38
  - needs-review-unknown-module：13
  - no-spec-module：6
- QA 狀態：
  - pass：6
  - warn：236
  - fail：0
  - no-spec-module：6
- AI agent 審核：
  - 預設由 AI agent 完成結構、來源與可用性審核。
  - 人工只處理例外：官方來源無法取得、來源互相衝突、後台限制無法由本機內容解決、或是否省略某類頁面的商業決策。

## QA 主要警告

- 目前多數頁面仍有 `spec_cta_missing_or_outside_block`：規格模組本體尚未完整銜接詢問 CTA。這是 AI agent 後續優化重點，不應直接視為可上架完成。
- 部分表格表頭可能缺單位或仍需 AI agent 比對原廠欄位。
- `needs-review-unknown-module` 頁面存在無法安全自動歸類的模組標題，需要 AI agent 先判定是否改名或保留。

## 無規格候選頁

| ID | 頁面 | 分類 |
| --- | --- | --- |
| 241 | 測試-ACS硬體分類 | ACS 控制器 / 驅動器 |
| 253 | 軟體-1 | ACS 控制器 / 驅動器 / ACS 軟體 |
| 254 | 軟體-2 | ACS 控制器 / 驅動器 / ACS 軟體 |
| 255 | 軟體-3 | ACS 控制器 / 驅動器 / ACS 軟體 |
| 268 | ACS 特點說明 | ACS 控制器 / 驅動器 |
| 269 | ACS 教育訓練影片 | ACS 控制器 / 驅動器 / ACS 教育訓練影片 |

以上頁面不自動補寫規格，以免編造資料。

## 未知模組標題待 AI Agent 審查

| ID | 頁面 | 待判定標題 |
| --- | --- | --- |
| 80 | Novanta IMS Mdrive 微步進驅動器 | MForce 產品型號總覽 |
| 101 | Karl Klein鼓風機 | 低壓工業鼓風機系列 / 中壓工業鼓風機系列 |
| 152 | SEJINIGB 模組化齒圈轉台 | 規格與性能參數 (Specifications) |
| 173 | CMCO 升降器 | 蝸輪絲桿升降機系列 / 電動推桿系列 |
| 199 | KDU | 型號規格詳情 |
| 202 | HPGP/HPG系列 行星減速機 | 全系列產品陣容 |
| 218 | 奈米精度對位定位平台 | 產品核心規格 (Standard Specifications) |
| 226 | 單軸線馬模組 | 重點應用場景 |
| 273 | SHA | 產業應用範疇 |
| 349 | 線纜煞車控制器 RTM X42.BC | 系統模組規格 (Modules) |
| 352 | 軟體開發與模擬套件 | 行業應用實例 |
| 354 | Xenus 驅動器 | Xenus Plus 系列 |
| 388 | Novanta IMS MDrive 線性執行器 | 線性執行器系列選型 |

## 第一優先類別狀態

| 類別 | 頁數 | 狀態 |
| --- | ---: | --- |
| 電動缸 | 20 | 本機已插入；QA 全數 warn，主要待補 CTA 與部分資料審查 |
| 驅動器 | 30 | 24 warn、6 no-spec-module；需先處理 ACS 軟體/測試類缺口 |
| 各類馬達 | 19 | 19 warn；需逐品牌確認下載與 CTA |
| ACS 控制器 / 驅動器 | 併入驅動器統計 | 軟體與教育訓練頁不自動補規格 |
| Harmonic Drive 減速機 | 30 | 1 pass、29 warn；部分頁需人工判定模組標題 |
| Renishaw 回授元件 | 43 | 43 warn；需逐頁比對原廠欄位與 CTA |
| 定位平台 | 17 | 1 pass、16 warn；部分頁需人工判定模組標題 |
| 空氣軸承 / 滾珠・滾柱軸承 | 17 | 17 warn；需逐頁確認原廠欄位與下載分類 |

## 後續審核流程

1. 先選一個品牌或產品系列，在本機 preview 完成樣板定稿。
2. 用 `product-spec-module-qa.html` 檢查是否仍有阻塞或警告。
3. 由 AI agent 確認規格欄位與下載對應；只有無法取得來源或來源衝突才升級人工例外。
4. 批次套用同品牌或同產品系列。
5. 才進入後台保存與測試網驗收。
