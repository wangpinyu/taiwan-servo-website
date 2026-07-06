import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');
const outJson = path.join(reportDir, 'next-action-dashboard.json');
const outHtml = path.join(reportDir, 'next-action-dashboard.html');
const outMd = path.join(reportDir, 'next-action-dashboard.md');

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
const githubManual = readJson('site/reports/github-manual-bootstrap-handoff.json');
const githubApi = readJson('site/reports/github-api-bootstrap-handoff.json');
const githubRemote = readJson('site/reports/github-remote-state-verification.json');
const deployment = readJson('site/reports/deployment-phase-handoff.json');
const packageIntegrity = readJson('site/reports/deployment-package-integrity.json');
const visual = readJson('site/reports/visual-sample-qa.json');

const remainingExternalActions = completion.summary?.remainingExternalActions || [];
const hasGithubExternalAction = remainingExternalActions.includes('github-api-bootstrap');
const remotePrRefs = Number(githubRemote.gitRemote?.pullRequestRefs || 0);

const actions = [
  {
    priority: 1,
    title: 'Choose GitHub bootstrap path',
    status: hasGithubExternalAction ? 'external action required' : 'complete',
    recommended:
      'Use the safe API script if a token is available. Otherwise use the manual handoff page to create labels, tracking issues, and phase 1 PR.',
    links: [
      { label: 'GitHub API handoff', href: 'github-api-bootstrap-handoff.html' },
      { label: 'GitHub manual handoff', href: 'github-manual-bootstrap-handoff.html' },
      { label: 'GitHub remote state', href: 'github-remote-state-verification.html' },
    ],
    command: 'npm run github:bootstrap:safe',
    manualFallback:
      'Open site/reports/github-manual-bootstrap-handoff.html and create labels, tracking issues, and the phase 1 PR in order.',
  },
  {
    priority: 2,
    title: 'Review phase 1 PR',
    status: remotePrRefs > 0 ? 'ready for review' : 'waiting for PR creation',
    recommended:
      'Review phase-1-smac-spec-standard first, then continue category branches by priority. Keep validation passing before merge.',
    links: [
      { label: 'PR draft index', href: 'github-prs/index.html' },
      { label: 'Issue draft index', href: 'github-issues/index.html' },
    ],
    command: 'npm run validate:external-handoff',
  },
  {
    priority: 3,
    title: 'Approve deployment phase',
    status: deployment.deploymentAllowedNow ? 'deployment allowed' : 'approval required',
    recommended:
      'Backend save, server overwrite, and deployment remain out of the current local/GitHub stage until explicit approval.',
    links: [
      { label: 'Deployment handoff', href: 'deployment-phase-handoff.html' },
      { label: 'Deployment readiness', href: 'deployment-readiness-audit.html' },
      { label: 'Deployment package integrity', href: 'deployment-package-integrity.html' },
    ],
    command: 'npm run workflow:deployment-handoff',
  },
];

const dashboard = {
  generatedAt: new Date().toISOString(),
  status: completion.summary?.fullObjectiveComplete ? 'complete' : 'in-progress',
  localOptimizationReady: Boolean(completion.summary?.localOptimizationReady),
  fullObjectiveComplete: Boolean(completion.summary?.fullObjectiveComplete),
  completionSummary: completion.summary || {},
  github: {
    apiStatus: githubApi.status,
    manualMode: githubManual.mode,
    tokenRequiredForManual: githubManual.tokenRequired,
    labels: githubManual.counts?.labels,
    issues: githubManual.counts?.issues,
    prs: githubManual.counts?.prs,
    remotePullRequestRefs: remotePrRefs,
  },
  deployment: {
    status: deployment.status,
    deploymentAllowedNow: deployment.deploymentAllowedNow,
    packageIntegrityStatus: packageIntegrity.status,
    packageIntegrityReviewCount: packageIntegrity.summary?.review_count,
    packageIntegrityErrorCount: packageIntegrity.summary?.error_count,
  },
  visualSample: {
    pass: visual.summary?.pass,
    warn: visual.summary?.warn,
    fail: visual.summary?.fail,
  },
  actions,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');

const cards = [
  ['Local optimization', dashboard.localOptimizationReady ? 'ready' : 'not ready'],
  ['Full objective', dashboard.fullObjectiveComplete ? 'complete' : 'in progress'],
  ['GitHub labels', dashboard.github.labels],
  ['GitHub issues', dashboard.github.issues],
  ['GitHub PRs', dashboard.github.prs],
  ['Remote PR refs', dashboard.github.remotePullRequestRefs],
  ['Deployment status', dashboard.deployment.status],
  ['Deployment review count', dashboard.deployment.packageIntegrityReviewCount],
]
  .map(
    ([label, value]) =>
      `<div class="card"><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></div>`,
  )
  .join('\n');

const rows = actions
  .map(
    (action) => `<tr>
  <td>${htmlEscape(action.priority)}</td>
  <td>${htmlEscape(action.title)}</td>
  <td>${htmlEscape(action.status)}</td>
  <td>${htmlEscape(action.recommended)}</td>
  <td>${action.command ? `<code>${htmlEscape(action.command)}</code>` : ''}</td>
  <td>${action.links.map((link) => `<a href="${htmlEscape(link.href)}">${htmlEscape(link.label)}</a>`).join('<br>')}</td>
</tr>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Next Action Dashboard</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .card span{display:block;color:#52675b;font-size:13px}
    .card strong{display:block;font-size:22px;margin-top:6px}
    table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{background:#edf4ef;padding:2px 5px;border-radius:4px}
    a{color:#087d3d}
  </style>
</head>
<body>
  <h1>Next Action Dashboard</h1>
  <p>Generated at ${htmlEscape(dashboard.generatedAt)}. This page is the single operational entry for remaining external actions and deployment gates.</p>
  <div class="grid">${cards}</div>
  <h2>Next actions</h2>
  <table>
    <thead><tr><th>#</th><th>Task</th><th>Status</th><th>Recommendation</th><th>Command</th><th>Links</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(outHtml, html, 'utf8');

const md = [
  '# Next Action Dashboard',
  '',
  `Generated at: ${dashboard.generatedAt}`,
  '',
  `Local optimization ready: ${dashboard.localOptimizationReady}`,
  `Full objective complete: ${dashboard.fullObjectiveComplete}`,
  '',
  '| # | Task | Status | Recommendation | Command |',
  '| --- | --- | --- | --- | --- |',
  ...actions.map(
    (action) =>
      `| ${action.priority} | ${mdEscape(action.title)} | ${mdEscape(action.status)} | ${mdEscape(action.recommended)} | ${
        action.command ? `\`${mdEscape(action.command)}\`` : ''
      } |`,
  ),
  '',
  '## Key links',
  '',
  '- GitHub manual handoff: site/reports/github-manual-bootstrap-handoff.html',
  '- GitHub API handoff: site/reports/github-api-bootstrap-handoff.html',
  '- Deployment handoff: site/reports/deployment-phase-handoff.html',
  '- Completion audit: site/reports/gpt-optimization-completion-audit.html',
  '',
];

fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      status: dashboard.status,
      report: 'site/reports/next-action-dashboard.html',
      localOptimizationReady: dashboard.localOptimizationReady,
      fullObjectiveComplete: dashboard.fullObjectiveComplete,
      actions: actions.length,
    },
    null,
    2,
  ),
);
