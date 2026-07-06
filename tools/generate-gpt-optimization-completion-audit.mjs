import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const repoRoot = process.cwd();
const reportDir = path.join(root, 'reports');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function passIf(condition, evidence, missing = []) {
  return {
    status: condition ? 'complete' : 'incomplete',
    evidence,
    missing: condition ? [] : missing,
  };
}

const docs = readJson('site/reports/docs-readability-validation.json');
const staticSite = readJson('site/reports/github-ready-validation.json');
const mirror = readJson('site/reports/local-mirror-readiness-current.json');
const customerNotes = readJson('site/reports/customer-facing-notes-validation.json');
const specQa = readJson('site/reports/product-spec-module-qa.json');
const specDownloads = readJson('site/reports/spec-download-affordance-validation.json');
const pageSeo = readJson('site/reports/product-page-structure-seo-qa.json');
const warningTaxonomy = readJson('site/reports/product-seo-warning-taxonomy.json');
const agentReview = readJson('site/reports/product-spec-agent-review.json');
const sourceAudit = readJson('site/reports/source-needed-audit.json');
const backlog = readJson('site/reports/optimization-backlog.json');
const githubReadiness = readJson('site/reports/github-bootstrap-readiness.json');
const deploymentReadiness = readJson('site/reports/deployment-readiness-audit.json');
const visual = readJson('site/reports/visual-sample-qa.json');
const workflow = readText('.github/workflows/preview-qa.yml');
const prTemplate = readText('.github/PULL_REQUEST_TEMPLATE.md');
const packageJson = readJson('package.json');

