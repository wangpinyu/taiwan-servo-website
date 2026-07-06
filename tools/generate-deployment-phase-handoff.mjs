import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function byBucket(files) {
  return files.reduce((acc, file) => {
    if (!acc[file.bucket]) acc[file.bucket] = [];
    acc[file.bucket].push(file);
    return acc;
  }, {});
}

const readiness = readJson('site/reports/deployment-readiness-audit.json');
const classification = readJson('site/reports/deployment-review-classification.json');
const packageIntegrity = readJson('site/reports/deployment-package-integrity.json');
const completion = readJson('site/reports/gpt-optimization-completion-audit.json');
const grouped = byBucket(classification.files || []);

const handoff = {
  generatedAt: new Date().toISOString(),
  status: packageIntegrity.status === 'pass' ? 'ready-for-deployment-approval' : 'ready-for-deployment-approval-with-package-review',
  deploymentAllowedNow: false,
  reason: packageIntegrity.status === 'pass'
    ? 'Local preview and deploy classification are ready, but backend/server mutation still requires explicit deployment-phase approval.'
    : 'Local preview is ready, but deployment package integrity has review items that must be resolved or explicitly excluded during the deployment phase.',
  evidence: {
    deploymentReadiness: 'site/reports/deployment-readiness-audit.html',
    deploymentClassification: 'site/reports/deployment-review-classification.html',
    deploymentPackageIntegrity: 'site/reports/deployment-package-integrity.html',
    completionAudit: 'site/reports/gpt-optimization-completion-audit.html',
    runbook: 'docs/deployment-phase-runbook.md',
  },
  summary: {
    pagesTotal: readiness.summary.pages_total,
    deployFiles: readiness.summary.deploy_files,
    safeOverwriteCandidates: readiness.summary.deploy_safe_to_overwrite,
    unresolvedNeedsReview: classification.summary.unresolvedNeedsReview,
    bucketCounts: classification.summary.bucketCounts,
    packageIntegrityStatus: packageIntegrity.status,
    packageIntegrityReviewCount: packageIntegrity.summary.review_count,
    packageIntegrityErrorCount: packageIntegrity.summary.error_count,
    localOptimizationReady: completion.summary.localOptimizationReady,
    fullObjectiveComplete: completion.summary.fullObjectiveComplete,
  },
  phases: [
    {
      id: 'approval-and-backup',
      title: 'Approval and backup',
      required: [
        'Get explicit human approval for deployment scope.',
        'Back up backend-managed content and target server files.',
        'Record rollback location and owner.',
      ],
    },
    {
      id: 'deployment-package-integrity',
      title: 'Deployment package integrity review',
      count: packageIntegrity.summary.review_count + packageIntegrity.summary.error_count,
      required: [
        'Review missing local files, byte mismatches, and duplicate target conflicts before upload.',
        'Do not deploy files listed as review items unless their source and target path are confirmed.',
        'Re-run npm run workflow:deployment-package-integrity after corrections or exclusions.',
      ],
    },
    {
      id: 'same-path-overwrite',
      title: 'Same-path overwrite candidates',
      count: grouped['same-path-overwrite']?.length || 0,
      required: [
        'Review package manifest before upload.',
        'Upload only after backup.',
        'Smoke test affected pages after upload.',
      ],
    },
    {
      id: 'backend-managed-download-route',
      title: 'Backend-managed downloads',
      count: grouped['backend-managed-download-route']?.length || 0,
      required: [
        'Use backend/file-manager workflow.',
        'Do not blindly overwrite /file/download or /file/output routes.',
        'Verify every changed download link from frontend.',
      ],
    },
    {
      id: 'css-relative-asset',
      title: 'CSS relative assets',
      count: grouped['css-relative-asset']?.length || 0,
      required: [
        'Keep assets with CSS bundle or remap paths during deployment.',
        'Verify icons, social buttons, search icons, and fonts.',
      ],
    },
    {
      id: 'site-static-asset-review',
      title: 'Site static assets',
      count: grouped['site-static-asset-review']?.length || 0,
      required: [
        'Review favicon/logo/static asset changes separately.',
        'Confirm cache-busting behavior if replacing existing files.',
      ],
    },
    {
      id: 'local-placeholder-exclude',
      title: 'Excluded local placeholders',
      count: grouped['local-placeholder-exclude']?.length || 0,
      required: [
        'Do not upload placeholder files.',
        'Resolve source mapping if the visible page needs the asset.',
      ],
    },
  ],
  smokeTests: [
    'Open homepage, one product category, one product detail, and one service page on desktop.',
    'Repeat on mobile viewport.',
    'Check no broken images and no horizontal overflow.',
    'Click representative PDF/CAD/download links.',
    'Check canonical, H1, breadcrumb, and visible CTA remain intact.',
  ],
  rollback: [
    'If smoke test fails, stop broad deployment.',
    'Restore backed-up server files and backend content.',
    'Re-run the same smoke test set after rollback.',
  ],
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'deployment-phase-handoff.json'), `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

const phaseRows = handoff.phases.map((phase) => `<tr>
  <td>${htmlEscape(phase.id)}</td>
  <td>${htmlEscape(phase.title)}</td>
  <td>${htmlEscape(phase.count ?? '')}</td>
  <td><ul>${phase.required.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul></td>
</tr>`).join('');

const smokeRows = handoff.smokeTests.map((item) => `<li>${htmlEscape(item)}</li>`).join('');
const rollbackRows = handoff.rollback.map((item) => `<li>${htmlEscape(item)}</li>`).join('');

fs.writeFileSync(
  path.join(reportDir, 'deployment-phase-handoff.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deployment Phase Handoff</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:700}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df;margin:16px 0}
    th,td{padding:8px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>Deployment Phase Handoff</h1>
  <p>Status: <strong>${htmlEscape(handoff.status)}</strong>. Deployment allowed now: <strong>${handoff.deploymentAllowedNow}</strong>.</p>
  <p>${htmlEscape(handoff.reason)}</p>
  <div class="grid">
    <div class="card"><div>Pages</div><div class="num">${handoff.summary.pagesTotal}</div></div>
    <div class="card"><div>Deploy files</div><div class="num">${handoff.summary.deployFiles}</div></div>
    <div class="card"><div>Safe overwrite candidates</div><div class="num">${handoff.summary.safeOverwriteCandidates}</div></div>
    <div class="card"><div>Unresolved review</div><div class="num">${handoff.summary.unresolvedNeedsReview}</div></div>
  </div>
  <h2>Evidence</h2>
  <ul>
    ${Object.entries(handoff.evidence).map(([label, rel]) => `<li>${htmlEscape(label)}: <a href="../${htmlEscape(rel).replace(/^site\/reports\//, '')}">${htmlEscape(rel)}</a></li>`).join('')}
  </ul>
  <h2>Deployment Phases</h2>
  <table><thead><tr><th>ID</th><th>Phase</th><th>Count</th><th>Required actions</th></tr></thead><tbody>${phaseRows}</tbody></table>
  <h2>Smoke Tests</h2>
  <ul>${smokeRows}</ul>
  <h2>Rollback</h2>
  <ul>${rollbackRows}</ul>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status: handoff.status,
  report: 'site/reports/deployment-phase-handoff.html',
  summary: handoff.summary,
}, null, 2));
