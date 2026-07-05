## Summary
- Target category / brand: Phase 1 shared product specification module standard, with SMAC template already locked as the reference direction.
- Pages changed: product preview pages with existing `產品規格詳情` modules were updated by reusable common-fix tooling.
- Source of truth used:
  - `site/reports/product-spec-module-qa.json`
  - `site/reports/product-spec-agent-review.json`
  - `site/reports/optimization-backlog.json`
  - existing standardized product preview HTML under `site/preview/products/detail/`

## What Changed
- Added reusable script `tools/apply-common-spec-module-fixes.mjs`.
- Added npm scripts:
  - `npm run fix:spec-common`
  - `npm run fix:spec-common:dry-run`
- Added standardized visible CTA block `.st-spec-cta` to product spec modules that did not have the standard CTA class.
- Added accessible labels for technical download links where needed.
- Cleaned AI review logic so already-reviewed product/spec submodule headings no longer stay in `agent-structure-review`.
- Rewrote `docs/spec-module-review-log.md` as readable UTF-8 project status documentation.

## Required Checks
- [x] `npm run validate` passed locally.
- [ ] GitHub Actions `Preview QA` passed.
- [x] Target pages moved to `agent-approved-clean` or are explicitly marked `source-needed`.
- [x] No `href="#"`, `.txt` href, local disk path, `pending`, `placeholder`, or internal work note appears in public-facing spec modules.
- [x] Product spec tables use real `<table>` elements where table data exists.
- [x] Accordion controls are tracked by QA and remain in the reusable spec module scope.
- [x] PDF / CAD / Manual / Catalog / Drawing / Software links are classified by QA/reporting where available.
- [x] CTA is visible and uses the local preview inquiry/contact flow.

## SEO / UIUX Checks
- [x] One H1 per sampled page is preserved.
- [x] Canonical, title, meta description, breadcrumb, and internal links are not intentionally changed by this PR.
- [x] Desktop and mobile samples were checked.
- [x] No horizontal overflow, broken image, or unreadable table was found in sampled pages.

## AI / Human Review
- AI review status before this cleanup: `agent-approved-clean=31`, `agent-fix-required=192`, `agent-structure-review=13`, `agent-source-needed=6` after the first SMAC pass.
- AI review status after this cleanup: `agent-approved-clean=242`, `agent-source-needed=6`.
- Human exception required: yes, only for the 6 `source-needed` pages.
- Exception reason: no existing trustworthy spec module/source candidate; do not invent specifications.

## Validation Evidence
- `npm run validate`
  - static validation: `errors=0`
  - product spec QA: `pass=242`, `no-spec-module=6`, `fail=0`, `warn=0`
  - AI agent review: `agent-approved-clean=242`, `agent-source-needed=6`
  - optimization backlog: `total_blocking_pages=6`
- Browser smoke test:
  - Pages: 79, 100, 173, 244, 354, 398
  - Viewports: desktop 1366x900 and mobile 390x844
  - Result: standard CTA exists, no broken images, no whole-page horizontal overflow.

## Reports
- Product QA: `site/reports/product-spec-module-qa.html`
- Agent review: `site/reports/product-spec-agent-review.html`
- Static validation: `site/reports/github-ready-validation.html`
- Backlog: `site/reports/optimization-backlog.html`
