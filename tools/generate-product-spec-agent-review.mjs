import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const specQaPath = path.join(reportDir, 'product-spec-module-qa.json');
const pageSeoQaPath = path.join(reportDir, 'product-page-structure-seo-qa.json');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function byProductId(report) {
  return new Map((report?.pages || []).map((page) => [String(page.product_id), page]));
}

function unknownHeadings(page) {
  return page?.validation?.unknownHeadings || [];
}

function classify({ specPage, seoPage, standardizationPage }) {
  const specCritical = specPage?.critical || [];
  const specWarnings = specPage?.warnings || [];
  const seoCritical = seoPage?.critical || [];
  const seoWarnings = seoPage?.warnings || [];
  const overlayStatus = specPage?.overlay_status || standardizationPage?.status || '';
  const unknown = unknownHeadings(standardizationPage);

  if (specCritical.length || seoCritical.length) {
    return {
      status: 'agent-blocked-critical',
      decision: '需先修正 critical',
      reason: [...specCritical, ...seoCritical].join(' / '),
    };
  }

  if (specPage?.qa_status === 'no-spec-module' || overlayStatus === 'no-spec-module') {
    return {
      status: 'agent-source-needed',
      decision: '缺少可用規格模組',
      reason: '目前沒有可插入的既有產品規格詳情模組；不得補寫未經來源支持的規格。',
    };
  }

  if (unknown.length || overlayStatus === 'needs-review-unknown-module') {
    return {
      status: 'agent-structure-review',
      decision: '需確認模組歸類',
      reason: unknown.length ? `未知或需人工命名判斷的模組：${unknown.join(' / ')}` : '頁面曾標記為 needs-review-unknown-module。',
    };
  }

  const allWarnings = [...specWarnings, ...seoWarnings];
  const onlyMissingSpecTable = allWarnings.length > 0 && allWarnings.every((warning) => warning === 'spec_table_missing');
  const hasUsableDocumentLink =
    (specPage?.counts?.pdf_links || 0) +
    (specPage?.counts?.cad_links || 0) +
    (specPage?.counts?.zip_links || 0) +
    (specPage?.counts?.external_document_links || 0) > 0;
  if (onlyMissingSpecTable && !hasUsableDocumentLink) {
    return {
      status: 'agent-source-needed',
      decision: '缺少可整理成規格表的來源',
      reason: '目前規格模組沒有可查核規格表，也沒有可整理成文件索引表的 PDF/CAD/ZIP 連結；不得補寫未經來源支持的規格。',
    };
  }

  if (specWarnings.length || seoWarnings.length) {
    return {
      status: 'agent-fix-required',
      decision: 'AI 可繼續修正',
      reason: allWarnings.join(' / '),
    };
  }

  return {
    status: 'agent-approved-clean',
    decision: 'AI agent 審核通過',
    reason: '規格模組與產品頁 SEO/結構 QA 均無 critical 或 warning。',
  };
}

if (!fs.existsSync(specQaPath) || !fs.existsSync(standardizationPath)) {
  console.error('Missing product spec QA or standardization report.');
  process.exit(1);
}

const specQa = readJson(specQaPath);
const pageSeoQa = readJson(pageSeoQaPath);
const standardization = readJson(standardizationPath);
const seoById = byProductId(pageSeoQa);
const standardizationById = byProductId(standardization);

const pages = (specQa.pages || []).map((specPage) => {
  const productId = String(specPage.product_id);
  const seoPage = seoById.get(productId);
  const standardizationPage = standardizationById.get(productId);
  const agentReview = classify({ specPage, seoPage, standardizationPage });
  return {
    ...specPage,
    page_seo_qa_status: seoPage?.qa_status || 'not-run',
    page_seo_warnings: seoPage?.warnings || [],
    page_seo_critical: seoPage?.critical || [],
    agent_review: agentReview,
  };
});

const statusCounts = {};
for (const page of pages) {
  const status = page.agent_review.status;
  statusCounts[status] = (statusCounts[status] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  scope: 'GitHub-ready AI agent review decisions',
  policy: {
    default_reviewer: 'AI agent',
    human_exception_only_for: ['official source inaccessible', 'source conflict', 'backend/template limitation', 'business decision'],
    review_inputs: [
      'product-spec-module-qa.json',
      'product-page-structure-seo-qa.json',
      'product-standardization-report.json',
    ],
  },
  summary: { total_pages: pages.length, agent_status_counts: statusCounts },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'product-spec-agent-review.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const rows = pages.map((page) => `<tr>
  <td>${htmlEscape(page.product_id)}</td>
  <td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
  <td>${htmlEscape(page.agent_review.status)}</td>
  <td>${htmlEscape(page.agent_review.decision)}</td>
  <td>${htmlEscape(page.agent_review.reason)}</td>
</tr>`).join('\n');

fs.writeFileSync(path.join(reportDir, 'product-spec-agent-review.html'), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Agent 產品頁審核</title>
  <style>
    body{font-family:Arial,"Noto Sans TC","Microsoft JhengHei",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
  </style>
</head>
<body>
  <h1>AI Agent 產品頁審核</h1>
  <p>整合產品規格詳情 QA、產品頁 SEO/結構 QA 與模組標準化報告，決定每頁是否可由 AI 繼續修正、需要來源補強，或已可視為乾淨通過。</p>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>ID</th><th>產品頁</th><th>AI 狀態</th><th>判定</th><th>原因</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`, 'utf8');

console.log(JSON.stringify({ status: 'ok', report: 'site/reports/product-spec-agent-review.html', summary: report.summary }, null, 2));
