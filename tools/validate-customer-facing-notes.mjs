import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('site/preview');
const reportDir = path.resolve('site/reports');
const outJson = path.join(reportDir, 'customer-facing-notes-validation.json');
const outHtml = path.join(reportDir, 'customer-facing-notes-validation.html');

const blockedTerms = [
  '後台',
  '供後',
  '先保留',
  '待人工',
  '後續由人工',
  '佔位',
  '後 URL',
  'href 由 #',
  '上架提醒',
  'CKEditor',
  'Codex',
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(path.resolve('site'), file).replace(/\\/g, '/');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function snippet(html, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(html.length, index + 160);
  return html.slice(start, end).replace(/\s+/g, ' ').trim();
}

const issues = [];

const files = walk(root).filter((file) => !rel(file).startsWith('preview/skipped/'));

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const term of blockedTerms) {
    let index = html.indexOf(term);
    while (index !== -1) {
      issues.push({
        file: rel(file),
        term,
        snippet: snippet(html, index),
      });
      index = html.indexOf(term, index + term.length);
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  checked_scope: 'site/preview/**/*.html',
  blocked_terms: blockedTerms,
  summary: {
    files_checked: files.length,
    issue_count: issues.length,
  },
  issues,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const rows = issues.map((issue) => `
  <tr>
    <td>${htmlEscape(issue.file)}</td>
    <td><code>${htmlEscape(issue.term)}</code></td>
    <td>${htmlEscape(issue.snippet)}</td>
  </tr>`).join('');

fs.writeFileSync(outHtml, `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>Customer-facing Notes Validation</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#173326}
    table{border-collapse:collapse;width:100%}
    th,td{border-bottom:1px solid #d8e5dc;padding:8px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{white-space:nowrap}
  </style>
</head>
<body>
  <h1>Customer-facing Notes Validation</h1>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>File</th><th>Term</th><th>Snippet</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`, 'utf8');

console.log(JSON.stringify({
  status: issues.length ? 'issues' : 'ok',
  report: 'site/reports/customer-facing-notes-validation.html',
  summary: report.summary,
}, null, 2));

if (issues.length) process.exit(1);
