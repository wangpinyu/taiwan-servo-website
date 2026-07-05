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
   - `site/reports/product-spec-agent-review.html`
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
- See `docs/github-optimization-workflow.md` for the complete operating rules.

## Current Review Policy

AI agent performs normal structure, source, CTA, table, and download-link review.

Human review is reserved for exceptions:

- Official source cannot be accessed after AI review.
- Source data conflicts.
- Backend/template limitation cannot be resolved locally.
- Business decision is required, such as omitting a product category.
