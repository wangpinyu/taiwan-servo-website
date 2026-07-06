# JVL Motors Source Audit

Updated: 2026-07-06

Scope: Taiwan Servo local preview product page `102`.

This audit records official JVL evidence used to move page `102` out of `agent-source-needed`. It does not authorize backend save, CKFinder upload, test-site publication, or invented specifications.

## Policy

- Use only official JVL product pages or official JVL documents.
- Keep MAC, MIS / ServoStep, and SMC data separated because they are different product families.
- Preserve official units: power in W, torque in Nm, current in A, and protection class as published.
- Do not infer model-level values beyond the public JVL page tables.

## Page Evidence

| Product ID | Local title | Official match | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 102 | JVL整合型伺服馬達及步進馬達的特色 | JVL MAC integrated servo motors and ServoStep integrated stepper motors | `source-found-table-approved` | MAC page: https://www.jvl.dk/202/integrated-servomotors ; MIS / ServoStep page: https://www.jvl.dk/758/mis-motor-integrated-stepper-motors | Visible module now separates MAC servo motors, MIS integrated stepper motors, and SMC stepper motor controllers using official table fields. |

## Validation Evidence

- `node tools/apply-jvl-source-audit-modules.mjs`
- `node tools/validate-product-spec-modules.mjs`
- `node tools/validate-product-page-structure-seo.mjs`
- `node tools/generate-product-spec-agent-review.mjs`

Current local report result after this audit:

- `agent-approved-clean`: 240 pages
- `agent-source-needed`: 8 pages
- `agent-fix-required`: 0 pages
- JVL page `102`: `agent-approved-clean`

## Remaining Risks

- Some JVL brochures or manuals are large PDF files. The visible module links to official product pages and does not duplicate manufacturer files in this phase.
- The official web page exposes some selection-chart values as grouped table text; the local module keeps them as family-level ranges rather than treating every row as a guaranteed individual model specification.
