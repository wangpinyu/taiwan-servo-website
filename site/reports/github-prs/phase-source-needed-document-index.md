## Summary
- Target category / brand: cross-category source-needed official document index cleanup.
- Branch: `phase-source-needed-document-index`
- Base recommendation: use `phase-1-smac-spec-standard` as PR base until phase 1 is merged into `main`; after phase 1 merges, rebase this branch onto `main`.
- Pages checked: 5
- Source of truth used:
  - `site/reports/source-needed-audit.json`
  - `site/reports/product-spec-agent-review.json`
  - `site/reports/product-spec-module-qa.json`
  - local preview HTML under `site/preview/products/detail/`

## Target Pages
- Status after fix: `agent-approved-clean=5`
- IDs: 102, 149, 194, 195, 270
- Scope: convert remaining general product `official-source-needed` pages into customer-facing official document index modules without inventing specifications.

## Required Checks
- [x] `npm run validate` passed on this branch.
- [ ] GitHub Actions `Preview QA` passed.
- [x] Target pages have a standardized `產品規格詳情` block.
- [x] Target spec modules use real `<table>` elements.
- [x] Target spec modules include `details` with visible `展開 / 收合` text.
- [x] Target spec modules include real PDF/document links and `詢問規格 / Quote` CTA.
- [x] No `href="#"`, `.txt` href, local disk path, `pending`, `placeholder`, `data-original-url`, `data-file-key`, or internal work note appears in target spec modules.
- [x] Source gaps are not auto-filled with guessed specifications.

## Static Smoke Test
- Method: targeted static inspection of the five edited product pages after `npm run validate`.
- Pages: 102, 149, 194, 195, 270.
- Checks per page:
  - standardized spec module exists.
  - one `<details>` block exists.
  - one `<table>` exists.
  - a real PDF/document link exists.
  - no internal placeholder/data attributes are present.
- Result: 25 checks, 0 failures.
- Evidence JSON: `site/reports/github-prs/phase-source-needed-document-index-smoke.json`.

## AI / Human Review
- AI review status: the five edited pages moved to `agent-approved-clean`.
- Human exception required: remaining 6 `agent-source-needed` pages are not general product specification pages and should not be forced into spec tables without a separate content decision.

## Reports
- Product QA: `site/reports/product-spec-module-qa.html`
- Agent review: `site/reports/product-spec-agent-review.html`
- Source-needed audit: `site/reports/source-needed-audit.html`
- Static validation: `site/reports/github-ready-validation.html`
- Backlog: `site/reports/optimization-backlog.html`
