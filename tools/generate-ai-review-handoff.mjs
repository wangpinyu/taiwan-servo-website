import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');
const outJson = path.join(reportDir, 'ai-review-handoff.json');
const outHtml = path.join(reportDir, 'ai-review-handoff.html');
const outMd = path.join(reportDir, 'ai-review-handoff.md');

function readJson(relPath, fallback = {}) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return fallback;
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function mdEscape(value) {
  return String(value ?? '').replaceAll('|', '\\|');
}

const completion = readJson('site/reports/gpt-optimization-completion-audit.json');
const specQa = readJson('site/reports/product-spec-module-qa.json');
const seoQa = readJson('site/reports/product-page-structure-seo-qa.json');
const downloadQa = readJson('site/reports/spec-download-affordance-validation.json');
const agentReview = readJson('site/reports/product-spec-agent-review.json');
const mirror = readJson('site/reports/local-mirror-readiness-current.json');
const staticQa = readJson('site/reports/github-ready-validation.json');
const visual = readJson('site/reports/visual-sample-qa.json');
const githubManual = readJson('site/reports/github-manual-bootstrap-handoff.json');
const githubRemote = readJson('site/reports/github-remote-state-verification.json');
const deployment = readJson('site/reports/deployment-phase-handoff.json');
const nextAction = readJson('site/reports/next-action-dashboard.json');

