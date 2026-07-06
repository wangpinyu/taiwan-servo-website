import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const agentReviewPath = path.join(reportDir, 'product-spec-agent-review.json');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');
const outJson = path.join(reportDir, 'source-needed-audit.json');
const outHtml = path.join(reportDir, 'source-needed-audit.html');
const outMd = path.join(reportDir, 'source-needed-audit.md');

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

function classifyDisposition(page) {
  const review = page.agent_review || {};
  if (review.disposition) {
    return {
      disposition: review.disposition,
      reason: review.reason || '',
      nextAction: '依 AI 審核結果處理；若要公開優化，請使用對應的非硬體內容 schema，不要套用硬體產品規格表。',
    };
  }

  return {
    disposition: 'official-source-needed',
    reason: review.reason || '缺少可驗證的官方來源或既有可信規格資料。',
    nextAction: '查找官方產品頁、官方 PDF、既有可信本機資料包，再建立或修正產品規格詳情模組。',
  };
}

if (!fs.existsSync(agentReviewPath) || !fs.existsSync(standardizationPath)) {
  console.error('Missing product spec review reports. Run npm run validate first.');
  process.exit(1);
}

const agentReview = JSON.parse(fs.readFileSync(agentReviewPath, 'utf8'));
const standardization = JSON.parse(fs.readFileSync(standardizationPath, 'utf8'));
const standardizationById = new Map((standardization.pages || []).map((page) => [String(page.product_id), page]));

const pages = (agentReview.pages || [])
  .filter((page) => page.agent_review?.status === 'agent-source-needed')
  .map((page) => {
    const std = standardizationById.get(String(page.product_id));
    const disposition = classifyDisposition(page);
    return {
      product_id: String(page.product_id),
      title: page.title,
      category_path: page.category_path || [],
      preview_rel: page.preview_rel,
      agent_status: page.agent_review?.status || 'unknown',
      qa_status: page.qa_status,
      overlay_status: page.overlay_status,
      spec_candidate_rel: page.spec_candidate_rel || '',
      validation: {
        hasSeries: Boolean(std?.validation?.hasSeries),
        hasApplications: Boolean(std?.validation?.hasApplications),
        hasDownloads: Boolean(std?.validation?.hasDownloads),
        tables: std?.validation?.tables || 0,
        pdfLinks: std?.validation?.pdfLinks || 0,
        unknownHeadings: std?.validation?.unknownHeadings || [],
      },
      ...disposition,
    };
  });

const exceptionPages = (agentReview.pages || [])
  .filter((page) => page.agent_review?.status === 'agent-approved-exception')
  .map((page) => ({
    product_id: String(page.product_id),
    title: page.title,
    category_path: page.category_path || [],
    preview_rel: page.preview_rel,
    agent_status: page.agent_review.status,
    disposition: page.agent_review.disposition,
    reason: page.agent_review.reason,
  }));

const dispositionCounts = {};
for (const page of pages) {
  dispositionCounts[page.disposition] = (dispositionCounts[page.disposition] || 0) + 1;
}

const exceptionCounts = {};
for (const page of exceptionPages) {
  exceptionCounts[page.disposition] = (exceptionCounts[page.disposition] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  scope: 'Source-needed audit for product pages',
  policy: {
    noSpecWithoutSource: true,
    noInventedSpecifications: true,
    reviewOwner: 'AI agent, with human escalation only for business/source decisions',
    approvedExceptionsAreNotBlocking: true,
    nonHardwareSchemaReference: 'docs/non-hardware-product-page-schema.md',
  },
  summary: {
    total_pages: pages.length,
    disposition_counts: dispositionCounts,
    approved_exception_pages: exceptionPages.length,
    approved_exception_counts: exceptionCounts,
  },
  pages,
  approved_exceptions: exceptionPages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const md = [
  '# Source-needed Audit',
  '',
  `Generated at: ${report.generated_at}`,
  '',
  'This report separates true official-source gaps from AI-approved non-standard pages. Hardware products still require verified manufacturer sources before a specification table is created. Software, training, test, and informational pages should use the non-hardware content schema instead of the hardware product specification table.',
  '',
  'Schema reference: `docs/non-hardware-product-page-schema.md`',
  '',
  '## Summary',
  '',
  `- Source-needed pages: ${report.summary.total_pages}`,
  `- Approved exception pages: ${report.summary.approved_exception_pages}`,
  '',
  '## Source-needed Pages',
  '',
  '| ID | Title | Category | Disposition | Reason | Next action | Preview |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...(pages.length ? pages.map((page) => `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | ${mdEscape(page.category_path.join(' / '))} | ${mdEscape(page.disposition)} | ${mdEscape(page.reason)} | ${mdEscape(page.nextAction)} | ${mdEscape(page.preview_rel)} |`) : ['| — | — | — | — | — | — | — |']),
  '',
  '## Approved Exceptions',
  '',
  '| ID | Title | Category | Disposition | Reason | Preview |',
  '| --- | --- | --- | --- | --- | --- |',
  ...exceptionPages.map((page) => `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | ${mdEscape(page.category_path.join(' / '))} | ${mdEscape(page.disposition)} | ${mdEscape(page.reason)} | ${mdEscape(page.preview_rel)} |`),
  '',
];
fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

const sourceRows = pages.length ? pages.map((page) => `
  <tr>
    <td>${htmlEscape(page.product_id)}</td>
    <td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
    <td>${htmlEscape(page.category_path.join(' / '))}</td>
    <td><code>${htmlEscape(page.disposition)}</code></td>
    <td>${htmlEscape(page.reason)}</td>
    <td>${htmlEscape(page.nextAction)}</td>
  </tr>`).join('\n') : '<tr><td colspan="6">No source-needed product pages.</td></tr>';

const exceptionRows = exceptionPages.map((page) => `
  <tr>
    <td>${htmlEscape(page.product_id)}</td>
    <td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
    <td>${htmlEscape(page.category_path.join(' / '))}</td>
    <td><code>${htmlEscape(page.disposition)}</code></td>
    <td>${htmlEscape(page.reason)}</td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Source-needed Audit</title>
  <style>
    body{font-family:Arial,"Noto Sans TC",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff;margin:16px 0 28px}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{white-space:nowrap}
    .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
    .card{background:#fff;border:1px solid #d8e2dc;border-radius:8px;padding:12px 16px}
  </style>
</head>
<body>
  <h1>Source-needed Audit</h1>
  <p>This report separates true official-source gaps from AI-approved non-standard pages. Non-hardware pages should use <code>docs/non-hardware-product-page-schema.md</code> instead of the hardware product specification table.</p>
  <div class="summary">
    <div class="card">Source-needed pages: ${htmlEscape(report.summary.total_pages)}</div>
    <div class="card">Approved exceptions: ${htmlEscape(report.summary.approved_exception_pages)}</div>
  </div>
  <h2>Source-needed Pages</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Title</th><th>Category</th><th>Disposition</th><th>Reason</th><th>Next action</th></tr>
    </thead>
    <tbody>${sourceRows}</tbody>
  </table>
  <h2>Approved Exceptions</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Title</th><th>Category</th><th>Disposition</th><th>Reason</th></tr>
    </thead>
    <tbody>${exceptionRows}</tbody>
  </table>
</body>
</html>
`;
fs.writeFileSync(outHtml, html, 'utf8');

console.log(JSON.stringify({
  status: 'ok',
  report: 'site/reports/source-needed-audit.html',
  summary: report.summary,
}, null, 2));
