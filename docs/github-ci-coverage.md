# GitHub CI Coverage

This document records the minimum CI coverage required before a product-page
optimization branch is considered ready for AI review or PR handoff.

## Trigger Scope

The `Preview QA` GitHub Actions workflow must run on:

- `main`
- `phase-*`
- `source-audit-*`
- Pull requests targeting the same branch families
- Manual `workflow_dispatch`

This keeps category-level optimization branches and source-audit branches under
the same validation gate as `main`.

## Required Validation

Every CI run must execute:

```powershell
npm run validate:strict
```

The strict validation chain covers:

- document/report readability
- static site structure
- local mirror readiness
- customer-facing text safety
- product standardization review
- product spec module validation
- download affordance validation
- product page structure and SEO checks
- source-needed audit
- optimization backlog generation
- GitHub issue and PR index generation
- GitHub bootstrap readiness
- deployment readiness audit
- GPT optimization completion audit

## Required Artifacts

The workflow must upload report artifacts from nested report directories:

```text
site/reports/**/*.html
site/reports/**/*.json
site/reports/**/*.md
```

This is required because several evidence packages now live below nested
directories such as `site/reports/github-issues/` and
`site/reports/github-prs/`.

## Local Preflight Before Push

Before pushing a branch, run:

```powershell
npm run qa:visual-sample
npm run validate:strict
```

If either command fails, fix the local preview or validation script before
opening or updating a PR.

## Current External Limitation

GitHub issue and PR creation still require a temporary `GITHUB_TOKEN` in the
local shell. Without that token, the repo can generate local issue and PR draft
reports, but cannot create remote GitHub issues or pull requests through the
API.
