import fs from 'node:fs';
import path from 'node:path';

const repo = 'https://github.com/wangpinyu/taiwan-servo-website';
const reportsDir = path.join('site', 'reports');
const backlogPath = path.join(reportsDir, 'optimization-backlog.json');
const issueDir = path.join(reportsDir, 'github-issues');

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

function issueFileName(group) {
  return `${String(group.priority).padStart(2, '0')}-${group.branch}.md`;
}

function issueLabels(group) {
  const labels = ['spec-module', 'seo', 'uiux', 'download-links'];
  if ((group.source_pages || []).length > 0) labels.push('source-needed');
  if ((group.blocking_pages || []).some((page) => (page.warnings || []).some((warning) => String(warning).includes('large')))) {
    labels.push('blocked-server-large-file');
  }
  return labels;
}

const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
fs.mkdirSync(issueDir, { recursive: true });

const generatedAt = new Date().toISOString();
const entries = (backlog.categories || []).map((group) => {
  const fileName = issueFileName(group);
  const relPath = `site/reports/github-issues/${fileName}`;
  const localPath = path.join(issueDir, fileName);
  const title = `[${group.category}] 產品頁優化追蹤`;
  const labels = issueLabels(group);
  return {
    priority: group.priority,
    category: group.category,
    branch: group.branch,
    pages: group.total,
    blockingPages: (group.blocking_pages || []).length,
    sourcePages: (group.source_pages || []).length,
    statusCounts: group.status_counts || {},
    title,
    labels,
    issueDraft: relPath,
    issueDraftExists: fs.existsSync(localPath),
    issueNewUrl: `${repo}/issues/new?template=category-optimization.yml&title=${encodeURIComponent(title)}&labels=${encodeURIComponent(labels.join(','))}`,
  };
});

const output = {
  generatedAt,
  repository: repo,
  summary: {
    totalIssues: entries.length,
    totalPages: entries.reduce((sum, entry) => sum + entry.pages, 0),
    totalBlockingPages: entries.reduce((sum, entry) => sum + entry.blockingPages, 0),
    totalSourcePages: entries.reduce((sum, entry) => sum + entry.sourcePages, 0),
  },
  entries,
};

const md = [
  '# GitHub Issue 控制表',
  '',
  `更新時間：${generatedAt}`,
  '',
  '用途：每個產品分類或品牌建立一個 tracking issue，追蹤產品規格詳情、SEO、UIUX、下載連結與 QA 狀態。',
  '',
  '## 使用方式',
  '',
  '```powershell',
  'npm run workflow:issue-index',
  'powershell -ExecutionPolicy Bypass -File .\\tools\\prepare-github-issue.ps1 -Branch phase-1-smac-spec-standard',
  '```',
  '',
  '## Issue 草稿',
  '',
  '| # | Category | Branch | Pages | Blocking | Source needed | Labels | Draft | Create |',
  '| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |',
  ...entries.map((entry) => {
    const labels = entry.labels.map((label) => `\`${label}\``).join(' ');
    const draft = entry.issueDraftExists ? `[draft](./${path.basename(entry.issueDraft)})` : 'missing';
    return `| ${entry.priority} | ${mdEscape(entry.category)} | \`${entry.branch}\` | ${entry.pages} | ${entry.blockingPages} | ${entry.sourcePages} | ${labels} | ${draft} | [new issue](${entry.issueNewUrl}) |`;
  }),
  '',
  '## 驗收規則',
  '',
  '- 每個 issue 對應一個產品分類或品牌。',
  '- 對應分支與 PR 完成前，issue 保持 open。',
  '- `source-needed` 只用於官方資料缺失或來源衝突，不作為一般排版問題。',
  '- `blocked-server-large-file` 是已知伺服器/大檔策略標記，不阻塞本機 preview 優化。',
  '',
];

const rows = entries.map((entry) => `
  <tr>
    <td>${htmlEscape(entry.priority)}</td>
    <td>${htmlEscape(entry.category)}</td>
    <td><code>${htmlEscape(entry.branch)}</code></td>
    <td>${htmlEscape(entry.pages)}</td>
    <td>${htmlEscape(entry.blockingPages)}</td>
    <td>${htmlEscape(entry.sourcePages)}</td>
    <td>${entry.labels.map((label) => `<code>${htmlEscape(label)}</code>`).join(' ')}</td>
    <td>${entry.issueDraftExists ? `<a href="./${htmlEscape(path.basename(entry.issueDraft))}">draft</a>` : 'missing'}</td>
    <td><a href="${htmlEscape(entry.issueNewUrl)}">new issue</a></td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GitHub Issue 控制表</title>
  <style>
    body{font-family:Arial,"Noto Sans TC",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{white-space:nowrap}
    .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
    .card{background:#fff;border:1px solid #d8e2dc;border-radius:8px;padding:12px 16px}
  </style>
</head>
<body>
  <h1>GitHub Issue 控制表</h1>
  <p>Generated at ${htmlEscape(generatedAt)} from <code>optimization-backlog.json</code>.</p>
  <div class="summary">
    <div class="card">Issues: ${htmlEscape(output.summary.totalIssues)}</div>
    <div class="card">Pages: ${htmlEscape(output.summary.totalPages)}</div>
    <div class="card">Blocking pages: ${htmlEscape(output.summary.totalBlockingPages)}</div>
    <div class="card">Source-needed pages: ${htmlEscape(output.summary.totalSourcePages)}</div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Category</th><th>Branch</th><th>Pages</th><th>Blocking</th><th>Source</th><th>Labels</th><th>Draft</th><th>Create</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(path.join(issueDir, 'index.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(issueDir, 'index.md'), `${md.join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(issueDir, 'index.html'), html, 'utf8');

console.log(JSON.stringify({
  generatedAt,
  entries: entries.length,
  totalPages: output.summary.totalPages,
  blockingPages: output.summary.totalBlockingPages,
  sourcePages: output.summary.totalSourcePages,
  missingDrafts: entries.filter((entry) => !entry.issueDraftExists).map((entry) => entry.branch),
}, null, 2));
