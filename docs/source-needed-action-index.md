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

- Total source-needed pages: 12
- Official source audit queue: 6
- Non-standard product/spec exceptions: 6
- RINGFEDER pages resolved in this branch: 208, 209, 210, 211, 212, 213, 335, 336.
- RINGFEDER page still unresolved: 215, because official source classifies it as friction springs / damping technology rather than a coupling family.

## Official Source Audit Queue

These pages can be handled by AI agent source research. The agent must find official manufacturer evidence before creating or revising the `產品規格詳情` module.

| ID | Page | Category | Required source work | Suggested branch |
| --- | --- | --- | --- | --- |
| 102 | JVL整合型伺服馬達及步進馬達的特色 | 各類馬達 / 步進馬達 | Find official JVL product/family pages or PDFs and decide whether the page is a feature overview or a comparable product series page. | `source-audit-jvl-motors` |
| 149 | Thomson 減速機 | 空氣軸承 / 滾珠•滾柱軸承 / Thomson | Find official Thomson/Nook equivalent source for reducer specifications, or keep as source-needed if the Taiwan Servo page is only a category bridge. | `source-audit-thomson-reducers` |
| 194 | 山洋電氣 SANUPS電源系統 | 山洋電氣 SANYO DENKI | Find official SANUPS series/product pages and public datasheets. Build only source-backed fields. | `source-audit-sanyo-denki` |
| 195 | 山洋電氣 SANMOTION伺服系統 | 山洋電氣 SANYO DENKI | Find official SANMOTION series/product pages and public datasheets. Separate amplifier, motor, and controller downloads. | `source-audit-sanyo-denki` |
| 215 | RINGFEDER 摩擦彈簧 | 聯軸器 | Decide whether to keep this page under couplings or move/reframe it as damping technology. Official source: https://www.ringfeder.com/products/friction-springs/ | `source-audit-ringfeder-couplings` |
| 270 | 山洋電氣 SANYO DENKI 馬達相關 | 各類馬達 / 山洋電氣 Sanyo denki | Find official SANYO DENKI motor family pages and decide whether this is a category overview rather than a spec table page. | `source-audit-sanyo-denki` |

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

## Source Audit Progress

### RINGFEDER Couplings

- Branch: `source-audit-ringfeder-couplings`
- Evidence package: `docs/source-audits/ringfeder-couplings.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-couplings.json`
- Covered pages: `208`, `209`, `210`, `211`, `212`, `213`, `215`, `335`, `336`
- Current result:
  - `agent-approved-clean`: 208, 209, 210, 211, 212, 213, 335, 336
  - `agent-source-needed`: 215
- Validation evidence: `npm run validate` passes; `site/reports/product-spec-agent-review.json` reports 236 `agent-approved-clean` pages and 12 `agent-source-needed` pages.

## Next Agent Steps

1. Resolve page 215 category/content decision before changing the visible module.
2. Continue with `source-audit-sanyo-denki`, because it covers 194, 195, and 270.
3. Continue with `source-audit-jvl-motors` for 102.
4. Continue with `source-audit-thomson-reducers` for 149.
5. Keep 241, 253, 254, 255, 268, and 269 as non-standard exceptions until a separate schema is approved.
