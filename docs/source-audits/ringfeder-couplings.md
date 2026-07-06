# RINGFEDER Couplings Source Audit

Updated: 2026-07-06

Scope: Taiwan Servo local preview product pages `208`, `209`, `210`, `211`, `212`, `213`, `215`, `335`, and `336`.

This audit only records official manufacturer evidence for pages currently marked `agent-source-needed`. It does not approve invented specifications and does not authorize backend save, CKFinder upload, or test-site publication.

## Policy

- Use only official RINGFEDER product pages, product papers, tech papers, instruction manuals, or official download-center entries.
- If exact table fields are not available from official sources, keep the page in `source-needed` or mark the missing fields as `source-needed`.
- If a public file is large or server upload is unreliable, prefer an official manufacturer page or official document URL and mark it `external-source`.
- Visible brand spelling should use `RINGFEDER` when content is edited from source-backed evidence. Existing page title typos are not changed by this audit.

## Page Evidence

| Product ID | Local title | Official match | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 208 | RINGFEDER 波紋管聯軸器 | Metal Bellows Couplings GWB / GWB AKN | `source-found` | Official product page: https://www.ringfeder.com/products/metal-bellows-couplings/gwb-akn/ ; product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-metal-bellows-couplings-gwb-en.pdf ; tech paper: https://www.ringfeder.com/globalassets/downloads/tech-paper/couplings/metal-bellows-couplings-gwb/tech-paper-ringfeder-metal-bellows-couplings-gwb-akn-en.pdf | Product page exposes metric/inch technical data and downloads. Suitable for a true spec table after field mapping. |
| 209 | RINFEDER 鋼片式聯軸器TND系列 | Steel Disc Couplings TND | `source-found` | Official product page: https://www.ringfeder.com/products/steel-disc-couplings/ ; product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-steel-disc-couplings-tnd-en.pdf | Page title has a visible `RINFEDER` typo in current preview; source-backed spelling is `RINGFEDER`. |
| 210 | RINFEDER齒輪聯軸器TNZ系列 | Gear Couplings TNZ | `source-found` | Official product page example: https://www.ringfeder.com/products/gear-couplings/tnz-zcaz-zcbz/ ; product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-gear-couplings-tnz-en.pdf | Use TNZ product family fields only where the official source exposes them. |
| 211 | RINFEDER筒形聯軸器TNK系列 | Barrel Couplings TNK | `source-found` | Official product page: https://www.ringfeder.com/products/barrel-couplings/ ; product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-barrel-couplings-tnk-en.pdf ; tech paper: https://www.ringfeder.com/globalassets/downloads/tech-paper/couplings/barrel-couplings-tnk/tech-paper-ringfeder-barrel-couplings-tnk-tkvo-en.pdf | Suitable for source-backed product series and document index. |
| 212 | RINFEDER法蘭聯軸器TNF系列 | Flange Couplings TNF | `source-found` | Official product page: https://www.ringfeder.com/products/flange-couplings/ | Product page exposes TNF 5571 summary fields and a Product Paper TNF download link. Exact PDF URL should be resolved before final module approval. |
| 213 | RINFEDER撓性聯軸器TNR系列 | Torsional Highflex Couplings TNR | `source-found` | Official product page: https://www.ringfeder.com/products/torsional-highflex-couplings/tnr-2424.1/ ; product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-torsional-highflex-couplings-tnr-en.pdf | TNR has multiple subseries. Keep model/series naming aligned with official page/PDF. |
| 215 | RINGFEDER 摩擦彈簧 | Friction Springs | `source-found-category-mismatch` | Official product page: https://www.ringfeder.com/products/friction-springs/ ; damping technology product paper: https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-damping-technology-en.pdf | Official source classifies friction springs under damping components, not couplings. Keep category mismatch visible in review before content changes. |
| 335 | Ringfeder RLP & RLB 彈性插銷聯軸器 | Pin & Bush Couplings RLP / RLB | `partial-source-found` | Official RLP product page: https://www.ringfeder.com/products/pin-and-bush-couplings/rlp/ ; RLB instruction manual: https://www.ringfeder.com/globalassets/downloads/instructions/pin--bush-couplings-rlp--rlb/installation-and-operations-manual-ringfeder-pin-and-bush-couplings-rlb-en.pdf | RLP source is confirmed. RLB source/table and product paper still need exact official source before full approval. |
| 336 | Ringfeder RLT 輪胎聯軸器 (Tyre Couplings) | Tyre Couplings RLT / RLU | `partial-source-found` | Official family page: https://www.ringfeder.com/products/tyre-couplings/ ; RLT page: https://www.ringfeder.com/products/tyre-couplings/rlt/ ; RLU page: https://www.ringfeder.com/products/tyre-couplings/rlu/ | Official pages expose RLT/RLU summary fields and download entries. Exact tech paper URLs should be resolved before full approval. |

## Recommended Next Actions

1. Use this audit to replace generic `source-needed` reasons with source-backed remediation for the 9 RINGFEDER pages.
2. For `208`, `209`, `210`, `211`, `213`, build or revise `產品規格詳情` from official product pages/PDF fields.
3. For `212`, `335`, and `336`, resolve exact official PDF URLs or keep the affected download fields as `source-needed`.
4. For `215`, decide whether to keep the product under the current Taiwan Servo category or flag category mismatch for later information architecture cleanup.
5. Rerun `npm run validate` after any visible module changes; this source audit alone should not move pages to `agent-approved-clean`.
