import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');
const repoOwner = 'wangpinyu';
const repoName = 'taiwan-servo-website';
const apiBase = 'https://api.github.com';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function readJson(relPath, fallback = null) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return fallback;
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function readText(relPath, fallback = '') {
  const absPath = path.join(repoRoot, relPath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : fallback;
}

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
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

function readLabelsYaml() {
  const raw = readText('.github/labels.yml');
  const labels = [];
  let current = null;
  for (const line of raw.split(/\r?\n/)) {
    const item = line.match(/^- name:\s*(.+)$/);
    if (item) {
      if (current) labels.push(current);
      current = { name: item[1].trim().replace(/^"|"$/g, '') };
      continue;
    }
    if (!current) continue;
    const color = line.match(/^\s*color:\s*"?([^"]+)"?\s*$/);
    if (color) current.color = color[1].trim();
    const description = line.match(/^\s*description:\s*(.+)$/);
    if (description) current.description = description[1].trim().replace(/^"|"$/g, '');
  }
  if (current) labels.push(current);
  return labels;
}

function remoteBranches() {
  const lines = runGit(['ls-remote', '--heads', 'origin']).split(/\r?\n/).filter(Boolean);
  const refs = new Map();
  for (const line of lines) {
    const [sha, ref] = line.split(/\s+/);
    if (sha && ref?.startsWith('refs/heads/')) refs.set(ref.replace('refs/heads/', ''), sha);
  }
  return refs;
}

function remotePullRefs() {
  const lines = runGit(['ls-remote', 'origin', 'refs/pull/*/head']).split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const [sha, ref] = line.split(/\s+/);
    return { sha, ref };
  });
}

async function github(endpoint) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'taiwan-servo-site-optimization-remote-verify',
    },
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { text };
    }
  }
  if (!response.ok) {
    return { ok: false, status: response.status, message: data?.message || response.statusText, data };
  }
  return { ok: true, status: response.status, data };
}

const generatedAt = new Date().toISOString();
const issueIndex = readJson('site/reports/github-issues/index.json', { entries: [] });
const prIndex = readJson('site/reports/github-prs/index.json', { entries: [] });
const expectedLabels = readLabelsYaml();
const branches = remoteBranches();
const pullRefs = remotePullRefs();
const expectedBranches = new Set(['main', ...prIndex.entries.map((entry) => entry.branch)]);
const branchChecks = [...expectedBranches].map((branch) => ({ branch, present: branches.has(branch) }));
const missingBranches = branchChecks.filter((entry) => !entry.present).map((entry) => entry.branch);

const api = {
  tokenPresent: Boolean(token),
  labels: { status: token ? 'pending' : 'not-run-no-token', expected: expectedLabels.length, present: null, missing: [] },
  issues: { status: token ? 'pending' : 'not-run-no-token', expected: issueIndex.entries.length, present: null, missing: [] },
  pullRequests: { status: token ? 'pending' : 'not-run-no-token', expected: prIndex.entries.length, present: null, missing: [] },
};

if (token) {
  const labelsResponse = await github(`/repos/${repoOwner}/${repoName}/labels?per_page=100`);
  if (labelsResponse.ok) {
    const remoteLabels = new Set(labelsResponse.data.map((label) => label.name));
    api.labels.missing = expectedLabels.filter((label) => !remoteLabels.has(label.name)).map((label) => label.name);
    api.labels.present = expectedLabels.length - api.labels.missing.length;
    api.labels.status = api.labels.missing.length ? 'missing-items' : 'pass';
  } else {
    api.labels.status = 'api-error';
    api.labels.error = labelsResponse;
  }

  const issuesResponse = await github(`/repos/${repoOwner}/${repoName}/issues?state=all&per_page=100`);
  if (issuesResponse.ok) {
    const remoteIssueTitles = new Set(issuesResponse.data.filter((issue) => !issue.pull_request).map((issue) => issue.title));
    api.issues.missing = issueIndex.entries.filter((entry) => !remoteIssueTitles.has(entry.title)).map((entry) => entry.title);
    api.issues.present = issueIndex.entries.length - api.issues.missing.length;
    api.issues.status = api.issues.missing.length ? 'missing-items' : 'pass';
  } else {
    api.issues.status = 'api-error';
    api.issues.error = issuesResponse;
  }

  const prsResponse = await github(`/repos/${repoOwner}/${repoName}/pulls?state=all&per_page=100`);
  if (prsResponse.ok) {
    const remotePrHeads = new Set(prsResponse.data.map((pull) => pull.head.ref));
    api.pullRequests.missing = prIndex.entries.filter((entry) => !remotePrHeads.has(entry.branch)).map((entry) => entry.branch);
    api.pullRequests.present = prIndex.entries.length - api.pullRequests.missing.length;
    api.pullRequests.status = api.pullRequests.missing.length ? 'missing-items' : 'pass';
  } else {
    api.pullRequests.status = 'api-error';
    api.pullRequests.error = prsResponse;
  }
}

