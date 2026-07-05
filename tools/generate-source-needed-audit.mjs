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
  const title = String(page.title || '');
  const categoryPath = Array.isArray(page.category_path) ? page.category_path.join(' / ') : '';
  const text = `${title} ${categoryPath}`;

  if (/測試/.test(text)) {
    return {
      disposition: 'exclude-test-page',
      reason: '頁面名稱或分類顯示為測試用途，不應自行補產品規格。',
      nextAction: '由站方確認是否保留測試頁；若保留，需提供正式產品來源後再建立規格模組。',
    };
  }

  if (/軟體|Software/i.test(text)) {
    return {
      disposition: 'software-source-needed',
      reason: '軟體頁不適合套用硬體型產品規格表；需要官方軟體版本、功能、相容控制器與下載來源。',
      nextAction: '建立軟體型資料 schema，或取得官方 ACS 軟體頁來源後再建模。',
    };
  }

  if (/教育訓練|影片|training|video/i.test(text)) {
    return {
      disposition: 'training-content-no-spec',
      reason: '教育訓練或影片型內容不是產品規格頁；不應新增推測規格表。',
      nextAction: '若此頁保留於產品分類，應改走內容/影片索引優化，不納入產品規格詳情缺口。',
    };
  }

  if (/特點說明|feature/i.test(text)) {
    return {
      disposition: 'informational-source-needed',
      reason: '特點說明頁偏資訊架構或說明頁，缺少可驗證的產品系列/型號規格來源。',
      nextAction: '保留為說明頁，或提供官方 ACS feature/spec 來源後再建立比較表。',
    };
  }

  return {
    disposition: 'official-source-needed',
    reason: '找不到既有規格模組或足夠官方來源，依規則不得自行編造規格。',
    nextAction: '補官方來源、下載檔、型號資料或確認此頁不需要產品規格詳情。',
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
  .filter((page) => page.agent_review?.status === 'agent-source-needed' || page.qa_status === 'no-spec-module')
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

const dispositionCounts = {};
for (const page of pages) {
  dispositionCounts[page.disposition] = (dispositionCounts[page.disposition] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  scope: 'Source-needed and no-spec-module audit for product pages',
  policy: {
    noSpecWithoutSource: true,
    noInventedSpecifications: true,
    reviewOwner: 'AI agent, with human escalation only for business/source decisions',
  },
  summary: {
    total_pages: pages.length,
    disposition_counts: dispositionCounts,
  },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const md = [
  '# Source-needed Audit',
  '',
  `Generated at: ${report.generated_at}`,
  '',
  '本報告列出沒有既有產品規格詳情模組、且不應由 AI 自行編造規格的頁面。',
  '',
  '## Summary',
  '',
  ...Object.entries(dispositionCounts).map(([key, count]) => `- ${key}: ${count}`),
  '',
  '| ID | Title | Category | Disposition | Reason | Next action | Preview |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...pages.map((page) => `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | ${mdEscape(page.category_path.join(' / '))} | ${mdEscape(page.disposition)} | ${mdEscape(page.reason)} | ${mdEscape(page.nextAction)} | ${mdEscape(page.preview_rel)} |`),
  '',
];
fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

const rows = pages.map((page) => `
  <tr>
    <td>${htmlEscape(page.product_id)}</td>
    <td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
    <td>${htmlEscape(page.category_path.join(' / '))}</td>
    <td><code>${htmlEscape(page.disposition)}</code></td>
    <td>${htmlEscape(page.reason)}</td>
    <td>${htmlEscape(page.nextAction)}</td>
  </tr>`).join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Source-needed Audit</title>
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
  <h1>Source-needed Audit</h1>
  <p>沒有官方來源或既有規格模組時，不新增推測規格表。本報告是 6 個 no-spec/source-needed 頁面的 AI agent 處置依據。</p>
  <div class="summary">
    <div class="card">Pages: ${htmlEscape(report.summary.total_pages)}</div>
    ${Object.entries(dispositionCounts).map(([key, count]) => `<div class="card">${htmlEscape(key)}: ${htmlEscape(count)}</div>`).join('\n')}
  </div>
  <table>
    <thead>
      <tr><th>ID</th><th>Title</th><th>Category</th><th>Disposition</th><th>Reason</th><th>Next action</th></tr>
    </thead>
    <tbody>${rows}</tbody>
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
