# 產品規格詳情模組審核紀錄

Updated: 2026-07-06

This log tracks local-preview and GitHub workflow status for the Taiwan Servo product specification modules. It does not authorize backend save, CKFinder upload, test-site publication, or production deployment.

## Current Summary

- Product pages: 248
- `agent-approved-clean`: 239
- `agent-source-needed`: 9
- `agent-fix-required`: 0
- `agent-structure-review`: 0
- Critical failures: 0

Authoritative reports:

- `site/reports/product-spec-agent-review.json`
- `site/reports/product-spec-module-qa.json`
- `site/reports/product-page-structure-seo-qa.json`
- `site/reports/product-seo-warning-taxonomy.json`
- `site/reports/source-needed-audit.json`

## Review Status Definitions

| Status | Meaning | Next step |
| --- | --- | --- |
| `agent-approved-clean` | The local preview page passed product-spec QA and product page SEO/structure QA without critical or warning items. | Eligible for branch / PR review and later backend deployment planning. |
| `agent-fix-required` | The AI agent can fix the page locally, such as CTA, accordion accessibility, table structure, or visible internal-note cleanup. | Fix in the relevant phase branch and rerun `npm run validate`. |
| `agent-source-needed` | The page lacks verified source material, lacks a usable spec module, or is a non-standard page that should not be forced into the hardware spec schema. | Perform official source audit or keep as exception until a schema/content decision is approved. |

## Source-needed Action Index

- Action index: `docs/source-needed-action-index.md`
- Machine-readable index: `docs/source-needed-action-index.json`
- Current unresolved scope: 9 pages.
- AI source audit queue: 3 pages requiring official manufacturer evidence before any product specification table can be created or revised.
- Non-standard exceptions: 6 ACS test/software/informational/training pages that should not be forced into the hardware `產品規格詳情` schema without a separate content decision.

## Completed Source Audit Progress

### RINGFEDER Couplings

- Branch: `source-audit-ringfeder-couplings`
- Evidence package: `docs/source-audits/ringfeder-couplings.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-couplings.json`
- Covered pages: 208, 209, 210, 211, 212, 213, 215, 335, 336
- Current source status:
  - `agent-approved-clean`: 208, 209, 210, 211, 212, 213, 335, 336
  - `agent-source-needed`: 215
- Review rule: 215 stays unresolved until the friction-spring category/content decision is made. The other RINGFEDER pages now have source-backed visible `產品規格詳情` modules and pass validation.

### SANYO DENKI

- Branch: `source-audit-sanyo-denki`
- Evidence package: `docs/source-audits/sanyo-denki.md`
- Machine-readable evidence: `docs/source-audits/sanyo-denki.json`
- Covered pages: 194, 195, 270
- Current source status:
  - `agent-approved-clean`: 194, 195, 270
  - `agent-source-needed`: none in SANYO DENKI
- Review rule: keep official source-page links for login-gated or large manufacturer files. Do not duplicate large files into local modules unless a later deployment phase explicitly requires it.

## Remaining Source-needed Pages

### Official Source Audit Queue

| ID | Page | Category | Suggested branch |
| --- | --- | --- | --- |
| 102 | JVL整合型伺服馬達及步進馬達的特色 | 各類馬達 / 步進馬達 | `source-audit-jvl-motors` |
| 149 | Thomson 減速機 | 空氣軸承 / 滾珠•滾柱軸承 / Thomson | `source-audit-thomson-reducers` |
| 215 | RINGFEDER 摩擦彈簧 | 聯軸器 | `source-audit-ringfeder-couplings` |

### Non-standard Exceptions

| ID | Page | Handling |
| --- | --- | --- |
| 241 | 測試-ACS硬體分類 | Test/admin remnant; do not create public spec module unless confirmed as real. |
| 253 | 軟體-1 | Needs software-page schema, not hardware spec schema. |
| 254 | 軟體-2 | Needs software-page schema, not hardware spec schema. |
| 255 | 軟體-3 | Needs software-page schema, not hardware spec schema. |
| 268 | ACS 特點說明 | Needs informational/feature-page schema decision. |
| 269 | ACS 教育訓練影片 | Needs training-resource schema, not product specifications. |

## Common Cleanup Progress

- Existing `產品規格詳情` modules now include a standard inquiry CTA when a CTA was missing.
- Visible backend/developer wording was cleaned from affected preview modules.
- `data-local-file`, `data-upload-url`, `.txt` hrefs, local disk paths, and visible `pending/placeholder` wording are blocked by QA.

## Validation Commands

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
```

Latest expected local validation after the SANYO DENKI audit:

- `product-spec-module-qa`: 242 pass / 6 no-spec-module / 0 fail / 0 warn
- `product-page-structure-seo-qa`: 239 pass / 3 warn / 6 no-spec-module / 0 fail
- `product-spec-agent-review`: 239 `agent-approved-clean` / 9 `agent-source-needed` / 0 `agent-fix-required`
