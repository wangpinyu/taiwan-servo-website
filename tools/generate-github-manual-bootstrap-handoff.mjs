import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const repoSlug = 'wangpinyu/taiwan-servo-website';
const reportDir = path.join(repoRoot, 'site', 'reports');
const issueDir = path.join(reportDir, 'github-issues');
const prDir = path.join(reportDir, 'github-prs');
const outJson = path.join(reportDir, 'github-manual-bootstrap-handoff.json');
const outHtml = path.join(reportDir, 'github-manual-bootstrap-handoff.html');
const outMd = path.join(reportDir, 'github-manual-bootstrap-handoff.md');
const urlBodyLimit = 7800;

function readJson(relPath, fallback = null) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return fallback;
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function readText(absPath) {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : '';
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

function readLabels() {
  const yml = readText(path.join(repoRoot, '.github', 'labels.yml'));
  const blocks = yml.split(/\n(?=- name: )/g).filter(Boolean);
  return blocks.map((block) => {
    const name = block.match(/^- name:\s*(.+)$/m)?.[1]?.trim() || '';
    const color = block.match(/^\s*color:\s*"?([^"\n]+)"?/m)?.[1]?.trim() || '';
    const description = block.match(/^\s*description:\s*(.+)$/m)?.[1]?.trim() || '';
    return { name, color, description };
  }).filter((label) => label.name);
}

function githubIssueUrl(entry, body) {
  const title = entry.title || `[${entry.category}] 產品頁優化追蹤`;
  const labels = Array.isArray(entry.labels) ? entry.labels.join(',') : '';
  const base = `https://github.com/${repoSlug}/issues/new?title=${encodeURIComponent(title)}&labels=${encodeURIComponent(labels)}`;
  const withBody = `${base}&body=${encodeURIComponent(body)}`;
  return {
    url: withBody.length <= urlBodyLimit ? withBody : base,
    bodyIncluded: withBody.length <= urlBodyLimit,
  };
}

function githubPrUrl(entry, body) {
  const title = `${entry.category || entry.branch} 產品頁優化`;
  const baseBranch = entry.base || 'main';
  const base = `https://github.com/${repoSlug}/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(entry.branch)}?quick_pull=1&title=${encodeURIComponent(title)}`;
  const withBody = `${base}&body=${encodeURIComponent(body)}`;
  return {
    url: withBody.length <= urlBodyLimit ? withBody : base,
    bodyIncluded: withBody.length <= urlBodyLimit,
  };
}

const issueIndex = readJson('site/reports/github-issues/index.json', { entries: [] });
const prIndex = readJson('site/reports/github-prs/index.json', { entries: [] });
const readiness = readJson('site/reports/github-bootstrap-readiness.json', {});
const remoteVerification = readJson('site/reports/github-remote-state-verification.json', {});
const labels = readLabels();

const issues = (issueIndex.entries || []).map((entry) => {
  const draftName = path.basename(entry.issueDraft || '');
  const draftPath = path.join(issueDir, draftName);
  const draftBody = readText(draftPath);
  const link = githubIssueUrl(entry, draftBody);
  return {
    priority: entry.priority,
    category: entry.category,
    branch: entry.branch,
    pages: entry.pages,
    labels: entry.labels || [],
    draftRel: `site/reports/github-issues/${draftName}`,
    draftExists: Boolean(draftName && fs.existsSync(draftPath)),
    createUrl: link.url,
    bodyIncludedInUrl: link.bodyIncluded,
  };
});

const prs = (prIndex.entries || []).map((entry) => {
  const draftName = `${entry.branch}.md`;
  const draftPath = path.join(prDir, draftName);
  const draftBody = readText(draftPath);
  const link = githubPrUrl(entry, draftBody);
  return {
    priority: entry.priority,
    category: entry.category,
    branch: entry.branch,
    base: entry.base || 'main',
    pages: entry.smoke?.pages ?? null,
    checks: entry.smoke?.checks ?? null,
    failures: entry.smoke?.failures ?? null,
    draftRel: `site/reports/github-prs/${draftName}`,
    draftExists: fs.existsSync(draftPath),
    createUrl: link.url,
    bodyIncludedInUrl: link.bodyIncluded,
  };
});