const handoff = {
  generatedAt: new Date().toISOString(),
  purpose:
    'Compact evidence package for AI/GPT review of the Taiwan Servo local optimization workflow before GitHub issue/PR creation and deployment approval.',
  currentState: {
    localOptimizationReady: Boolean(completion.summary?.localOptimizationReady),
    fullObjectiveComplete: Boolean(completion.summary?.fullObjectiveComplete),
    remainingExternalActions: completion.summary?.remainingExternalActions || [],
    outOfStageItems: completion.summary?.outOfStageItems || [],
  },
  productScope: {
    productPages: specQa.summary?.total_pages,
    specModulePass: specQa.summary?.pass_count,
    noSpecModuleExceptions: specQa.summary?.no_spec_module_count,
    agentApprovedClean: agentReview.summary?.agent_status_counts?.['agent-approved-clean'],
    agentApprovedException: agentReview.summary?.agent_status_counts?.['agent-approved-exception'],
  },
  validationEvidence: {
    staticSite: staticQa.summary || {},
    localMirror: mirror.summary || {},
    specModules: specQa.summary || {},
    downloadAffordances: downloadQa.summary || {},
    seoStructure: seoQa.summary || {},
    visualSample: visual.summary || {},
  },
  githubEvidence: {
    manualHandoffReady: githubManual.status,
    labels: githubManual.counts?.labels,
    issueDrafts: githubManual.counts?.issues,
    pullRequestDrafts: githubManual.counts?.prs,
    tokenRequiredForManual: githubManual.tokenRequired,
    remoteBranchesPresent: githubRemote.gitRemote?.presentBranches,
    remotePullRequestRefs: githubRemote.gitRemote?.pullRequestRefs,
  },
  deploymentEvidence: {
    status: deployment.status,
    deploymentAllowedNow: deployment.deploymentAllowedNow,
    deployFiles: deployment.summary?.deployFiles,
    safeOverwriteCandidates: deployment.summary?.safeOverwriteCandidates,
    packageIntegrityStatus: deployment.summary?.packageIntegrityStatus,
    packageIntegrityReviewCount: deployment.summary?.packageIntegrityReviewCount,
    packageIntegrityErrorCount: deployment.summary?.packageIntegrityErrorCount,
  },
  reviewChecklist: [
    'Confirm the local optimization evidence is sufficient for AI approval.',
    'Confirm the 6 no-spec-module pages are acceptable exceptions, not missing hardware product pages.',
    'Confirm GitHub labels, tracking issues, and phase PRs can be created from the manual handoff or token-backed script.',
    'Confirm deployment remains out of scope until explicit user approval.',
    'Confirm no backend save, server overwrite, or production publish has been performed in this stage.',
  ],
  reportLinks: [
    { label: 'Completion audit', href: 'gpt-optimization-completion-audit.html' },
    { label: 'Next action dashboard', href: 'next-action-dashboard.html' },
    { label: 'Product spec QA', href: 'product-spec-module-qa.html' },
    { label: 'Agent review', href: 'product-spec-agent-review.html' },
    { label: 'Static validation', href: 'github-ready-validation.html' },
    { label: 'Local mirror readiness', href: 'local-mirror-readiness-current.html' },
    { label: 'GitHub manual handoff', href: 'github-manual-bootstrap-handoff.html' },
    { label: 'Deployment handoff', href: 'deployment-phase-handoff.html' },
  ],
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

const summaryCards = [
  ['Local optimization ready', handoff.currentState.localOptimizationReady],
  ['Full objective complete', handoff.currentState.fullObjectiveComplete],
  ['Product pages', handoff.productScope.productPages],
  ['Spec pass', handoff.productScope.specModulePass],
  ['Approved clean', handoff.productScope.agentApprovedClean],
  ['Approved exceptions', handoff.productScope.agentApprovedException],
  ['GitHub issue drafts', handoff.githubEvidence.issueDrafts],
  ['GitHub PR drafts', handoff.githubEvidence.pullRequestDrafts],
  ['Remote PR refs', handoff.githubEvidence.remotePullRequestRefs],
  ['Deployment allowed now', handoff.deploymentEvidence.deploymentAllowedNow],
]
  .map(
    ([label, value]) =>
      `<div class="card"><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></div>`,
  )
  .join('\n');

const validationRows = Object.entries(handoff.validationEvidence)
  .map(
    ([name, evidence]) => `<tr>
  <td>${htmlEscape(name)}</td>
  <td><pre>${htmlEscape(JSON.stringify(evidence, null, 2))}</pre></td>
</tr>`,
  )
  .join('\n');

const checklistItems = handoff.reviewChecklist.map((item) => `<li>${htmlEscape(item)}</li>`).join('\n');
const linkItems = handoff.reportLinks
  .map((link) => `<li><a href="${htmlEscape(link.href)}">${htmlEscape(link.label)}</a></li>`)
  .join('\n');

fs.writeFileSync(
  outHtml,
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Review Handoff</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .card span{display:block;color:#52675b;font-size:13px}
    .card strong{display:block;font-size:22px;margin-top:6px}
    table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    pre{white-space:pre-wrap;margin:0}
    a{color:#087d3d}
  </style>
</head>
<body>
  <h1>AI Review Handoff</h1>
  <p>${htmlEscape(handoff.purpose)}</p>
  <div class="grid">${summaryCards}</div>
  <h2>Review checklist</h2>
  <ol>${checklistItems}</ol>
  <h2>Validation evidence</h2>
  <table><thead><tr><th>Area</th><th>Evidence</th></tr></thead><tbody>${validationRows}</tbody></table>
  <h2>Report links</h2>
  <ul>${linkItems}</ul>
</body>
</html>`,
  'utf8',
);

const md = [
  '# AI Review Handoff',
  '',
  handoff.purpose,
  '',
  '## Current state',
  '',
  `- Local optimization ready: ${handoff.currentState.localOptimizationReady}`,
  `- Full objective complete: ${handoff.currentState.fullObjectiveComplete}`,
  `- Remaining external actions: ${handoff.currentState.remainingExternalActions.join(', ') || 'none'}`,
  `- Out of stage items: ${handoff.currentState.outOfStageItems.join(', ') || 'none'}`,
  '',
  '## Product scope',
  '',
  `- Product pages: ${handoff.productScope.productPages}`,
  `- Spec module pass: ${handoff.productScope.specModulePass}`,
  `- No-spec-module approved exceptions: ${handoff.productScope.noSpecModuleExceptions}`,
  `- Agent approved clean: ${handoff.productScope.agentApprovedClean}`,
  `- Agent approved exception: ${handoff.productScope.agentApprovedException}`,
  '',
  '## Review checklist',
  '',
  ...handoff.reviewChecklist.map((item) => `- [ ] ${item}`),
  '',
  '## Report links',
  '',
  ...handoff.reportLinks.map((link) => `- [${mdEscape(link.label)}](${link.href})`),
  '',
];

fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      status: 'ready',
      report: 'site/reports/ai-review-handoff.html',
      productPages: handoff.productScope.productPages,
      localOptimizationReady: handoff.currentState.localOptimizationReady,
      fullObjectiveComplete: handoff.currentState.fullObjectiveComplete,
    },
    null,
    2,
  ),
);
