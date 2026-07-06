import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const specQaPath = path.join(reportDir, 'product-spec-module-qa.json');
const pageSeoQaPath = path.join(reportDir, 'product-page-structure-seo-qa.json');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');

const approvedExceptionRules = new Map([
  ['241', {
    disposition: 'exclude-test-page',
    decision: 'AI 判定為測試 / 管理殘留頁',
    reason: '頁面標題與內容顯示為 ACS 硬體分類測試頁，不是公開硬體產品規格頁；除非業主確認此頁要公開，否則不建立產品規格詳情模組。',
  }],
  ['253', {
    disposition: 'software-page-schema-needed',
    decision: 'AI 判定為軟體頁',
    reason: '頁面屬 ACS 軟體內容，適合使用軟體功能、相容性、下載入口 schema，不適合硬體型號規格表。',
  }],
  ['254', {
    disposition: 'software-page-schema-needed',
    decision: 'AI 判定為軟體頁',
    reason: '頁面屬 ACS 軟體內容，適合使用軟體功能、相容性、下載入口 schema，不適合硬體型號規格表。',
  }],
  ['255', {
    disposition: 'software-page-schema-needed',
    decision: 'AI 判定為軟體頁',
    reason: '頁面屬 ACS 軟體內容，適合使用軟體功能、相容性、下載入口 schema，不適合硬體型號規格表。',
  }],
  ['268', {
    disposition: 'informational-page-schema-needed',
    decision: 'AI 判定為資訊 / 特點說明頁',
    reason: '頁面屬 ACS 控制器 / 驅動器特點說明，適合使用功能摘要與應用情境 schema，不適合硬體型號規格表。',
  }],
  ['269', {
    disposition: 'training-resource-schema-needed',
    decision: 'AI 判定為教育訓練 / 影片資源頁',
    reason: '頁面屬 ACS 教育訓練影片內容，適合使用 training resource schema，不適合產品規格詳情模組。',
  }],
]);

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
  const productId = String(specPage?.product_id || '');
  const exception = approvedExceptionRules.get(productId);
  const specCritical = specPage?.critical || [];
  const specWarnings = specPage?.warnings || [];
  const seoCritical = seoPage?.critical || [];
  const seoWarnings = seoPage?.warnings || [];
  const overlayStatus = specPage?.overlay_status || standardizationPage?.status || '';
  const unknown = unknownHeadings(standardizationPage);

  if (specCritical.length || seoCritical.length) {
    return {
      status: 'agent-blocked-critical',
      decision: '存在 critical 問題',
      reason: [...specCritical, ...seoCritical].join(' / '),
    };
  }

  if (exception && (specPage?.qa_status === 'no-spec-module' || overlayStatus === 'no-spec-module')) {
    return {
      status: 'agent-approved-exception',
      decision: exception.decision,
      reason: exception.reason,
      disposition: exception.disposition,
    };
  }

  if (specPage?.qa_status === 'no-spec-module' || overlayStatus === 'no-spec-module') {
    return {
      status: 'agent-source-needed',
      decision: '缺少可用規格來源',
      reason: '頁面沒有可驗證的產品規格詳情模組，且不在已核准的非標準例外清單內；需要官方來源或既有可信規格資料。',
    };
  }

  if (unknown.length || overlayStatus === 'needs-review-unknown-module') {
    return {
      status: 'agent-structure-review',
      decision: '需要結構審查',
      reason: unknown.length ? `未知或不確定的模組標題：${unknown.join(' / ')}` : '標準化報告標記為 needs-review-unknown-module。',
    };
  }

  const allWarnings = [...specWarnings, ...seoWarnings];
  const onlyMissingSpecTable = allWarnings.length > 0 && allWarnings.every((warning) => warning === 'spec_table_missing');
  const hasUsableDocumentLink =
    (specPage?.counts?.pdf_links || 0) +
    (specPage?.counts?.cad_links || 0) +
    (specPage?.counts?.zip_links || 0) > 0;

  if (onlyMissingSpecTable && !hasUsableDocumentLink) {
    return {
      status: 'agent-source-needed',
      decision: '缺少可驗證下載或規格表',
      reason: '規格模組缺少 table，且沒有可用 PDF/CAD/ZIP 入口；需要官方來源或既有可信規格資料。',
    };
  }

  if (specWarnings.length || seoWarnings.length) {
    return {
      status: 'agent-fix-required',
      decision: 'AI 可直接修正',
      reason: allWarnings.join(' / '),
    };
  }

  return {
    status: 'agent-approved-clean',
    decision: 'AI agent 審核通過',
    reason: '產品規格詳情 QA 與產品頁 SEO / 結構 QA 均無 critical 或 warning。',
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
    approved_exception_status: 'agent-approved-exception',
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
  <title>AI Agent Product Spec Review</title>
  <style>
    body{font-family:Arial,"Noto Sans TC","Microsoft JhengHei",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
  </style>
</head>
<body>
  <h1>AI Agent Product Spec Review</h1>
  <p>This report combines product spec QA, product page SEO/structure QA, and standardization results. The agent-approved-exception status means the page is not a hardware specification page and should not receive a hardware spec table.</p>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>ID</th><th>Product page</th><th>AI status</th><th>Decision</th><th>Reason</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`, 'utf8');

console.log(JSON.stringify({ status: 'ok', report: 'site/reports/product-spec-agent-review.html', summary: report.summary }, null, 2));
