# SANYO DENKI Source Audit

Updated: 2026-07-06

Scope: Taiwan Servo local preview product pages `194`, `195`, and `270`.

This audit records official SANYO DENKI evidence used to move these pages out of `agent-source-needed`. It does not authorize backend save, CKFinder upload, test-site publication, or invented specifications.

## Policy

- Use only official SANYO DENKI product pages, catalog pages, manual/download pages, or official catalog-list entries.
- Preserve the official product family classification where detailed model tables are not publicly exposed.
- Do not create hidden assumptions for model-level specifications. Missing model details remain omitted or source-scoped.
- If large files or login-gated manuals are involved, link to the official manufacturer page instead of uploading duplicate files.

## Page Evidence

| Product ID | Local title | Official match | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 194 | 山洋電氣 SANUPS電源系統 | SANUPS Power Systems | `source-found-summary-approved` | SANUPS product site: https://products.sanyodenki.com/en/sanups/ ; SANUPS Download / Manual: https://products.sanyodenki.com/info/download/en/sanups/ ; SANYO DENKI Catalog Site: https://publish.sanyodenki.com/library/site/en/book-lists/ | Visible module uses official SANUPS classifications: Power Conditioner, UPS Hybrid, UPS Double Conversion Online, Power Management Products, and Inverter. |
| 195 | 山洋電氣 SANMOTION伺服系統 | SANMOTION Servo Systems | `source-found-summary-approved` | SANMOTION product site: https://products.sanyodenki.com/en/sanmotion/ ; SANMOTION Catalogs: https://sanyodenki.com/america/products/sanmotion/catalogs.html ; SANMOTION Manuals: https://products.sanyodenki.com/info/download/en/sanmotion/manuals/ | Visible module separates AC Servo, DC Servo, Stepping Systems, Motion Controller, and related software/manual/catalog entries. |
| 270 | 山洋電氣 SANYO DENKI 馬達相關 | SANMOTION motor-related catalogs | `source-found-catalog-index-approved` | SANYO DENKI Catalog Site: https://publish.sanyodenki.com/library/site/en/book-lists/ ; SANMOTION product site: https://products.sanyodenki.com/en/sanmotion/ | Visible module uses source-backed catalog index rows for SANMOTION G, SANMOTION R, SANMOTION G 48 VDC, SANMOTION F5, and SANMOTION C S300. |

## Validation Evidence

- `node tools/apply-sanyo-source-audit-modules.mjs`
- `node tools/validate-product-spec-modules.mjs`
- `node tools/validate-product-page-structure-seo.mjs`
- `node tools/generate-product-spec-agent-review.mjs`

Current local report result after this audit:

- `agent-approved-clean`: 239 pages
- `agent-source-needed`: 9 pages
- `agent-fix-required`: 0 pages
- SANYO DENKI pages `194`, `195`, and `270`: all `agent-approved-clean`

## Remaining Risks

- Some SANYO DENKI manuals may be login-gated or file-size-sensitive. The visible modules therefore link to official product/catalog/manual pages rather than duplicating manufacturer files.
- The module intentionally avoids model-level values not exposed in official summary sources.