const gitChecksPass = missingBranches.length === 0;
const apiPass = token && api.labels.status === 'pass' && api.issues.status === 'pass' && api.pullRequests.status === 'pass';
const status = !gitChecksPass
  ? 'blocked-missing-branches'
  : apiPass
    ? 'remote-ready'
    : token
      ? 'remote-api-incomplete'
      : 'ready-needs-token';

const report = {
  generatedAt,
  status,
  repository: `${repoOwner}/${repoName}`,
  gitRemote: {
    expectedBranches: branchChecks.length,
    presentBranches: branchChecks.length - missingBranches.length,
    missingBranches,
    pullRequestRefs: pullRefs.length,
  },
  api,
  nextActions: status === 'remote-ready'
    ? ['Verify GitHub Actions on created pull requests.', 'Start PR review from phase-1-smac-spec-standard.']
    : token
      ? ['Review missing API items, then rerun npm run github:bootstrap:safe.']
      : ['Set GITHUB_TOKEN or GH_TOKEN, then run npm run github:bootstrap:safe.'],
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'github-remote-state-verification.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const branchRows = branchChecks.map((entry) => `<tr><td><code>${htmlEscape(entry.branch)}</code></td><td>${entry.present ? 'pass' : 'missing'}</td></tr>`).join('');
const apiRows = ['labels', 'issues', 'pullRequests'].map((key) => {
  const item = api[key];
  return `<tr><td>${htmlEscape(key)}</td><td>${htmlEscape(item.status)}</td><td>${htmlEscape(item.expected)}</td><td>${htmlEscape(item.present ?? '')}</td><td>${htmlEscape((item.missing || []).slice(0, 10).join(', '))}</td></tr>`;
}).join('');

fs.writeFileSync(
  path.join(reportDir, 'github-remote-state-verification.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GitHub Remote State Verification</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df;margin:16px 0}
    th,td{padding:8px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>GitHub Remote State Verification</h1>
  <p>Status: <strong>${htmlEscape(status)}</strong></p>
  <p>Repository: <code>${htmlEscape(report.repository)}</code></p>
  <p>Token present: <strong>${htmlEscape(api.tokenPresent)}</strong>. Pull request refs: <strong>${htmlEscape(report.gitRemote.pullRequestRefs)}</strong>.</p>
  <h2>Branch Checks</h2>
  <table><thead><tr><th>Branch</th><th>Status</th></tr></thead><tbody>${branchRows}</tbody></table>
  <h2>API Checks</h2>
  <table><thead><tr><th>Item</th><th>Status</th><th>Expected</th><th>Present</th><th>Missing sample</th></tr></thead><tbody>${apiRows}</tbody></table>
  <h2>Next Actions</h2>
  <ol>${report.nextActions.map((action) => `<li>${htmlEscape(action)}</li>`).join('')}</ol>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status,
  report: 'site/reports/github-remote-state-verification.html',
  gitRemote: report.gitRemote,
  api: {
    tokenPresent: api.tokenPresent,
    labels: api.labels.status,
    issues: api.issues.status,
    pullRequests: api.pullRequests.status,
  },
}, null, 2));
