# 產品規格詳情模組審核紀錄

Updated: 2026-07-06

This log tracks local-preview and GitHub workflow status for the Taiwan Servo product specification modules. It does not authorize backend save, CKFinder upload, test-site publication, or production deployment.

## Current Summary

- Product pages: 248
- `agent-approved-clean`: 242
- `agent-approved-exception`: 6
- `agent-source-needed`: 0
- `agent-fix-required`: 0
- `agent-structure-review`: 0
- Critical failures: 0
- Current official-source audit queue: 0

Authoritative reports:

- `site/reports/product-spec-agent-review.json`
- `site/reports/product-spec-module-qa.json`
- `site/reports/product-page-structure-seo-qa.json`
- `site/reports/product-seo-warning-taxonomy.json`
- `site/reports/visual-sample-qa.json`
- `site/reports/source-needed-audit.json`
- `site/reports/gpt-optimization-completion-audit.json`

## Review Status Definitions

| Status | Meaning | Next step |
| --- | --- | --- |
| `agent-approved-clean` | The local preview page passed product-spec QA and product page SEO/structure QA without critical or warning items. | Eligible for branch / PR review and later backend deployment planning. |
| `agent-fix-required` | The AI agent can fix the page locally, such as CTA, accordion accessibility, table structure, or visible internal-note cleanup. | Fix in the relevant phase branch and rerun `npm run validate`. |
| `agent-source-needed` | The page lacks verified source material, lacks a usable spec module, or is a non-standard page that should not be forced into the hardware spec schema. | Perform official source audit or keep as exception until a schema/content decision is approved. |

## Source-needed Action Index

- Action index: `docs/source-needed-action-index.md`
- Machine-readable index: `docs/source-needed-action-index.json`
- Current unresolved source-needed scope: 0 pages.
- AI source audit queue: 0 hardware pages.
- AI-approved non-standard exceptions: 6 ACS test/software/informational/training pages that should not be forced into the hardware `產品規格詳情` schema.

## Completed Source Audit Progress

### RINGFEDER Couplings

- Branch: `source-audit-ringfeder-couplings`
- Evidence package: `docs/source-audits/ringfeder-couplings.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-couplings.json`
- Covered pages: 208, 209, 210, 211, 212, 213, 335, 336
- Current source status:
  - `agent-approved-clean`: 208, 209, 210, 211, 212, 213, 335, 336
  - `agent-source-needed`: none

### RINGFEDER Friction Springs

- Branch: `source-audit-ringfeder-friction-springs`
- Evidence package: `docs/source-audits/ringfeder-friction-springs.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-friction-springs.json`
- Covered pages: 215
- Current source status:
  - `agent-approved-clean`: 215
  - `agent-source-needed`: none
- Review rule: keep the page framed as a friction-spring / damping-technology page. Do not force it into a shaft coupling comparison table.

### SANYO DENKI

- Branch: `source-audit-sanyo-denki`
- Evidence package: `docs/source-audits/sanyo-denki.md`
- Machine-readable evidence: `docs/source-audits/sanyo-denki.json`
- Covered pages: 194, 195, 270
- Current source status:
  - `agent-approved-clean`: 194, 195, 270
  - `agent-source-needed`: none in SANYO DENKI
- Review rule: keep official source-page links for login-gated or large manufacturer files. Do not duplicate large files into local modules unless a later deployment phase explicitly requires it.

### JVL Motors

- Branch: `source-audit-jvl-motors`
- Evidence package: `docs/source-audits/jvl-motors.md`
- Machine-readable evidence: `docs/source-audits/jvl-motors.json`
- Covered pages: 102
- Current source status:
  - `agent-approved-clean`: 102
  - `agent-source-needed`: none in JVL
- Review rule: keep MAC, MIS / ServoStep, and SMC controller data separated and preserve the original JVL units.

### Thomson Reducers

- Branch: `source-audit-thomson-reducers`
- Evidence package: `docs/source-audits/thomson-reducers.md`
- Machine-readable evidence: `docs/source-audits/thomson-reducers.json`
- Covered pages: 149
- Current source status:
  - `agent-approved-clean`: 149
  - `agent-source-needed`: none in Thomson
- Review rule: AquaTRUE values stay source-backed to Thomson / Boston Gear official sources. Keep unsupported model-level values out of the table.

## Remaining Source-needed Pages

### Official Source Audit Queue

None.

### AI-approved Non-standard Exceptions

| ID | Page | Handling |
| --- | --- | --- |
| 241 | 測試-ACS硬體分類 | Test/admin remnant; do not create public spec module unless confirmed as real. |
| 253 | 軟體-1 | Needs software-page schema, not hardware spec schema. |
| 254 | 軟體-2 | Needs software-page schema, not hardware spec schema. |
| 255 | 軟體-3 | Needs software-page schema, not hardware spec schema. |
| 268 | ACS 特點說明 | Needs informational/feature-page schema decision. |
| 269 | ACS 教育訓練影片 | Needs training-resource schema, not product specifications. |

## Common Cleanup Progress

- Existing `產品規格詳情` modules include a standard inquiry CTA when a CTA was missing.
- Visible backend/developer wording was cleaned from affected preview modules.
- `data-local-file`, `.txt` hrefs, local disk paths, and visible `pending/placeholder` wording are blocked by QA.
- Product specification tables use real `<table>` markup with visible headers, units where source-backed, and mobile horizontal scrolling.

## Validation Commands

```powershell
npm run validate
npm run fix:spec-common:dry-run
npm run github:bootstrap:dry-run
npm run github:bootstrap:smoke:dry-run
npm run qa:visual-sample
```

Latest expected local validation after the RINGFEDER friction-springs and exception-status audit:

- `product-spec-module-qa`: 242 pass / 6 no-spec-module / 0 fail / 0 warn
- `product-page-structure-seo-qa`: 242 pass / 6 no-spec-module / 0 fail / 0 warn
- `product-seo-warning-taxonomy`: 0 warning entries
- `product-spec-agent-review`: 242 `agent-approved-clean` / 6 `agent-approved-exception` / 0 `agent-source-needed` / 0 `agent-fix-required`
- `source-needed-audit`: 0 source-needed pages / 6 approved exceptions
- `optimization-backlog`: 0 blocking pages
- `visual-sample-qa`: 18 checks / 18 pass / 0 fail / 0 warn
- `gpt-optimization-completion-audit`: 11 complete / 1 external-action-required / 1 not-in-current-stage / 0 incomplete
