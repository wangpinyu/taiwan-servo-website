import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const siteRoot = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(siteRoot, 'reports');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function optionalJson(relPath) {
  const fullPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return readJson(relPath);
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function gate(id, status, evidence, nextAction = '') {
  return { id, status, evidence, nextAction };
}

const staticSite = readJson('site/reports/github-ready-validation.json');
const mirror = readJson('site/reports/local-mirror-readiness-current.json');
const customerNotes = readJson('site/reports/customer-facing-notes-validation.json');
const specQa = readJson('site/reports/product-spec-module-qa.json');
const specDownloads = readJson('site/reports/spec-download-affordance-validation.json');
const pageSeo = readJson('site/reports/product-page-structure-seo-qa.json');
const visual = readJson('site/reports/visual-sample-qa.json');
const deployManifest = optionalJson('site/reports/deploy-manifest.json');
const deploymentClassification = optionalJson('site/reports/deployment-review-classification.json');
const siteReadiness = optionalJson('site/reports/site-readiness-report.json');

const deploySummary = deployManifest?.summary || {};
const deployClassificationSummary = deploymentClassification?.summary || {};
const siteReadinessSummary = siteReadiness?.summary || {};
const packageOutputs = siteReadiness?.deploy_packages?.outputs || [];
const unresolvedDeployReview = deployClassificationSummary.unresolvedNeedsReview ?? deploySummary.deploy_needs_review ?? 0;

const gates = [
  gate(
    'local-preview-integrity',
    staticSite.summary.errors === 0 &&
      staticSite.summary.warnings === 0 &&
      mirror.summary.errors === 0 &&
      mirror.summary.warnings === 0
      ? 'pass'
      : 'block',
    `static errors=${staticSite.summary.errors}, static warnings=${staticSite.summary.warnings}, mirror errors=${mirror.summary.errors}, mirror warnings=${mirror.summary.warnings}`,
    'Fix local preview integrity before any deployment packaging.',
  ),
  gate(
    'customer-facing-cleanliness',
    customerNotes.summary.issue_count === 0 ? 'pass' : 'block',
    `customer-facing issues=${customerNotes.summary.issue_count}`,
    'Remove visible internal notes, placeholders, and local-only markers.',
  ),
  gate(
    'product-spec-and-seo-qa',
    specQa.summary.fail_count === 0 &&
      specQa.summary.warn_count === 0 &&
      specDownloads.summary.fail_count === 0 &&
      specDownloads.summary.warn_count === 0 &&
      pageSeo.summary.fail_count === 0 &&
      pageSeo.summary.warn_count === 0
      ? 'pass'
      : 'block',
    `spec fail/warn=${specQa.summary.fail_count}/${specQa.summary.warn_count}, downloads fail/warn=${specDownloads.summary.fail_count}/${specDownloads.summary.warn_count}, seo fail/warn=${pageSeo.summary.fail_count}/${pageSeo.summary.warn_count}`,
    'Resolve product spec, download affordance, and SEO QA failures before deployment.',
  ),
  gate(
    'visual-sample-qa',
    visual.summary.fail === 0 && visual.summary.warn === 0 ? 'pass' : 'review',
    `visual checks=${visual.summary.total_checks}, fail=${visual.summary.fail}, warn=${visual.summary.warn}`,
    'Review visual sample failures before deployment.',
  ),
  gate(
    'deploy-manifest-present',
    deployManifest ? 'pass' : 'block',
    deployManifest
      ? `deploy files=${deploySummary.deploy_files}, safe overwrite=${deploySummary.deploy_safe_to_overwrite}, needs review=${deploySummary.deploy_needs_review}`
      : 'deploy manifest missing',
    'Regenerate or provide a deploy manifest before packaging server overwrite candidates.',
  ),
  gate(
    'deploy-needs-review',
    unresolvedDeployReview === 0 ? 'pass' : 'review',
    deploymentClassification
      ? `unresolved_needs_review=${unresolvedDeployReview}, buckets=${JSON.stringify(deployClassificationSummary.bucketCounts || {})}`
      : `deploy_needs_review=${deploySummary.deploy_needs_review || 0}`,
    'Review unresolved deployment files and decide whether they are backend-managed, CSS bundle assets, static assets, or excluded from deployment.',
  ),
  gate(
    'same-path-overwrite-package',
    packageOutputs.some((entry) => entry.deploy_mode === 'same-path-overwrite' && entry.file_count > 0) ? 'pass' : 'review',
    JSON.stringify(packageOutputs.find((entry) => entry.deploy_mode === 'same-path-overwrite') || {}),
    'Confirm the same-path-overwrite package before any server file copy.',
  ),
  gate(
    'backend-managed-downloads',
    packageOutputs.some((entry) => entry.deploy_mode === 'backend-managed-download-route') ? 'review' : 'pass',
    JSON.stringify(packageOutputs.find((entry) => entry.deploy_mode === 'backend-managed-download-route') || {}),
    'Backend-managed download routes must be handled through backend/file-manager workflow, not blind file overwrite.',
  ),
  gate(
    'server-mutation-approval',
    'block',
    'No backend login, no server upload, no production overwrite, and no deletion have been approved in this local-preview phase.',
    'Open a separate deployment phase with explicit target scope, backup plan, smoke test, and rollback plan.',
  ),
];

const statusCounts = gates.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  status: statusCounts.block ? 'blocked' : statusCounts.review ? 'review-required' : 'ready',
  scope: {
    currentStage: 'local-preview-and-github-workflow',
    deploymentStageAllowed: false,
    backendMutationPerformed: false,
  },
  summary: {
    pages_total: siteReadinessSummary.pages_total ?? staticSite.summary.html_files,
    local_resources: siteReadinessSummary.local_resources ?? deploySummary.resources_total,
    deploy_files: deploySummary.deploy_files || 0,
    deploy_safe_to_overwrite: deploySummary.deploy_safe_to_overwrite || 0,
    deploy_needs_review: deploySummary.deploy_needs_review || 0,
    deploy_unresolved_needs_review: unresolvedDeployReview,
    deploy_review_buckets: deployClassificationSummary.bucketCounts || {},
    package_outputs: packageOutputs,
    status_counts: statusCounts,
  },
  gates,
  requiredBeforeDeployment: [
    'Create and review a PR from the current branch.',
    'Get explicit human approval for deployment target and scope.',
    'Back up backend-controlled content and server files before mutation.',
    'Resolve or exclude unresolved deployment review files.',
    'Handle backend-managed download routes through the backend/file-manager path.',
    'Run a small deployment smoke test before broad overwrite.',
    'Keep rollback package and restore instructions next to the deployment manifest.',
  ],
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'deployment-readiness-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const statusClass = {
  pass: 'ok',
  review: 'warn',
  block: 'bad',
};

