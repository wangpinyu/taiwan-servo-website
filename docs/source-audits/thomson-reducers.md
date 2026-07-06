# Thomson Reducers Source Audit

Updated: 2026-07-06

Scope: Taiwan Servo local preview product page `149`.

This audit records official Thomson / Boston Gear evidence used to move page `149` out of `agent-source-needed`. It does not authorize backend save, CKFinder upload, test-site publication, or invented specifications.

## Policy

- Use only official manufacturer pages or official manufacturer PDF documents.
- Keep AquaTRUE values as family-level or frame-size-level values exactly as published.
- Do not infer unsupported ratios, torque curves, motor compatibility, stock status, price, or lead time.
- Link to official documents when manufacturer files are large or not part of this local deployment phase.

## Page Evidence

| Product ID | Local title | Official match | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 149 | Thomson 減速機 | Thomson / Micron AquaTRUE True Planetary Gearheads | `source-found-table-approved` | Thomson PDF: https://www.thomsonlinear.com/downloads/gearheads/AquaTRUE_True_Planetary_Gearheads_bren.pdf ; Boston Gear product page: https://www.bostongear.com/products/micron-true-planetary-gearheads/in-line-planetary-gearheads/aquatrue | Visible module now uses official AquaTRUE frame-size rows and feature table. |

## Applied Specification Scope

- Model/frame rows: `AQT060`, `AQT080`, `AQT120`, `AQT160`.
- Preserved fields: `Part Number`, `Stages`, `Backlash (arc-min)`, `Efficiency (%)`, `Weight (kg / lbs)`, `Ratio Availability`.
- Public feature fields: frame sizes, precision, torque capacity, ratio range, IP protection, stainless housing / NSF ANSI 169, typical applications.
- Download strategy: official AquaTRUE PDF and official AquaTRUE product page are linked directly.

## Validation Evidence

- `node tools/apply-thomson-source-audit-modules.mjs`
- `node tools/validate-product-spec-modules.mjs`
- `node tools/validate-product-page-structure-seo.mjs`
- `node tools/generate-product-spec-agent-review.mjs`

Current local report result after this audit:

- `agent-approved-clean`: 241 pages
- `agent-source-needed`: 7 pages
- `agent-fix-required`: 0 pages
- Thomson page `149`: `agent-approved-clean`

## Remaining Risks

- Some manufacturer source pages may change URLs over time; direct PDF and product-page links should be rechecked before final deployment.
- This audit does not upload or mirror the official PDF into the Taiwan Servo server; it keeps the local preview source-backed and deployment-ready for later policy decision.
