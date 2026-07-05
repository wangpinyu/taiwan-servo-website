import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'site', 'reports');
fs.mkdirSync(reportDir, { recursive: true });

const docs = [
  'README.md',
  'docs/github-optimization-workflow.md',
  'docs/github-private-repo-setup.md',
  'docs/product-spec-data-schema.md',
  'docs/products-page-architecture.md',
  'docs/spec-module-review-log.md',
];

const mojibakePatterns = [/嚗/, /閬/, /蝯/, /銝/, /摰/, /撱/, /鞈/, /璅/, /�/];

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readUtf8(relPath) {
  try {
    return fs.readFileSync(path.join(root, relPath), 'utf8');
  } catch (error) {
    return { error: error.message };
  }
}

const checks = docs.map((relPath) => {
  const text = readUtf8(relPath);
  if (typeof text !== 'string') {
    return { file: relPath, status: 'error', error: text.error };
  }
  const title = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const mojibakeHits = mojibakePatterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  const errors = [];
  if (!title.startsWith('# ')) errors.push('missing_top_level_title');
  if (text.includes('\uFFFD')) errors.push('replacement_character');
  if (mojibakeHits.length) errors.push('mojibake_pattern');
  return {
    file: relPath,
    status: errors.length ? 'error' : 'pass',
    title,
    chars: text.length,
    errors,
    mojibakeHits,
  };
});

const errors = checks.filter((check) => check.status === 'error');
const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length ? 'issues' : 'ok',
  summary: {
    docs: checks.length,
    errors: errors.length,
  },
  checks,
};

fs.writeFileSync(path.join(reportDir, 'docs-readability-validation.json'), JSON.stringify(report, null, 2), 'utf8');

const rows = checks.map((check) => `<tr>
  <td>${htmlEscape(check.status)}</td>
  <td>${htmlEscape(check.file)}</td>
  <td>${htmlEscape(check.title || '')}</td>
  <td>${htmlEscape((check.errors || []).join(', '))}</td>
  <td>${htmlEscape((check.mojibakeHits || []).join(', '))}</td>
</tr>`).join('');

fs.writeFileSync(
  path.join(reportDir, 'docs-readability-validation.html'),
  `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Docs Readability Validation</title><style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{background:#eef7f0}</style></head><body><h1>Docs Readability Validation</h1><pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre><table><thead><tr><th>Status</th><th>File</th><th>Title</th><th>Errors</th><th>Mojibake hits</th></tr></thead><tbody>${rows}</tbody></table></body></html>`,
  'utf8',
);

console.log(JSON.stringify({ status: report.status, report: 'site/reports/docs-readability-validation.html', summary: report.summary }, null, 2));
if (errors.length) process.exit(1);
