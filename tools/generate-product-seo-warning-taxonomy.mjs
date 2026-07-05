import fs from 'node:fs';
import path from 'node:path';

const reportsDir = path.join('site', 'reports');
const seoPath = path.join(reportsDir, 'product-page-structure-seo-qa.json');
const outJson = path.join(reportsDir, 'product-seo-warning-taxonomy.json');
const outHtml = path.join(reportsDir, 'product-seo-warning-taxonomy.html');

const branchByCategory = new Map([
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

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function warningType(warning) {
  if (warning === 'spec_table_missing') return 'spec-table-missing';
  if (/^table_\d+_unit_header_not_detected$/.test(warning)) return 'table-unit-header';
  if (/^table_\d+_model_header_not_detected$/.test(warning)) return 'table-model-header';
  if (/^body_title_tag:/.test(warning)) return 'body-title-tag';
  if (/^download_link_weak_label:/.test(warning)) return 'download-label';
  if (/^spec_no_cta/.test(warning)) return 'cta-missing';
  if (/^accordion_/.test(warning)) return 'accordion';
  return 'other';
}

function remediationFor(type) {
  switch (type) {
    case 'spec-table-missing':
      return '確認是否為文件型規格模組；若有官方表格來源，補上真正 table；若無來源，標記 source-needed 或保留文件下載型呈現。';
    case 'table-unit-header':
      return '依原廠欄位補上單位，例如 Stroke (mm)、Peak Force (N)、Torque (Nm)；不要推測不存在的單位。';
    case 'table-model-header':
      return '確認第一欄是否為系列或型號；表頭應使用 型號、系列、Part Number 或等價原廠欄位。';
    case 'download-label':
      return '下載入口需清楚區分 PDF、CAD、Manual、Catalog、Drawing、Software 或 請洽星泰。';
    case 'cta-missing':
      return '規格模組至少提供可用詢問入口；無法帶入型號時，使用既有詢問流程，不在前台顯示 TODO。';
    case 'accordion':
      return '下拉區需使用 details/summary 或 button 搭配 aria-expanded 與 aria-controls。';
    case 'body-title-tag':
      return '執行 npm run fix:body-title-tags 清除 body 內殘留 title。';
    default:
      return '人工檢查 warning 是否為真問題，再決定修 validator 或修內容。';
  }
}

const report = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
const entries = [];
const typeCounts = new Map();
const categoryCounts = new Map();
const branchCounts = new Map();

for (const page of report.pages || []) {
  const category = Array.isArray(page.category_path) && page.category_path.length ? page.category_path[0] : '(no category)';
  const branch = branchByCategory.get(category) || 'category-review';
  for (const warning of page.warnings || []) {
    const type = warningType(warning);
    const entry = {
      product_id: page.product_id,
      title: page.title,
      category,
      branch,
      preview_rel: page.preview_rel,
      warning,
      warning_type: type,
      remediation: remediationFor(type),
    };
    entries.push(entry);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    branchCounts.set(branch, (branchCounts.get(branch) || 0) + 1);
  }
}

const summary = {
  generated_at: new Date().toISOString(),
  total_warning_entries: entries.length,
  affected_pages: new Set(entries.map((entry) => entry.product_id)).size,
  warning_type_counts: Object.fromEntries([...typeCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  category_warning_counts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))),
  branch_warning_counts: Object.fromEntries([...branchCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
};

const output = { summary, entries };
fs.writeFileSync(outJson, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const typeRows = Object.entries(summary.warning_type_counts).map(([type, count]) => `
  <tr>
    <td><code>${htmlEscape(type)}</code></td>
    <td>${htmlEscape(count)}</td>
    <td>${htmlEscape(remediationFor(type))}</td>
  </tr>`).join('\n');

const entryRows = entries.map((entry) => `
  <tr>
    <td>${htmlEscape(entry.product_id)}</td>
    <td>${htmlEscape(entry.title)}</td>
    <td>${htmlEscape(entry.category)}</td>
    <td><code>${htmlEscape(entry.branch)}</code></td>
    <td><code>${htmlEscape(entry.warning_type)}</code></td>
    <td><code>${htmlEscape(entry.warning)}</code></td>
    <td><a href="../${htmlEscape(entry.preview_rel)}">${htmlEscape(entry.preview_rel)}</a></td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Product SEO Warning Taxonomy</title>
  <style>
    body{font-family:Arial,"Noto Sans TC",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff;margin:16px 0}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed;position:sticky;top:0}
    code{white-space:nowrap}
    .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
    .card{background:#fff;border:1px solid #d8e2dc;border-radius:8px;padding:12px 16px}
  </style>
</head>
<body>
  <h1>Product SEO Warning Taxonomy</h1>
  <p>Generated at ${htmlEscape(summary.generated_at)} from <code>product-page-structure-seo-qa.json</code>.</p>
  <div class="summary">
    <div class="card">Warning entries: ${htmlEscape(summary.total_warning_entries)}</div>
    <div class="card">Affected pages: ${htmlEscape(summary.affected_pages)}</div>
  </div>
  <h2>Fix Types</h2>
  <table>
    <thead><tr><th>Type</th><th>Count</th><th>Batch remediation</th></tr></thead>
    <tbody>${typeRows}</tbody>
  </table>
  <h2>Warning Entries</h2>
  <table>
    <thead><tr><th>ID</th><th>Product</th><th>Category</th><th>Branch</th><th>Type</th><th>Raw warning</th><th>Preview</th></tr></thead>
    <tbody>${entryRows}</tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(outHtml, html, 'utf8');
console.log(JSON.stringify({ status: 'ok', report: outHtml, summary }, null, 2));