const handoff = {
  generatedAt: new Date().toISOString(),
  repository: `https://github.com/${repoSlug}`,
  mode: 'manual-browser-fallback',
  tokenRequired: false,
  userLoginRequired: true,
  automaticApiBootstrapAvailable: true,
  apiStatus: {
    readinessStatus: readiness.status || 'unknown',
    remoteStatus: remoteVerification.status || 'unknown',
    tokenPresent: Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN),
    pullRequestRefs: readiness.pullRequestRefs || remoteVerification.gitRemote?.pullRequestRefs || 0,
  },
  counts: {
    labels: labels.length,
    issues: issues.length,
    prs: prs.length,
    issueBodiesIncludedInUrl: issues.filter((item) => item.bodyIncludedInUrl).length,
    prBodiesIncludedInUrl: prs.filter((item) => item.bodyIncludedInUrl).length,
  },
  manualOrder: [
    '先確認已登入 GitHub 且 repo 可進入。',
    '先依本頁 Labels 表格建立 7 個 labels；如果 repo 已有同名 labels，只需確認顏色與描述。',
    '依序建立 18 個 tracking issues。',
    '先建立 phase-1-smac-spec-standard PR；其餘 PR 可等 phase 1 接受後再開，或依 base branch 建立 stacked PR。',
    '建立後執行 npm run workflow:github-remote-verify 與 npm run validate:external-handoff。',
  ],
  labelSettingsUrl: `https://github.com/${repoSlug}/labels`,
  labels,
  issues,
  prs,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

const issueRows = issues.map((item) => `<tr>
  <td>${htmlEscape(item.priority)}</td>
  <td>${htmlEscape(item.category)}</td>
  <td><code>${htmlEscape(item.branch)}</code></td>
  <td>${htmlEscape(item.pages)}</td>
  <td>${item.labels.map((label) => `<code>${htmlEscape(label)}</code>`).join(' ')}</td>
  <td>${item.draftExists ? `<a href="github-issues/${htmlEscape(path.basename(item.draftRel))}">草案</a>` : 'missing'}</td>
  <td>${item.bodyIncludedInUrl ? '已包含' : '需貼上草案'}</td>
  <td><a href="${htmlEscape(item.createUrl)}">建立 issue</a></td>
</tr>`).join('\n');

const labelRows = labels.map((label) => `<tr>
  <td><code>${htmlEscape(label.name)}</code></td>
  <td><code>${htmlEscape(label.color)}</code></td>
  <td>${htmlEscape(label.description)}</td>
</tr>`).join('\n');