const checks = [
  {
    id: 'local-mirror-ready',
    requirement: 'Local preview and mirror are stable: no missing local refs, no formal-site internal refs, no file paths, and no .txt hrefs.',
    ...passIf(
      staticSite.summary.errors === 0 &&
        staticSite.summary.warnings === 0 &&
        mirror.summary.errors === 0 &&
        mirror.summary.warnings === 0 &&
        mirror.summary.missing_local_refs === 0 &&
        mirror.summary.file_path_refs === 0 &&
        mirror.summary.txt_href_refs === 0,
      [
        'site/reports/github-ready-validation.json',
        'site/reports/local-mirror-readiness-current.json',
      ],
      ['Static or mirror validation has errors or warnings.'],
    ),
    metrics: {
      html_files: staticSite.summary.html_files,
      local_refs: mirror.summary.local_refs,
      missing_local_refs: mirror.summary.missing_local_refs,
      formal_same_origin_refs: staticSite.summary.formal_same_origin_refs,
    },
  },
  {
    id: 'product-spec-modules',
    requirement: 'Product spec detail modules are standardized and validated for all product pages with documented exceptions only.',
    ...passIf(
      specQa.summary.total_pages === 248 &&
        specQa.summary.fail_count === 0 &&
        specQa.summary.warn_count === 0 &&
        specQa.summary.pass_count === 242 &&
        specQa.summary.no_spec_module_count === 6,
      ['site/reports/product-spec-module-qa.json'],
      ['Product spec module QA does not match 242 pass / 6 documented exceptions.'],
    ),
    metrics: specQa.summary,
  },
  {
    id: 'download-affordances',
    requirement: 'PDF, CAD, Manual, Catalog, Drawing, and Software links have clear visible labels and no inert placeholders.',
    ...passIf(
      specDownloads.summary.fail_count === 0 &&
        specDownloads.summary.warn_count === 0 &&
        specDownloads.summary.pages_with_specs === 242,
      ['site/reports/spec-download-affordance-validation.json'],
      ['Spec download affordance validation has failures or warnings.'],
    ),
    metrics: specDownloads.summary,
  },
  {
    id: 'seo-structure',
    requirement: 'Product pages preserve SEO structure: one H1, clean heading hierarchy, tables, CTA, canonical, meta, and breadcrumbs.',
    ...passIf(
      pageSeo.summary.fail_count === 0 &&
        pageSeo.summary.warn_count === 0 &&
        warningTaxonomy.summary.total_warning_entries === 0,
      [
        'site/reports/product-page-structure-seo-qa.json',
        'site/reports/product-seo-warning-taxonomy.json',
      ],
      ['Product page SEO or structure warnings remain.'],
    ),
    metrics: {
      product_page_structure: pageSeo.summary,
      warning_taxonomy: warningTaxonomy.summary,
    },
  },
  {
    id: 'customer-facing-cleanliness',
    requirement: 'Public preview content contains no internal notes, pending text, placeholder text, local file markers, or data-local-file attributes.',
    ...passIf(
      customerNotes.summary.issue_count === 0,
      ['site/reports/customer-facing-notes-validation.json'],
      ['Customer-facing note validation has issues.'],
    ),
    metrics: customerNotes.summary,
  },
  {
    id: 'agent-review-status',
    requirement: 'AI agent review has no remaining fix-required or source-needed product pages.',
    ...passIf(
      agentReview.summary.agent_status_counts?.['agent-approved-clean'] === 242 &&
        agentReview.summary.agent_status_counts?.['agent-approved-exception'] === 6 &&
        !agentReview.summary.agent_status_counts?.['agent-fix-required'] &&
        !agentReview.summary.agent_status_counts?.['agent-source-needed'],
      ['site/reports/product-spec-agent-review.json'],
      ['Agent review still has fix-required or source-needed pages.'],
    ),
    metrics: agentReview.summary,
  },
  {
    id: 'source-needed-audit',
    requirement: 'Official-source gaps are resolved as approved exceptions, not hidden as incomplete work.',
    ...passIf(
      sourceAudit.summary.total_pages === 0 &&
        sourceAudit.summary.approved_exception_pages === 6,
      ['site/reports/source-needed-audit.json', 'site/reports/source-needed-audit.md'],
      ['There are unresolved source-needed pages.'],
    ),
    metrics: sourceAudit.summary,
  },
  {
    id: 'optimization-backlog',
    requirement: 'Category-level backlog, issue drafts, branch drafts, and PR drafts are generated with zero blocking pages.',
    ...passIf(
      backlog.summary.total_categories === 18 &&
        backlog.summary.total_pages === 248 &&
        backlog.summary.total_blocking_pages === 0,
      ['site/reports/optimization-backlog.json'],
      ['Optimization backlog still has blocking pages.'],
    ),
    metrics: backlog.summary,
  },
  {
    id: 'visual-sample-qa',
    requirement: 'Visual sample QA passes desktop and mobile checks without broken images or horizontal overflow.',
    ...passIf(
      visual.summary.total_checks === 18 &&
        visual.summary.fail === 0 &&
        visual.summary.warn === 0,
      ['site/reports/visual-sample-qa.json', 'site/reports/visual-sample-qa.html'],
      ['Visual sample QA has failures or warnings.'],
    ),
    metrics: visual.summary,
  },
  {
    id: 'docs-and-reports-readable',
    requirement: 'Core workflow docs and PR-facing reports are readable and pass the mojibake guard.',
    ...passIf(
      docs.summary.errors === 0,
      ['site/reports/docs-readability-validation.json'],
      ['Docs readability validation has errors.'],
    ),
    metrics: docs.summary,
  },
  {
    id: 'github-workflow',
    requirement: 'GitHub PR workflow is wired for strict validation, PR template evidence, and local readiness reports.',
    ...passIf(
      workflow.includes('npm run validate:strict') &&
        workflow.includes("'phase-*'") &&
        workflow.includes("'source-audit-*'") &&
        workflow.includes('site/reports/**/*.html') &&
        workflow.includes('site/reports/**/*.json') &&
        workflow.includes('site/reports/**/*.md') &&
        prTemplate.includes('npm run qa:visual-sample') &&
        githubReadiness.checks?.every((check) =>
          check.status === 'pass' || ['github-token', 'remote-prs'].includes(check.id),
        ),
      [
        '.github/workflows/preview-qa.yml',
        '.github/PULL_REQUEST_TEMPLATE.md',
        'site/reports/github-bootstrap-readiness.json',
      ],
      ['GitHub workflow files or readiness checks are incomplete.'],
    ),
    metrics: {
      readiness: githubReadiness.status,
      tokenPresent: githubReadiness.tokenPresent,
      pullRequestRefs: githubReadiness.pullRequestRefs,
      checks: githubReadiness.checks,
    },
  },
  {
    id: 'github-api-bootstrap',
    requirement: 'GitHub labels, issues, and PR refs are created through the GitHub API when a token is available.',
    status: githubReadiness.status === 'ready' ? 'complete' : 'external-action-required',
    evidence: ['site/reports/github-bootstrap-readiness.json'],
    missing:
      githubReadiness.status === 'ready'
        ? []
        : ['Set GITHUB_TOKEN or GH_TOKEN in the PowerShell session, then run npm run github:bootstrap.'],
    metrics: {
      readiness: githubReadiness.status,
      tokenPresent: githubReadiness.tokenPresent,
      pullRequestRefs: githubReadiness.pullRequestRefs,
      nextActions: githubReadiness.nextActions || [],
    },
  },
  {
    id: 'deployment-stage',
    requirement: 'Backend save, test-site publish, and production file overwrite are intentionally deferred to a separate deployment phase.',
    status: 'not-in-current-stage',
    evidence: [
      'site/reports/deployment-readiness-audit.json',
      'site/reports/deployment-review-classification.json',
      'docs/spec-module-review-log.md',
      'docs/github-optimization-workflow.md',
    ],
    missing: ['Open a separate deployment phase after PR review and human acceptance.'],
    metrics: {
      backendMutationPerformed: false,
      currentStage: 'local-preview-and-github-workflow',
      deploymentReadinessStatus: deploymentReadiness.status,
      deploymentReadinessSummary: deploymentReadiness.summary,
    },
  },
];

