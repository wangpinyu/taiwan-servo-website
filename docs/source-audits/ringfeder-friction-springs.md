# RINGFEDER Friction Springs Source Audit

Updated: 2026-07-06

## Scope

- Product page: `site/preview/products/detail/215.html`
- Product ID: 215
- Title: RINGFEDER 摩擦彈簧
- Branch: `source-audit-ringfeder-friction-springs`
- Local action: replace the previous document-only / source-needed module with a source-backed `產品規格詳情` module.

## Official Sources

1. RINGFEDER official product page: <https://www.ringfeder.com/products/friction-springs/>
2. RINGFEDER Product Paper: <https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-damping-technology-en.pdf>

## Evidence Used

- Official product page identifies Friction Springs as maintenance-free safety components for absorbing sudden forces and kinetic energy.
- Official product page states product characteristics including 66% standard damping, possible 33% to 66% damping with other lubricants, independence from load speed, overload-safety in block position, -20 °C to +60 °C standard range, maintenance-free operation, and parallel / serial arrangements.
- Official product page provides structure formulas:
  - `Lo = e x he`
  - `s = e x se`
  - `W = e x We`
  - end force does not change with number of elements.
- Official product page and Product Paper provide selection / installation rules: pretensioning, guiding, lubrication, diagram interpretation, and sealing against dirt and moisture.
- Product Paper provides the type table fields used in the module:
  - `Type`
  - `Type old`
  - `F (kN)`
  - `se (mm)`
  - `We (Joule)`
  - `he (mm)`
  - `D1 (mm)`
  - `d1 (mm)`
  - `Gwe (kg)`

## Implementation Notes

- The page is treated as a damping technology / friction-spring product, not as a standard shaft coupling page.
- The module includes a true HTML table for the official model list.
- The module includes source-backed characteristic and design-condition tables.
- The module links to official product page and official PDF instead of uploading or mirroring large source files.
- Unsupported values were not invented.
- No backend save, CKFinder upload, test-site publish, or production change was performed.

## Current Result

- `product-spec-module-qa`: pass
- `product-page-structure-seo-qa`: pass
- `product-spec-agent-review`: `agent-approved-clean`
- Remaining source-needed status for this page: none.
