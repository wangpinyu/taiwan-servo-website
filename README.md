# Taiwan Servo Site Optimization

Private GitHub-ready workspace for Shin Tai / Taiwan Servo website frontend optimization.

This repository is designed for local preview, AI-assisted UIUX/SEO/product-page optimization, QA reporting, and later controlled deployment back to the website/backend. It is not a credential store and does not contain backend login state.

## What Is Included

- `site/` - static local mirror used for preview and optimization.
- `site/preview/` - browsable frontend pages.
- `site/assets-cache/` - frontend render assets.
- `site/documents-cache/` - same-origin product documents referenced by included pages.
- `site/reports/` - validation, standardization, deploy, and AI review reports.
- `docs/` - product page architecture, data schema, and spec-module review log.
- `tools/` - GitHub/local validation and preview tools.
- `.github/workflows/preview-qa.yml` - CI workflow for GitHub.

## What Is Excluded By Policy

The mirror excludes backend credentials and intentionally avoids treating these backend-bound sections as optimization targets:

- Contact forms / contact backend
- Video links
- Technical articles
- Recruiting
- Download center as a standalone section
- FAQ

Documents linked from included product pages may still be present under `site/documents-cache/` so local product previews can be verified.

## Local Commands

```powershell
npm run serve
npm run validate
npm run qa:mirror
```

Then open:

```text
http://127.0.0.1:8789/
```

## GitHub Setup

Use a private GitHub repository.

Recommended setup after creating the private repo on GitHub:

```powershell
git remote add origin https://github.com/<your-account>/taiwan-servo-site-optimization.git
git push -u origin main
```

Large images and documents are tracked through Git LFS via `.gitattributes`.

## Review Flow

1. Work on one brand or product series locally.
2. Run `npm run validate`.
3. Review:
   - `site/reports/product-standardization-report.html`
   - `site/reports/product-spec-module-qa.html`
   - `site/reports/product-page-structure-seo-qa.html`
   - `site/reports/product-spec-agent-review.html`
   - `site/reports/source-needed-audit.html`
   - `site/reports/docs-readability-validation.html`
   - `site/reports/github-bootstrap-readiness.html`
   - `site/reports/github-ready-validation.html`
   - `site/reports/local-mirror-readiness-current.html`
   - `site/reports/optimization-backlog.html`
4. Use AI agent review status to decide next step.
5. Only after local preview is accepted, prepare backend or server deployment.

## Pull Request Control

Regenerate the PR control table:

```powershell
npm run workflow:pr-index
```

Review the generated control page:

```text
site/reports/github-prs/index.md
```

Open PR creation pages in a browser that is already logged in to GitHub:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\open-github-pr-pages.ps1
```

Prepare one PR page and copy its Markdown body to the clipboard:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-pr.ps1 -Branch phase-1-smac-spec-standard
```

By default this opens only the phase-1 PR page. To open a specific branch:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\open-github-pr-pages.ps1 -Branch phase-3-harmonic-drive
```

To open all PR pages:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\open-github-pr-pages.ps1 -All
```

## GitHub Optimization Workflow

- Use one branch and one pull request per product category or brand.
- Keep `main` passing `npm run validate`.
- Use `.github/PULL_REQUEST_TEMPLATE.md` for every PR.
- Use `.github/labels.yml` as the label source of truth.
- Use `npm run workflow:backlog` to regenerate category-level issue drafts from AI review results.
- Use `npm run workflow:issue-index` to regenerate the issue control table after backlog changes.
- See `docs/github-optimization-workflow.md` for the complete operating rules.

## GitHub API Bootstrap

The repo can bootstrap GitHub labels, tracking issues, and pull requests without GitHub CLI.

Dry run first:

```powershell
npm run github:bootstrap:dry-run
```

Apply with a fine-grained GitHub token that has access to this private repo and permission to manage issues, labels, and pull requests:

```powershell
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap
Remove-Item Env:\GITHUB_TOKEN
```

For a smaller first pass:

```powershell
npm run github:bootstrap:smoke:dry-run
$env:GITHUB_TOKEN = "<token>"
npm run github:bootstrap:smoke
Remove-Item Env:\GITHUB_TOKEN
```

Do not commit or paste the token into files. The script only reads `GITHUB_TOKEN` / `GH_TOKEN` from the environment.

## Issue Control

Regenerate category tracking issue drafts and the issue control table:

```powershell
npm run workflow:backlog
```

Review the generated issue table:

```text
site/reports/github-issues/index.md
site/reports/github-issues/index.html
```

Prepare one GitHub issue page and copy its Markdown draft to the clipboard:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-issue.ps1 -Branch phase-1-smac-spec-standard
```

You can also select by priority:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-github-issue.ps1 -Priority 1
```

## GitHub Bootstrap Readiness

Regenerate the readiness report that checks labels, issue drafts, PR drafts, pushed branches, token availability, and remote PR refs:

```powershell
npm run workflow:github-readiness
```

Review:

```text
site/reports/github-bootstrap-readiness.html
site/reports/github-bootstrap-readiness.json
```

Status meanings:

- `ready`: GitHub bootstrap prerequisites are satisfied.
- `ready-needs-token`: local repo, branches, drafts, and reports are ready, but no `GITHUB_TOKEN` / `GH_TOKEN` is available in the shell.
- `blocked`: an expected branch, generated draft, or local prerequisite is missing.

## Current Review Policy

AI agent performs normal structure, source, CTA, table, and download-link review.

`npm run qa:product-seo` adds product-page-level checks for H1, title, canonical, breadcrumb detection, standardized spec module order, accordion controls, tables, CTA links, download labels, and public-facing internal notes.

If a product page has more than one H1, run:

```powershell
npm run fix:h1-hierarchy:dry-run
npm run fix:h1-hierarchy
```

If `qa:product-seo` reports body-level `<title>` tags, run:

```powershell
npm run fix:body-title-tags:dry-run
npm run fix:body-title-tags
```

This keeps the first product title H1 and converts later H1 tags in product body content to H2.

Human review is reserved for exceptions:

- Official source cannot be accessed after AI review.
- Source data conflicts.
- Backend/template limitation cannot be resolved locally.
- Business decision is required, such as omitting a product category.