const statusCounts = checks.reduce((acc, check) => {
  acc[check.status] = (acc[check.status] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  objective: 'Audit current evidence against the GPT optimization work plan.',
  scope: {
    productPages: 248,
    currentStage: 'local-preview-and-github-workflow',
    validationScripts: {
      strict: packageJson.scripts['validate:strict'],
      visualSample: packageJson.scripts['qa:visual-sample'],
    },
  },
  summary: {
    totalRequirements: checks.length,
    statusCounts,
    localOptimizationReady:
      !statusCounts.incomplete &&
      !statusCounts['agent-fix-required'] &&
      backlog.summary.total_blocking_pages === 0,
    fullObjectiveComplete: statusCounts.complete === checks.length,
    remainingExternalActions: checks.filter((check) => check.status === 'external-action-required').map((check) => check.id),
    outOfStageItems: checks.filter((check) => check.status === 'not-in-current-stage').map((check) => check.id),
  },
  checks,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'gpt-optimization-completion-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const statusClass = {
  complete: 'ok',
  incomplete: 'bad',
  'external-action-required': 'warn',
  'not-in-current-stage': 'neutral',
};

const rows = checks.map((check) => `<tr class="${statusClass[check.status] || ''}">
  <td>${htmlEscape(check.status)}</td>
  <td>${htmlEscape(check.id)}</td>
  <td>${htmlEscape(check.requirement)}</td>
  <td>${htmlEscape(check.evidence.join('\n'))}</td>
  <td>${htmlEscape(check.missing.join('\n'))}</td>
</tr>`).join('\n');

fs.writeFileSync(
  path.join(reportDir, 'gpt-optimization-completion-audit.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GPT Optimization Completion Audit</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    h1{margin:0 0 8px}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:700}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df}
    th,td{padding:9px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top;white-space:pre-line}
    th{background:#eaf4ee}
    tr.ok{background:#fff}
    tr.warn{background:#fffbea}
    tr.bad{background:#fff0f0}
    tr.neutral{background:#f6f7f7}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>GPT Optimization Completion Audit</h1>
  <p>Generated at <code>${htmlEscape(report.generatedAt)}</code>. This report maps GPT optimization requirements to current local evidence.</p>
  <div class="cards">
    <div class="card"><div>Requirements</div><div class="num">${report.summary.totalRequirements}</div></div>
    <div class="card"><div>Complete</div><div class="num">${statusCounts.complete || 0}</div></div>
    <div class="card"><div>External action</div><div class="num">${statusCounts['external-action-required'] || 0}</div></div>
    <div class="card"><div>Incomplete</div><div class="num">${statusCounts.incomplete || 0}</div></div>
  </div>
  <p>Local optimization ready: <strong>${htmlEscape(report.summary.localOptimizationReady)}</strong>. Full objective complete: <strong>${htmlEscape(report.summary.fullObjectiveComplete)}</strong>.</p>
  <table>
    <thead><tr><th>Status</th><th>ID</th><th>Requirement</th><th>Evidence</th><th>Missing / Next Action</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status: statusCounts.incomplete ? 'issues' : 'ok',
  report: 'site/reports/gpt-optimization-completion-audit.html',
  summary: report.summary,
}, null, 2));

if (statusCounts.incomplete) process.exit(1);
