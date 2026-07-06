# Source-needed Action Index

Updated: 2026-07-06

This file turns the current `source-needed` audit into executable follow-up work. It does not approve invented specifications. A page can move out of `source-needed` only when an AI agent can point to official manufacturer pages, official PDF tables, or an existing verified local source package.

## Policy

- Do not invent product specifications.
- Keep unsupported fields as `—`, `原廠未公開`, or `請洽星泰`.
- Keep software, training, test, and informational pages out of the standard product specification table unless a separate content model is approved.
- If official downloads are too large or server upload is unreliable, link to the official manufacturer download page or official document URL and mark `external-source`.
- Backend upload/save is out of scope for this index. This is for local preview and GitHub workflow preparation only.

## Summary

- Total source-needed pages: 20
- Official source audit queue: 14
- Non-standard product/spec exceptions: 6

## Official Source Audit Queue

These pages can be handled by AI agent source research. The agent must find official manufacturer evidence before creating or revising the `產品規格詳情` module.

| ID | Page | Category | Required source work | Suggested branch |
| --- | --- | --- | --- | --- |
| 102 | JVL整合型伺服馬達及步進馬達的特色 | 各類馬達 / 步進馬達 | Find official JVL product/family pages or PDFs and decide whether the page is a feature overview or a comparable product series page. | `source-audit-jvl-motors` |
| 149 | Thomson 減速機 | 空氣軸承 / 滾珠・滾柱軸承 / Thomson | Find official Thomson/Nook equivalent source for reducer specifications, or keep as source-needed if the Taiwan Servo page is only a category bridge. | `source-audit-thomson-reducers` |
| 194 | 山洋電氣 SANUPS電源系統 | 山洋電氣 SANYO DENKI | Find official SANUPS series/product pages and public datasheets. Build only source-backed fields. | `source-audit-sanyo-denki` |
| 195 | 山洋電氣 SANMOTION伺服系統 | 山洋電氣 SANYO DENKI | Find official SANMOTION series/product pages and public datasheets. Separate amplifier, motor, and controller downloads. | `source-audit-sanyo-denki` |
| 208 | RINGFEDER 波紋管聯軸器 | 聯軸器 | Find official RINGFEDER bellows coupling pages/catalogs and map public series names before adding tables. | `source-audit-ringfeder-couplings` |
| 209 | RINFEDER 鋼片式聯軸器TND系列 | 聯軸器 | Verify official spelling and TND series source. Correct visible brand typo only when source-backed and approved for content edits. | `source-audit-ringfeder-couplings` |
| 210 | RINFEDER齒輪聯軸器TNZ系列 | 聯軸器 | Verify official TNZ gear coupling source and field names. | `source-audit-ringfeder-couplings` |
| 211 | RINFEDER筒形聯軸器TNK系列 | 聯軸器 | Verify official TNK barrel coupling source and field names. | `source-audit-ringfeder-couplings` |
| 212 | RINFEDER法蘭聯軸器TNF系列 | 聯軸器 | Verify official TNF flange coupling source and field names. | `source-audit-ringfeder-couplings` |
| 213 | RINFEDER撓性聯軸器TNR系列 | 聯軸器 | Verify official TNR flexible coupling source and field names. | `source-audit-ringfeder-couplings` |
| 215 | RINGFEDER 摩擦彈簧 | 聯軸器 | Find official friction spring source. If the product family is not a coupling, note category mismatch separately. | `source-audit-ringfeder-couplings` |
| 270 | 山洋電氣 SANYO DENKI 馬達相關 | 各類馬達 / 山洋電氣 | Find official SANYO DENKI motor family pages and decide whether this is a category overview rather than a spec table page. | `source-audit-sanyo-denki` |
| 335 | Ringfeder RLP & RLB 彈性插銷聯軸器 | 聯軸器 | Find official RLP/RLB source tables and downloads. | `source-audit-ringfeder-couplings` |
| 336 | Ringfeder RLT 輪胎聯軸器 (Tyre Couplings) | 聯軸器 | Find official RLT tyre coupling source tables and downloads. | `source-audit-ringfeder-couplings` |

## Non-standard Exceptions

These should not be forced into the standard `產品規格詳情` module without a separate content decision.

| ID | Page | Disposition | Handling |
| --- | --- | --- | --- |
| 241 | 測試-ACS硬體分類 | `exclude-test-page` | Treat as a test/admin remnant. Do not create a public-facing spec module unless the page is confirmed as real. |
| 253 | 軟體-1 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 254 | 軟體-2 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 255 | 軟體-3 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 268 | ACS 特點說明 | `informational-source-needed` | Treat as an ACS feature/information page. Build structured content only after the page role is approved. |
| 269 | ACS 教育訓練影片 | `training-content-no-spec` | Training/video content should use a training resource schema, not product specifications. |

## Next Agent Steps

1. Start with `source-audit-ringfeder-couplings`, because it covers 9 of the 14 official-source pages.
2. Use only official RINGFEDER, Thomson, JVL, and SANYO DENKI sources.
3. For each page, produce a small evidence package: source URLs, matched product family, available fields, missing fields, download links, and whether the page can receive `產品規格詳情`.
4. Update the local preview and rerun `npm run validate`.
5. Only move pages to `agent-approved-clean` when the visible module, downloads, CTA, mobile table behavior, and source traceability are verified.

## Source Audit Progress

### RINGFEDER Couplings

- Branch: `source-audit-ringfeder-couplings`
- Evidence package: `docs/source-audits/ringfeder-couplings.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-couplings.json`
- Covered pages: `208`, `209`, `210`, `211`, `212`, `213`, `215`, `335`, `336`
- Current result:
  - `source-found`: 208, 209, 210, 211, 212, 213
  - `source-found-category-mismatch`: 215
  - `partial-source-found`: 335, 336
- Important: this source audit is evidence only. These pages should remain `agent-source-needed` until their visible `產品規格詳情` modules are revised and validated from the official fields/downloads.
