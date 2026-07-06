import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'site', 'reports');
const outJson = path.join(reportsDir, 'github-bootstrap-readiness.json');
const outHtml = path.join(reportsDir, 'github-bootstrap-readiness.html');

const expectedBranches = [
  'main',
  'phase-1-smac-spec-standard',
  'phase-2-drivers-spec-review',
  'phase-2-motors-spec-review',
  'phase-3-harmonic-drive',
  'phase-3-renishaw-feedback',
  'phase-3-positioning-stage',
  'phase-3-bearings-air-mechanical',
  'phase-4-couplings',
  'phase-4-fms-tension',
  'phase-4-solid-state-relays',
  'phase-4-sanyo-denki',
  'phase-4-special-environments',
  'phase-5-ceramic-chucks',
  'phase-5-sejinigb',
  'phase-5-blowers',
  'phase-5-automation-systems',
  'phase-5-other-feedback',
];

function readJson(relativePath, fallback = null) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    return fallback;
  }
}

function runGit(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function countLabels() {
  const text = fs.existsSync(path.join(root, '.github', 'labels.yml'))
    ? fs.readFileSync(path.join(root, '.github', 'labels.yml'), 'utf8')
    : '';
  return (text.match(/^- name:/gm) || []).length;
}

function remoteBranches() {
  const lines = runGit(['ls-remote', '--heads', 'origin']).split(/\r?\n/).filter(Boolean);
  const refs = new Map();
  for (const line of lines) {
    const [sha, ref] = line.split(/\s+/);
    if (sha && ref?.startsWith('refs/heads/')) refs.set(ref.replace('refs/heads/', ''), sha.slice(0, 7));
  }
  return refs;
}

function remotePullRefs() {
  const lines = runGit(['ls-remote', 'origin', 'refs/pull/*/head']).split(/\r?\n/).filter(Boolean);
  return lines.length;
}

const generatedAt = new Date().toISOString();
const issueIndex = readJson(path.join('site', 'reports', 'github-issues', 'index.json'), { entries: [], summary: {} });
const prIndex = readJson(path.join('site', 'reports', 'github-prs', 'index.json'), { entries: [] });
const sourceAudit = readJson(path.join('site', 'reports', 'source-needed-audit.json'), { summary: {} });
const review = readJson(path.join('site', 'reports', 'product-spec-agent-review.json'), { summary: {} });
const branches = remoteBranches();
const missingBranches = expectedBranches.filter((branch) => !branches.has(branch));
const presentBranches = expectedBranches.length - missingBranches.length;
const tokenPresent = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
const pullRefs = remotePullRefs();
const labelCount = countLabels();
const reviewCounts = review.summary?.agent_status_counts || {};
const approvedPages = reviewCounts['agent-approved-clean'] || 0;
const approvedExceptionPages = reviewCounts['agent-approved-exception'] || 0;
const sourceNeededPages = sourceAudit.summary?.total_pages || 0;
const acceptedReviewPages = approvedPages + approvedExceptionPages + sourceNeededPages;

const checks = [
  {
    id: 'labels-defined',
    label: 'GitHub labels defined',
    status: labelCount >= 7 ? 'pass' : 'warn',
    detail: `${labelCount} labels in .github/labels.yml`,
  },
  {
    id: 'issue-drafts',
    label: 'Tracking issue drafts generated',
    status: issueIndex.entries?.length === 18 ? 'pass' : 'warn',
    detail: `${issueIndex.entries?.length || 0} issue drafts`,
  },
  {
    id: 'pr-drafts',
    label: 'Pull request drafts generated',
    status: prIndex.entries?.length === 17 ? 'pass' : 'warn',
    detail: `${prIndex.entries?.length || 0} PR drafts`,
  },
  {
    id: 'remote-branches',
    label: 'Required branches pushed',
    status: missingBranches.length === 0 ? 'pass' : 'fail',
    detail: missingBranches.length === 0 ? `${expectedBranches.length} branches available on origin` : `Missing: ${missingBranches.join(', ')}`,
  },
  {
    id: 'github-token',
    label: 'GitHub API token available',
    status: tokenPresent ? 'pass' : 'needs-action',
    detail: tokenPresent ? 'GITHUB_TOKEN/GH_TOKEN is set for this shell' : 'No token in this shell; API apply remains pending',
  },
  {
    id: 'remote-prs',
    label: 'Remote pull requests exist',
    status: pullRefs > 0 ? 'pass' : 'needs-action',
    detail: `${pullRefs} pull request refs detected on origin`,
  },
  {
    id: 'agent-review',
    label: 'AI agent review baseline',
    status: acceptedReviewPages === 248 && approvedPages > 0 ? 'pass' : 'warn',
    detail: JSON.stringify(reviewCounts),
  },
  {
    id: 'source-needed-audit',
    label: 'Source-needed audit generated',
    status: sourceNeededPages === (reviewCounts['agent-source-needed'] || 0) ? 'pass' : 'warn',
    detail: JSON.stringify(sourceAudit.summary || {}),
  },
];

const status = checks.some((check) => check.status === 'fail')
  ? 'blocked'
  : checks.some((check) => check.status === 'needs-action')
    ? 'ready-needs-token'
    : 'ready';

const output = {
  generatedAt,
  status,
  repository: 'wangpinyu/taiwan-servo-website',
  tokenPresent,
  pullRequestRefs: pullRefs,
  expectedBranches: expectedBranches.map((branch) => ({ branch, present: branches.has(branch) })),
  summary: {
    labels: labelCount,
    issueDrafts: issueIndex.entries?.length || 0,
    pullRequestDrafts: prIndex.entries?.length || 0,
    approvedPages,
    approvedExceptionPages,
    sourceNeededPages,
    acceptedReviewPages,
    remoteBranchesPresent: presentBranches,
  },
  checks,
  nextActions: tokenPresent
    ? [
        'Run npm run github:bootstrap to create labels, tracking issues, and pull requests.',
        'Verify GitHub Actions Preview QA on the created pull requests.',
      ]
    : [
        'Set GITHUB_TOKEN or GH_TOKEN in the current PowerShell session.',
        'Run npm run github:bootstrap:dry-run again, then npm run github:bootstrap.',
      ],
};

await fs.promises.mkdir(reportsDir, { recursive: true });
await fs.promises.writeFile(outJson, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const rows = checks.map((check) => `
  <tr>
    <td><code>${htmlEscape(check.id)}</code></td>
    <td>${htmlEscape(check.label)}</td>
    <td class="${htmlEscape(check.status)}">${htmlEscape(check.status)}</td>
    <td>${htmlEscape(check.detail)}</td>
  </tr>`).join('\n');

const branchRows = output.expectedBranches.map((entry) => `
  <tr>
    <td><code>${htmlEscape(entry.branch)}</code></td>
    <td>${entry.present ? '<span class="pass">present</span>' : '<span class="fail">missing</span>'}</td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GitHub Bootstrap Readiness</title>
  <style>
    body{font-family:Arial,"Noto Sans TC",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff;margin:16px 0}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{white-space:nowrap}
    .pass{color:#087d3d;font-weight:700}
    .warn,.needs-action{color:#9b6a00;font-weight:700}
    .fail{color:#b3261e;font-weight:700}
    .card{background:#fff;border:1px solid #d8e2dc;border-radius:8px;padding:12px 16px;margin:12px 0}
  </style>
</head>
<body>
  <h1>GitHub Bootstrap Readiness</h1>
  <div class="card">
    <p><strong>Status:</strong> <span class="${htmlEscape(status)}">${htmlEscape(status)}</span></p>
    <p><strong>Generated:</strong> ${htmlEscape(generatedAt)}</p>
    <p><strong>Repository:</strong> ${htmlEscape(output.repository)}</p>
  </div>
  <h2>Checks</h2>
  <table>
    <thead><tr><th>ID</th><th>Check</th><th>Status</th><th>Detail</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Remote Branches</h2>
  <table>
    <thead><tr><th>Branch</th><th>Status</th></tr></thead>
    <tbody>${branchRows}</tbody>
  </table>
  <h2>Next Actions</h2>
  <ol>${output.nextActions.map((action) => `<li>${htmlEscape(action)}</li>`).join('')}</ol>
</body>
</html>
`;

await fs.promises.writeFile(outHtml, html, 'utf8');
console.log(JSON.stringify({ status, checks: checks.length, tokenPresent, pullRequestRefs: pullRefs }));
