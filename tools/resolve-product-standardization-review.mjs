import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');

const titleMappings = [
  { patterns: [/^MForce 產品型號總覽$/, /^全系列產品陣容$/, /^線性執行器系列選型$/], replacement: '產品系列' },
  {
    patterns: [
      /^規格與性能參數(?:\s*\([^)]*\))?$/,
      /^型號規格詳情$/,
      /^產品核心規格(?:\s*\([^)]*\))?$/,
      /^系統模組規格(?:\s*\([^)]*\))?$/,
    ],
    replacement: '產品規格詳情',
  },
  { patterns: [/^重點應用場景$/, /^產業應用範疇$/, /^行業應用實例$/], replacement: '應用領域' },
];

const allowedHeadings = [
  /^低壓工業鼓風機系列(?:\s*\([^)]*\))?$/i,
  /^中壓與高壓系列(?:\s*\([^)]*\))?$/i,
  /^特殊應用鼓風機$/i,
  /^ATEX 防爆與安全系列$/i,
  /^特殊材質系列$/i,
  /^蝸輪絲桿升降機系列(?:\s*\([^)]*\))?$/i,
  /^電動推桿系列(?:\s*\([^)]*\))?$/i,
  /^Xenus Plus 系列/i,
  /^Xenus 系列/i,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(value) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mappedTitle(title) {
  for (const rule of titleMappings) {
    if (rule.patterns.some((pattern) => pattern.test(title))) return rule.replacement;
  }
  return null;
}

function isAllowedTitle(title) {
  return allowedHeadings.some((pattern) => pattern.test(title));
}

function normalizePreviewPage(previewRel) {
  const file = path.join(root, previewRel);
  if (!fs.existsSync(file)) return { changed: false };
  const original = fs.readFileSync(file, 'utf8');
  let changed = false;
  const updated = original.replace(/<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const replacement = mappedTitle(stripTags(inner));
    if (!replacement) return match;
    changed = true;
    return `<h${level}${attrs}>${replacement}</h${level}>`;
  });
  if (changed) fs.writeFileSync(file, updated, 'utf8');
  return { changed };
}

function statusFor(page) {
  if (page.status === 'needs-review-unknown-module') {
    if (page.validation?.warnings?.length) return 'inserted-with-warnings';
    if (page.anchor === 'inserted-before-application') return 'inserted-before-application';
    if (page.anchor && page.anchor.startsWith('inserted')) return 'inserted';
  }
  return page.status;
}

function renderReportHtml(report) {
  const cards = Object.entries(report.summary.status_counts || {})
    .map(([key, value]) => `<div class="card"><div>${htmlEscape(key)}</div><strong>${htmlEscape(value)}</strong></div>`)
    .join('\n');
  const categoryRows = Object.entries(report.summary.category_status_counts || {})
    .map(([category, counts]) => {
      const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
      const statusText = Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(' / ');
      return `<tr><td>${htmlEscape(category)}</td><td>${total}</td><td>${htmlEscape(statusText)}</td></tr>`;
    })
    .join('\n');
  const rows = (report.pages || [])
    .map((page) => `<tr class="status-${htmlEscape(page.status)}">
<td>${htmlEscape(page.product_id)}</td>
<td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
<td>${htmlEscape((page.category_path || []).join(' › '))}</td>
<td><span class="badge">${htmlEscape(page.status)}</span></td>
<td>${htmlEscape(page.anchor || '')}</td>
<td>${htmlEscape(page.spec_candidate_rel || '')}</td>
<td>${htmlEscape((page.validation?.unknownHeadings || []).join(' / '))}</td>
<td>${htmlEscape((page.validation?.warnings || []).join(' / '))}</td>
</tr>`)
    .join('\n');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>產品頁標準化報告</title>
<style>body{font-family:Arial,'Noto Sans TC',sans-serif;margin:24px;background:#fbfdfb;color:#17251d}.summary{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.card{border:1px solid #d9e6dc;background:#fff;border-radius:8px;padding:12px 16px;min-width:150px}.card strong{font-size:24px;color:#00843d}table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d9e6dc}th,td{border-bottom:1px solid #e6eee8;padding:8px 9px;text-align:left;vertical-align:top;font-size:13px}th{background:#edf6f0}.badge{border-radius:999px;padding:3px 8px;background:#e8f3ec}.status-inserted .badge{background:#dff2e6;color:#00682c}.status-inserted-before-application .badge,.status-needs-review-unknown-module .badge,.status-inserted-with-warnings .badge{background:#fff3cd;color:#735c00}.status-no-spec-module .badge{background:#f4eee2;color:#77520c}</style></head><body>
<h1>產品頁標準化報告</h1><p>本報告只反映本機 preview overlay 狀態，沒有後台保存或上架。</p><div class="summary">${cards}</div>
<p><a href="product-standardization-report.json">查看 JSON</a></p>
<h2>分類狀態彙總</h2>
<table><thead><tr><th>正式網分類路徑</th><th>頁數</th><th>狀態統計</th></tr></thead><tbody>${categoryRows}</tbody></table>
<h2>逐頁結果</h2>
<table><thead><tr><th>ID</th><th>產品</th><th>分類</th><th>狀態</th><th>插入位置</th><th>規格候選</th><th>未知標題</th><th>警告</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

if (!fs.existsSync(standardizationPath)) {
  console.error(`Missing ${standardizationPath}`);
  process.exit(1);
}

const report = readJson(standardizationPath);
let htmlPagesChanged = 0;
let unknownResolved = 0;

for (const page of report.pages || []) {
  const normalized = normalizePreviewPage(page.preview_rel);
  if (normalized.changed) htmlPagesChanged += 1;

  const unknown = page.validation?.unknownHeadings || [];
  const remaining = unknown.filter((title) => !mappedTitle(title) && !isAllowedTitle(title));
  unknownResolved += unknown.length - remaining.length;
  if (page.validation) page.validation.unknownHeadings = remaining;
  page.status = remaining.length ? page.status : statusFor(page);
}

const statusCounts = {};
const categoryStatusCounts = {};
for (const page of report.pages || []) {
  statusCounts[page.status] = (statusCounts[page.status] || 0) + 1;
  const category = (page.category_path || []).slice(0, 2).join(' / ') || '未分類';
  categoryStatusCounts[category] ||= {};
  categoryStatusCounts[category][page.status] = (categoryStatusCounts[category][page.status] || 0) + 1;
}
report.summary = {
  ...(report.summary || {}),
  status_counts: statusCounts,
  category_status_counts: categoryStatusCounts,
  unknown_heading_count: (report.pages || []).reduce((sum, page) => sum + (page.validation?.unknownHeadings || []).length, 0),
  resolved_by_agent_rule_count: unknownResolved,
  html_pages_changed_by_agent_rule_count: htmlPagesChanged,
};

writeJson(standardizationPath, report);
fs.writeFileSync(path.join(reportDir, 'product-standardization-report.html'), renderReportHtml(report), 'utf8');

console.log(JSON.stringify({
  status: 'ok',
  report: 'site/reports/product-standardization-report.html',
  resolved_by_agent_rule_count: unknownResolved,
  html_pages_changed_by_agent_rule_count: htmlPagesChanged,
  remaining_unknown_heading_count: report.summary.unknown_heading_count,
}, null, 2));
