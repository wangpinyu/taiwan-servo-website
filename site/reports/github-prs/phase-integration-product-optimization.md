# Product page specification modules and SEO structure integration

Source branch: `phase-integration-product-optimization`

Target branch: `main`

## Summary

This PR prepares the current product-page optimization integration branch for review. It does not approve deployment and does not overwrite production. `main` is used only as the PR target and diff base; completion/readiness is judged from this branch and its QA reports.

## Product Spec Module QA Result

- Total pages: 248
- Pass: 242
- No spec module: 6
- Fail: 0
- Warn: 0
- Evidence: `site/reports/product-spec-module-qa.html` and `site/reports/product-spec-module-qa.json`

## Agent Review Result

- agent-approved-clean: 228
- agent-source-needed: 20
- Evidence: `site/reports/product-spec-agent-review.html` and `site/reports/product-spec-agent-review.json`

## 20 Source-needed Pages

- 102 JVL整合型伺服馬達及步進馬達的特色: official-source-needed; 原廠產品頁 / datasheet / manual / 產品系列 PDF；需判定是特色總覽或可比較系列頁。
- 149 Thomson 減速機: official-source-needed; 原廠 datasheet / catalog PDF / CAD / reducer 規格表；若無公開資料則 contact fallback。
- 194 山洋電氣 SANUPS電源系統: official-source-needed; 原廠 datasheet / catalog PDF / manual；SANUPS/SANMOTION 需分清系統、馬達、驅動器與控制器來源。
- 195 山洋電氣 SANMOTION伺服系統: official-source-needed; 原廠 datasheet / catalog PDF / manual；SANUPS/SANMOTION 需分清系統、馬達、驅動器與控制器來源。
- 208 RINGFEDER 波紋管聯軸器: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 209 RINFEDER 鋼片式聯軸器TND系列: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 210 RINFEDER齒輪聯軸器TNZ系列: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 211 RINFEDER筒形聯軸器TNK系列: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 212 RINFEDER法蘭聯軸器TNF系列: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 213 RINFEDER撓性聯軸器TNR系列: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 215 RINGFEDER 摩擦彈簧: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 241 測試-ACS硬體分類: exclude-test-page; 站方確認 / contact fallback；此頁未確認為正式產品頁前，不補技術規格。
- 253 軟體-1: software-source-needed; 原廠軟體頁 / software manual / download 或 version notes / 相容控制器資料；不足時 contact fallback。
- 254 軟體-2: software-source-needed; 原廠軟體頁 / software manual / download 或 version notes / 相容控制器資料；不足時 contact fallback。
- 255 軟體-3: software-source-needed; 原廠軟體頁 / software manual / download 或 version notes / 相容控制器資料；不足時 contact fallback。
- 268 ACS 特點說明: informational-source-needed; 原廠 feature page / datasheet / 說明文件；不足時 contact fallback。
- 269 ACS 教育訓練影片: training-content-no-spec; 原廠 training page / video source / 教育訓練資料；不套硬體規格表，必要時 contact fallback。
- 270 山洋電氣 SANYO DENKI 馬達相關: official-source-needed; 原廠 datasheet / catalog PDF / manual；SANUPS/SANMOTION 需分清系統、馬達、驅動器與控制器來源。
- 335 Ringfeder RLP & RLB 彈性插銷聯軸器: official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。
- 336 Ringfeder RLT 輪胎聯軸器 (Tyre Couplings): official-source-needed; 原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。

Full clean list: `docs/agent-source-needed-pages.md`

## 6 No-spec-module Exceptions

- 241 測試-ACS硬體分類: 測試頁 / 非正式產品頁候選; 目前依標題與分類判定為測試頁，不視為正式硬體產品頁；但必須由人工確認。若站方確認這是正式硬體頁，需改列待修，不可列為例外。
- 253 軟體-1: 軟體頁; 軟體頁，不適合套硬體產品規格詳情；需改用軟體型資料架構。
- 254 軟體-2: 軟體頁; 軟體頁，不適合套硬體產品規格詳情；需改用軟體型資料架構。
- 255 軟體-3: 軟體頁; 軟體頁，不適合套硬體產品規格詳情；需改用軟體型資料架構。
- 268 ACS 特點說明: 說明頁 / feature overview; 說明頁，不是具體硬體產品頁；若要優化，需補 ACS 特點/功能官方來源。
- 269 ACS 教育訓練影片: 教育訓練頁 / 影片內容; 教育訓練頁，不是硬體產品頁；應走訓練/影片內容模型。

Full clean list: `docs/no-spec-module-exceptions.md`

## Deployment Not Approved

- Deployment is not approved.
- Production overwrite is not approved.
- Current conclusion: `not ready for production deployment`.
- Allowed current status: `ready for PR review`.
- Pending items: 20 source-needed pages, 6 exception pages requiring human confirmation, PR review.

## Review Documents

- `docs/integration-review-summary.md`
- `docs/agent-source-needed-pages.md`
- `docs/no-spec-module-exceptions.md`
- `docs/deployment-readiness.md`
