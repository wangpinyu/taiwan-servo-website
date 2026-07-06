import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');

function readJson(relPath, fallback = null) {
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

const readiness = readJson('site/reports/github-bootstrap-readiness.json', {});
const issueIndex = readJson('site/reports/github-issues/index.json', { entries: [], summary: {} });
const prIndex = readJson('site/reports/github-prs/index.json', { entries: [] });
const tokenPresent = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
const remotePrsReady = Number(readiness.pullRequestRefs || 0) > 0;
const status = remotePrsReady ? 'github-api-ready' : tokenPresent ? 'ready-to-apply' : 'ready-needs-token';

const handoff = {
  generatedAt: new Date().toISOString(),
  status,
  repository: readiness.repository || 'wangpinyu/taiwan-servo-website',
  tokenPresent,
  tokenValueStored: false,
  remotePullRequestRefs: readiness.pullRequestRefs || 0,
  expectedCounts: {
    labels: readiness.summary?.labels || 0,
    issueDrafts: issueIndex.entries?.length || readiness.summary?.issueDrafts || 0,
    pullRequestDrafts: prIndex.entries?.length || readiness.summary?.pullRequestDrafts || 0,
    remoteBranchesPresent: readiness.summary?.remoteBranchesPresent || 0,
  },
  evidence: {
    readiness: 'site/reports/github-bootstrap-readiness.html',
    issueDrafts: 'site/reports/github-issues/index.html',
    pullRequestDrafts: 'site/reports/github-prs/index.html',
    runbook: 'docs/github-api-bootstrap-runbook.md',
  },
  requiredTokenPermissions: [
    'Metadata: Read',
    'Contents: Read',
    'Issues: Read and write',
    'Pull requests: Read and write',
  ],
  commandSequence: [
    'npm run github:bootstrap:dry-run',
    'npm run github:bootstrap:smoke:dry-run',
    '$env:GITHUB_TOKEN = "<paste-token-here>"',
    'npm run github:bootstrap:smoke',
    'npm run github:bootstrap',
    'Remove-Item Env:\\GITHUB_TOKEN',
    'npm run workflow:github-readiness',
    'npm run workflow:github-api-handoff',
    'npm run validate:strict',
  ],
  smokeGate: {
    command: 'npm run github:bootstrap:smoke',
    expected: [
      'Labels are created or updated.',
      'One tracking issue is created or detected as existing.',
      'One pull request is created or detected as existing.',
    ],
  },
  currentBlocker: remotePrsReady
    ? null
    : tokenPresent
      ? 'Token is present; apply step still needs to be run and verified.'
      : 'No GitHub API token is available in this shell, so labels/issues/PRs cannot be created yet.',
  nextActions: remotePrsReady
    ? ['Verify GitHub Actions on created pull requests.', 'Start category-by-category PR review.']
    : tokenPresent
      ? ['Run npm run github:bootstrap:smoke.', 'If smoke passes, run npm run github:bootstrap.']
      : ['Create a fine-grained GitHub token with the listed permissions.', 'Set it only in the current PowerShell session.', 'Run the smoke bootstrap before full bootstrap.'],
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'github-api-bootstrap-handoff.json'), `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

const countCards = Object.entries(handoff.expectedCounts).map(([label, value]) => `
    <div class="card"><div>${htmlEscape(label)}</div><strong>${htmlEscape(value)}</strong></div>`).join('');
const permissionRows = handoff.requiredTokenPermissions.map((item) => `<li>${htmlEscape(item)}</li>`).join('');
const commandRows = handoff.commandSequence.map((item) => `<li><code>${htmlEscape(item)}</code></li>`).join('');
const nextRows = handoff.nextActions.map((item) => `<li>${htmlEscape(item)}</li>`).join('');

fs.writeFileSync(
  path.join(reportDir, 'github-api-bootstrap-handoff.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GitHub API Bootstrap Handoff</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .card strong{display:block;font-size:28px;margin-top:6px}
    code{background:#edf4ef;padding:2px 5px;border-radius:4px}
    .warn{background:#fff8e6;border:1px solid #ead99c;border-radius:8px;padding:12px}
    a{color:#087d3d}
  </style>
</head>
<body>
  <h1>GitHub API Bootstrap Handoff</h1>
  <p>Status: <strong>${htmlEscape(handoff.status)}</strong></p>
  <p>Repository: <code>${htmlEscape(handoff.repository)}</code></p>
  <p>Token present in this shell: <strong>${handoff.tokenPresent}</strong>. Token value stored in repo: <strong>${handoff.tokenValueStored}</strong>.</p>
  ${handoff.currentBlocker ? `<div class="warn"><strong>Current blocker:</strong> ${htmlEscape(handoff.currentBlocker)}</div>` : ''}
  <div class="grid">${countCards}</div>
  <h2>Required Token Permissions</h2>
  <ul>${permissionRows}</ul>
  <h2>Command Sequence</h2>
  <ol>${commandRows}</ol>
  <h2>Smoke Gate</h2>
  <p><code>${htmlEscape(handoff.smokeGate.command)}</code></p>
  <ul>${handoff.smokeGate.expected.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>
  <h2>Evidence</h2>
  <ul>
    <li><a href="github-bootstrap-readiness.html">GitHub bootstrap readiness</a></li>
    <li><a href="github-issues/index.html">Issue drafts</a></li>
    <li><a href="github-prs/index.html">PR drafts</a></li>
    <li><code>${htmlEscape(handoff.evidence.runbook)}</code></li>
  </ul>
  <h2>Next Actions</h2>
  <ul>${nextRows}</ul>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status: handoff.status,
  report: 'site/reports/github-api-bootstrap-handoff.html',
  expectedCounts: handoff.expectedCounts,
  tokenPresent,
}, null, 2));
