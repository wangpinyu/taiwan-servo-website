import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoOwner = 'wangpinyu';
const repoName = 'taiwan-servo-website';
const apiBase = 'https://api.github.com';
const root = process.cwd();

const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--apply');
const doLabels = args.has('--labels') || args.has('--all');
const doIssues = args.has('--issues') || args.has('--all');
const doPrs = args.has('--prs') || args.has('--all');
const maxIssuesArg = process.argv.find((arg) => arg.startsWith('--max-issues='));
const maxPrsArg = process.argv.find((arg) => arg.startsWith('--max-prs='));
const maxIssues = maxIssuesArg ? Number(maxIssuesArg.split('=')[1]) : Infinity;
const maxPrs = maxPrsArg ? Number(maxPrsArg.split('=')[1]) : Infinity;

if (!doLabels && !doIssues && !doPrs) {
  console.error('Usage: node tools/github-bootstrap.mjs [--labels] [--issues] [--prs] [--all] [--apply] [--max-issues=N] [--max-prs=N]');
  process.exit(2);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!dryRun && !token) {
  console.error('GITHUB_TOKEN or GH_TOKEN is required when using --apply.');
  process.exit(2);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function readText(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function readTextIfExists(relPath) {
  const absPath = path.join(root, relPath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

function readTextFromBranch(branch, relPath) {
  try {
    return execFileSync('git', ['show', `origin/${branch}:${relPath}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function fallbackPrBody(entry) {
  return [
    `# ${entry.branch}: ${entry.category}`,
    '',
    `Base: \`${entry.base}\``,
    `Branch: \`${entry.branch}\``,
    '',
    '## Validation',
    '',
    '- Run `npm run validate` before review.',
    '- Confirm GitHub Actions pass.',
    '- Confirm target pages are `agent-approved-clean`, or source gaps are documented as `source-needed`.',
    '',
    '## Reports',
    '',
    '- `site/reports/product-spec-module-qa.html`',
    '- `site/reports/product-spec-agent-review.html`',
    '- `site/reports/local-mirror-readiness-current.html`',
    '',
  ].join('\n');
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

async function github(method, endpoint, body) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'taiwan-servo-site-optimization-bootstrap',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
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
    const message = data?.message || response.statusText;
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${message}`);
  }
  return data;
}

async function listExistingIssues() {
  const issues = await github('GET', `/repos/${repoOwner}/${repoName}/issues?state=all&per_page=100`);
  return new Map(issues.filter((issue) => !issue.pull_request).map((issue) => [issue.title, issue]));
}

async function listExistingPulls() {
  const pulls = await github('GET', `/repos/${repoOwner}/${repoName}/pulls?state=all&per_page=100`);
  return new Map(pulls.map((pull) => [pull.head.ref, pull]));
}

async function syncLabels() {
  const labels = readLabelsYaml();
  const existing = dryRun ? new Map() : new Map((await github('GET', `/repos/${repoOwner}/${repoName}/labels?per_page=100`)).map((label) => [label.name, label]));
  const results = [];
  for (const label of labels) {
    const current = existing.get(label.name);
    if (dryRun) {
      results.push({ action: 'dry-run-label', label: label.name });
    } else if (current) {
      await github('PATCH', `/repos/${repoOwner}/${repoName}/labels/${encodeURIComponent(label.name)}`, {
        new_name: label.name,
        color: label.color,
        description: label.description,
      });
      results.push({ action: 'updated-label', label: label.name });
    } else {
      await github('POST', `/repos/${repoOwner}/${repoName}/labels`, label);
      results.push({ action: 'created-label', label: label.name });
    }
  }
  return results;
}

async function createIssues() {
  const index = readJson('site/reports/github-issues/index.json');
  const existing = dryRun ? new Map() : await listExistingIssues();
  const results = [];
  for (const entry of index.entries.slice(0, maxIssues)) {
    const body = readText(entry.issueDraft);
    if (dryRun) {
      results.push({ action: 'dry-run-issue', title: entry.title, labels: entry.labels });
      continue;
    }
    if (existing.has(entry.title)) {
      results.push({ action: 'existing-issue', title: entry.title, url: existing.get(entry.title).html_url });
      continue;
    }
    const issue = await github('POST', `/repos/${repoOwner}/${repoName}/issues`, {
      title: entry.title,
      body,
      labels: entry.labels,
    });
    results.push({ action: 'created-issue', title: entry.title, url: issue.html_url });
  }
  return results;
}

async function createPullRequests() {
  const index = readJson('site/reports/github-prs/index.json');
  const existing = dryRun ? new Map() : await listExistingPulls();
  const results = [];
  for (const entry of index.entries.slice(0, maxPrs)) {
    const relPath = `site/reports/github-prs/${entry.branch}.md`;
    const body = readTextIfExists(relPath) || readTextFromBranch(entry.branch, relPath) || fallbackPrBody(entry);
    const title = `${entry.branch}: ${entry.category}`;
    if (dryRun) {
      results.push({ action: 'dry-run-pr', title, head: entry.branch, base: entry.base });
      continue;
    }
    if (existing.has(entry.branch)) {
      results.push({ action: 'existing-pr', title, url: existing.get(entry.branch).html_url });
      continue;
    }
    const pr = await github('POST', `/repos/${repoOwner}/${repoName}/pulls`, {
      title,
      body,
      head: entry.branch,
      base: entry.base,
      draft: false,
    });
    results.push({ action: 'created-pr', title, url: pr.html_url });
  }
  return results;
}

const result = {
  repository: `${repoOwner}/${repoName}`,
  dryRun,
  generatedAt: new Date().toISOString(),
  labels: [],
  issues: [],
  pullRequests: [],
};

if (doLabels) result.labels = await syncLabels();
if (doIssues) result.issues = await createIssues();
if (doPrs) result.pullRequests = await createPullRequests();

console.log(JSON.stringify(result, null, 2));