const prRows = prs.map((item) => `<tr>
  <td>${htmlEscape(item.priority)}</td>
  <td>${htmlEscape(item.category)}</td>
  <td><code>${htmlEscape(item.branch)}</code></td>
  <td><code>${htmlEscape(item.base)}</code></td>
  <td>${htmlEscape(item.pages ?? '')}</td>
  <td>${htmlEscape(item.failures ?? '')}</td>
  <td>${item.draftExists ? `<a href="github-prs/${htmlEscape(path.basename(item.draftRel))}">草案</a>` : 'missing'}</td>
  <td>${item.bodyIncludedInUrl ? '已包含' : '需貼上草案'}</td>
  <td><a href="${htmlEscape(item.createUrl)}">建立 PR</a></td>
</tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GitHub Manual Bootstrap Handoff</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff;margin:16px 0 32px}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{background:#edf4ef;padding:2px 5px;border-radius:4px;white-space:nowrap}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .warn{background:#fff8e6;border:1px solid #ead99c;border-radius:8px;padding:12px}
    a{color:#087d3d}
  </style>
</head>
<body>
  <h1>GitHub Manual Bootstrap Handoff</h1>
  <p>這是沒有 GitHub token 時的手動替代流程。它不會自動建立 GitHub 物件；你需要登入 GitHub 後逐一開啟連結並確認送出。</p>
  <div class="warn">若可以提供 fine-grained token，仍建議使用 <code>npm run github:bootstrap:safe</code>，速度較快且可自動驗證。</div>
  <div class="grid">
    <div class="card">Labels: <strong>${htmlEscape(labels.length)}</strong></div>
    <div class="card">Issues: <strong>${htmlEscape(issues.length)}</strong></div>
    <div class="card">PRs: <strong>${htmlEscape(prs.length)}</strong></div>
    <div class="card">Token required: <strong>false</strong></div>
    <div class="card">Login required: <strong>true</strong></div>
  </div>
  <h2>手動順序</h2>
  <ol>${handoff.manualOrder.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ol>
  <h2>Labels</h2>
  <p>GitHub labels 管理頁：<a href="${htmlEscape(handoff.labelSettingsUrl)}">${htmlEscape(handoff.labelSettingsUrl)}</a></p>
  <table>
    <thead><tr><th>Name</th><th>Color</th><th>Description</th></tr></thead>
    <tbody>${labelRows}</tbody>
  </table>
  <h2>Tracking Issues</h2>
  <table>
    <thead><tr><th>#</th><th>分類</th><th>分支</th><th>頁數</th><th>Labels</th><th>草案</th><th>Body</th><th>建立</th></tr></thead>
    <tbody>${issueRows}</tbody>
  </table>
  <h2>Pull Requests</h2>
  <table>
    <thead><tr><th>#</th><th>分類</th><th>分支</th><th>Base</th><th>頁數</th><th>Failures</th><th>草案</th><th>Body</th><th>建立</th></tr></thead>
    <tbody>${prRows}</tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(outHtml, html, 'utf8');

const md = [
  '# GitHub Manual Bootstrap Handoff',
  '',
  `Generated at: ${handoff.generatedAt}`,
  '',
  '這是沒有 GitHub token 時的手動替代流程。你需要登入 GitHub 後逐一開啟連結並確認送出。',
  '',
  '## 手動順序',
  '',
  ...handoff.manualOrder.map((item, index) => `${index + 1}. ${item}`),
  '',
  '## Labels',
  '',
  `GitHub labels 管理頁：${handoff.labelSettingsUrl}`,
  '',
  '| Name | Color | Description |',
  '| --- | --- | --- |',
  ...labels.map((label) => `| \`${mdEscape(label.name)}\` | \`${mdEscape(label.color)}\` | ${mdEscape(label.description)} |`),
  '',
  '## Tracking Issues',
  '',
  '| # | 分類 | 分支 | 頁數 | 草案 | 建立 |',
  '| --- | --- | --- | ---: | --- | --- |',
  ...issues.map((item) => `| ${item.priority} | ${mdEscape(item.category)} | \`${item.branch}\` | ${item.pages} | ${item.draftRel} | ${item.createUrl} |`),
  '',
  '## Pull Requests',
  '',
  '| # | 分類 | 分支 | Base | 頁數 | 草案 | 建立 |',
  '| --- | --- | --- | --- | ---: | --- | --- |',
  ...prs.map((item) => `| ${item.priority} | ${mdEscape(item.category)} | \`${item.branch}\` | \`${item.base}\` | ${item.pages ?? ''} | ${item.draftRel} | ${item.createUrl} |`),
  '',
];

fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  status: 'manual-handoff-ready',
  report: 'site/reports/github-manual-bootstrap-handoff.html',
  issues: issues.length,
  prs: prs.length,
  labels: labels.length,
  tokenRequired: false,
}, null, 2));