const rows = gates.map((item) => `<tr class="${statusClass[item.status] || ''}">
  <td>${htmlEscape(item.status)}</td>
  <td>${htmlEscape(item.id)}</td>
  <td>${htmlEscape(item.evidence)}</td>
  <td>${htmlEscape(item.nextAction)}</td>
</tr>`).join('\n');

const nextActions = report.requiredBeforeDeployment.map((item) => `<li>${htmlEscape(item)}</li>`).join('\n');

fs.writeFileSync(
  path.join(reportDir, 'deployment-readiness-audit.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deployment Readiness Audit</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    h1{margin:0 0 8px}
    .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:700}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df}
    th,td{padding:9px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    tr.ok{background:#fff}
    tr.warn{background:#fffbea}
    tr.bad{background:#fff0f0}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>Deployment Readiness Audit</h1>
  <p>Status: <strong>${htmlEscape(report.status)}</strong>. Generated at <code>${htmlEscape(report.generatedAt)}</code>.</p>
  <p>This audit does not authorize backend saves, server uploads, deletion, or production overwrite. It separates local-preview readiness from deployment-stage approval.</p>
  <div class="summary">
    <div class="card"><div>Deploy files</div><div class="num">${report.summary.deploy_files}</div></div>
    <div class="card"><div>Safe overwrite candidates</div><div class="num">${report.summary.deploy_safe_to_overwrite}</div></div>
    <div class="card"><div>Needs review</div><div class="num">${report.summary.deploy_needs_review}</div></div>
    <div class="card"><div>Unresolved review</div><div class="num">${report.summary.deploy_unresolved_needs_review}</div></div>
    <div class="card"><div>Blocking gates</div><div class="num">${statusCounts.block || 0}</div></div>
  </div>
  <h2>Gates</h2>
  <table><thead><tr><th>Status</th><th>Gate</th><th>Evidence</th><th>Next action</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Required Before Deployment</h2>
  <ol>${nextActions}</ol>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status: report.status,
  report: 'site/reports/deployment-readiness-audit.html',
  summary: report.summary,
}, null, 2));
