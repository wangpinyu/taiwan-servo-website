import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'site', 'reports');
const reviewPath = path.join(reportsDir, 'product-spec-agent-review.json');
const outJson = path.join(reportsDir, 'optimization-backlog.json');
const outHtml = path.join(reportsDir, 'optimization-backlog.html');
const issueDir = path.join(reportsDir, 'github-issues');

const priorityOrder = [
  '電動缸',
  '驅動器',
  '各類馬達',
  'ACS 控制器 / 驅動器',
  'Harmonic Drive 減速機',
  'Renishaw 回授元件產品',
  '定位平台',
  '空氣軸承 / 滾珠•滾柱軸承',
  '聯軸器',
  'FMS 張力系統',
  '固態繼電器',
  '山洋電氣 SANYO DENKI',
  '特殊環境',
  '陶瓷吸盤',
  'SEJINIGB 滾輪齒排',
  '鼓風機',
  '自動化系統',
  '其他回授元件',
];

const phases = new Map([
  ['電動缸', 'phase-1-smac-spec-standard'],
  ['驅動器', 'phase-2-drivers-spec-review'],
  ['各類馬達', 'phase-2-motors-spec-review'],
  ['ACS 控制器 / 驅動器', 'phase-2-drivers-spec-review'],
  ['Harmonic Drive 減速機', 'phase-3-harmonic-drive'],
  ['Renishaw 回授元件產品', 'phase-3-renishaw-feedback'],
  ['定位平台', 'phase-3-positioning-stage'],
  ['空氣軸承 / 滾珠•滾柱軸承', 'phase-3-bearings-air-mechanical'],
  ['聯軸器', 'phase-4-couplings'],
  ['FMS 張力系統', 'phase-4-fms-tension'],
  ['固態繼電器', 'phase-4-solid-state-relays'],
  ['山洋電氣 SANYO DENKI', 'phase-4-sanyo-denki'],
  ['特殊環境', 'phase-4-special-environments'],
  ['陶瓷吸盤', 'phase-5-ceramic-chucks'],
  ['SEJINIGB 滾輪齒排', 'phase-5-sejinigb'],
  ['鼓風機', 'phase-5-blowers'],
  ['自動化系統', 'phase-5-automation-systems'],
  ['其他回授元件', 'phase-5-other-feedback'],
]);

function categoryOf(page) {
  return Array.isArray(page.category_path) && page.category_path.length ? page.category_path[0] : '(no category)';
}

function statusOf(page) {
  return page.agent_review?.status || 'unknown';
}

function priorityOf(category) {
  const idx = priorityOrder.indexOf(category);
  return idx === -1 ? 999 : idx + 1;
}

function branchFor(category) {
  if (phases.has(category)) return phases.get(category);
  const slug = category
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'misc';
  return `category-${slug}`;
}

function issueFileName(group) {
  return `${String(group.priority).padStart(2, '0')}-${group.branch}.md`;
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

const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const groups = new Map();

for (const page of review.pages || []) {
  const category = categoryOf(page);
  if (!groups.has(category)) {
    groups.set(category, {
      category,
      priority: priorityOf(category),
      branch: branchFor(category),
      total: 0,
      status_counts: {},
      pages: [],
      blocking_pages: [],
      source_pages: [],
    });
  }
  const group = groups.get(category);
  const status = statusOf(page);
  group.total += 1;
  group.status_counts[status] = (group.status_counts[status] || 0) + 1;
  const item = {
    product_id: page.product_id,
    title: page.title,
    preview_rel: page.preview_rel,
    overlay_status: page.overlay_status,
    qa_status: page.qa_status,
    agent_status: status,
    warnings: page.warnings || [],
    critical: page.critical || [],
  };
  group.pages.push(item);
  if (status !== 'agent-approved-clean' && status !== 'agent-approved-exception') group.blocking_pages.push(item);
  if (status.includes('source')) group.source_pages.push(item);
}

const categories = [...groups.values()].sort((a, b) => a.priority - b.priority || a.category.localeCompare(b.category, 'zh-Hant'));
const summary = {
  generated_at: new Date().toISOString(),
  total_categories: categories.length,
  total_pages: categories.reduce((sum, group) => sum + group.total, 0),
  total_blocking_pages: categories.reduce((sum, group) => sum + group.blocking_pages.length, 0),
  status_counts: categories.reduce((acc, group) => {
    for (const [status, count] of Object.entries(group.status_counts)) acc[status] = (acc[status] || 0) + count;
    return acc;
  }, {}),
};

await mkdir(issueDir, { recursive: true });
for (const entry of await readdir(issueDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    await rm(path.join(issueDir, entry.name));
  }
}

for (const group of categories) {
  const lines = [
    `# ${group.category} 產品頁優化追蹤`,
    '',
    `Branch: \`${group.branch}\``,
    `Priority: ${group.priority}`,
    `Pages: ${group.total}`,
    `Blocking pages: ${group.blocking_pages.length}`,
    '',
    '## Status counts',
    '',
    ...Object.entries(group.status_counts).map(([status, count]) => `- ${status}: ${count}`),
    '',
    '## Target pages',
    '',
    '| ID | Title | Status | Preview |',
    '| --- | --- | --- | --- |',
    ...group.pages.map((page) => `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | ${mdEscape(page.agent_status)} | ${mdEscape(page.preview_rel)} |`),
    '',
    '## Acceptance criteria',
    '',
    '- `npm run validate` passes.',
    '- Target pages are `agent-approved-clean`, or `source-needed` is justified.',
    '- `產品規格詳情` sits under `產品系列`.',
    '- Tables, accordions, CTAs, downloads, and SEO checks match project rules.',
    '- No public-facing internal notes, local paths, placeholder links, or `.txt` hrefs.',
    '',
  ];
  await writeFile(path.join(issueDir, issueFileName(group)), `${lines.join('\n')}\n`, 'utf8');
}

const output = { summary, categories };
await writeFile(outJson, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const rows = categories.map((group) => `
  <tr>
    <td>${htmlEscape(group.priority)}</td>
    <td>${htmlEscape(group.category)}</td>
    <td><code>${htmlEscape(group.branch)}</code></td>
    <td>${htmlEscape(group.total)}</td>
    <td>${htmlEscape(group.blocking_pages.length)}</td>
    <td>${htmlEscape(Object.entries(group.status_counts).map(([status, count]) => `${status}: ${count}`).join(' / '))}</td>
    <td><a href="./github-issues/${htmlEscape(issueFileName(group))}">issue draft</a></td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Optimization Backlog</title>
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
  <h1>Optimization Backlog</h1>
  <p>Generated at ${htmlEscape(summary.generated_at)} from <code>product-spec-agent-review.json</code>.</p>
  <div class="summary">
    <div class="card">Categories: ${htmlEscape(summary.total_categories)}</div>
    <div class="card">Pages: ${htmlEscape(summary.total_pages)}</div>
    <div class="card">Blocking pages: ${htmlEscape(summary.total_blocking_pages)}</div>
  </div>
  <table>
    <thead>
      <tr><th>Priority</th><th>Category</th><th>Branch</th><th>Pages</th><th>Blocking</th><th>Status counts</th><th>Issue draft</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`;

await writeFile(outHtml, html, 'utf8');
console.log(JSON.stringify(summary));
