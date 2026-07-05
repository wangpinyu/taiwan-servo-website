import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const qaPath = path.join(reportDir, 'product-spec-module-qa.json');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const reviewedUnknownHeadingPatterns = [
  /產品型號總覽/u,
  /系列/u,
  /規格/u,
  /Specifications?/iu,
  /Standard Specifications?/iu,
  /全系列產品陣容/u,
  /產品核心規格/u,
  /型號規格詳情/u,
  /系統模組規格/u,
  /重點應用場景/u,
  /行業應用實例/u,
  /產業應用範疇/u,
  /應用/u,
  /Modules?/iu,
];

function unknownHeadingsReviewed(unknown, overlayStatus) {
  if (!unknown.length && overlayStatus !== 'needs-review-unknown-module') return true;
  if (!unknown.length && overlayStatus === 'needs-review-unknown-module') return false;
  return unknown.every((heading) => reviewedUnknownHeadingPatterns.some((pattern) => pattern.test(String(heading))));
}

function classify(page, standardizationPage) {
  const warnings = page.warnings || [];
  const critical = page.critical || [];
  const unknown = standardizationPage?.validation?.unknownHeadings || [];

  if (critical.length) {
    return ['agent-blocked-critical', '需要修正', '發現 critical 問題，需先修正規格模組 HTML、連結或內部註解。'];
  }

  if (page.qa_status === 'no-spec-module' || page.overlay_status === 'no-spec-module') {
    return ['agent-source-needed', '來源不足', 'AI 需先找到官方來源或既有規格模組；找不到來源時不得自行撰寫。'];
  }

  if (warnings.some((warning) => /headers_may_need_units|download_label_needs_review/.test(warning))) {
    return ['agent-source-audit-needed', '需要來源審核', '表頭單位、下載類型或文件對應仍需查核來源。'];
  }

  if (warnings.length) {
    return ['agent-fix-required', '需要 AI 修版', '修正 CTA、可讀性、展開提示或可及性文案。'];
  }

  if ((unknown.length || page.overlay_status === 'needs-review-unknown-module') && !unknownHeadingsReviewed(unknown, page.overlay_status)) {
    return ['agent-structure-review', '需要 AI 結構審核', `判定模組標題歸類：${unknown.join(' / ') || page.overlay_status}`];
  }

  if (unknown.length || page.overlay_status === 'needs-review-unknown-module') {
    return ['agent-approved-clean', 'AI agent 審核通過', `已將模組標題視為合理產品內容或規格子模組：${unknown.join(' / ') || page.overlay_status}`];
  }

  return ['agent-approved-clean', 'AI agent 審核通過', '規格模組 QA 通過，未見 critical 或 warning。'];
}

if (!fs.existsSync(qaPath) || !fs.existsSync(standardizationPath)) {
  console.error('Missing QA or standardization report.');
  process.exit(1);
}

const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
const standardization = JSON.parse(fs.readFileSync(standardizationPath, 'utf8'));
const standardizationById = new Map(standardization.pages.map((page) => [String(page.product_id), page]));
const pages = qa.pages.map((page) => {
  const [status, decision, reason] = classify(page, standardizationById.get(String(page.product_id)));
  return { ...page, agent_review: { status, decision, reason } };
});

const statusCounts = {};
for (const page of pages) {
  statusCounts[page.agent_review.status] = (statusCounts[page.agent_review.status] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  scope: 'GitHub-ready AI agent review decisions',
  policy: {
    default_reviewer: 'AI agent',
    human_exception_only_for: ['official source inaccessible', 'source conflict', 'backend/template limitation', 'business decision'],
  },
  summary: { total_pages: pages.length, agent_status_counts: statusCounts },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'product-spec-agent-review.json'), JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(
  path.join(reportDir, 'product-spec-agent-review.html'),
  `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>AI Agent 審核</title><style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{background:#eef7f0}</style></head><body><h1>AI Agent 審核</h1><pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre><table><thead><tr><th>ID</th><th>產品</th><th>AI 狀態</th><th>決策</th><th>原因</th></tr></thead><tbody>${pages.map((page) => `<tr><td>${htmlEscape(page.product_id)}</td><td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td><td>${htmlEscape(page.agent_review.status)}</td><td>${htmlEscape(page.agent_review.decision)}</td><td>${htmlEscape(page.agent_review.reason)}</td></tr>`).join('')}</tbody></table></body></html>`,
  'utf8',
);

console.log(JSON.stringify({ status: 'ok', report: 'site/reports/product-spec-agent-review.html', summary: report.summary }, null, 2));
