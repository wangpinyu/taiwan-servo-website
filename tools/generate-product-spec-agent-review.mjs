import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const qaPath = path.join(reportDir, 'product-spec-module-qa.json');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');

function htmlEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function classify(page, standardizationPage) {
  const warnings = page.warnings || [];
  const critical = page.critical || [];
  const unknown = standardizationPage?.validation?.unknownHeadings || [];
  if (critical.length) return ['agent-blocked-critical', '不得上架', '先由 AI 修復阻塞級 HTML/連結問題。'];
  if (page.qa_status === 'no-spec-module' || page.overlay_status === 'no-spec-module') return ['agent-source-needed', '暫不補寫', 'AI 先找官方來源；找不到來源不得自行撰寫。'];
  if (unknown.length || page.overlay_status === 'needs-review-unknown-module') return ['agent-structure-review', '需 AI 結構審核', `判定模組標題歸類：${unknown.join(' / ') || page.overlay_status}`];
  if (warnings.some((w) => /headers_may_need_units|download_label_needs_review/.test(w))) return ['agent-source-audit-needed', '需 AI 來源審核', '比對原廠欄位、單位與下載對應。'];
  if (warnings.length) return ['agent-fix-required', '需 AI 修版', '修正 CTA、可讀性、展開提示或可及性文案。'];
  return ['agent-approved-clean', '可進入批次套用候選', '程式化 QA 未發現阻塞或警告。'];
}

if (!fs.existsSync(qaPath) || !fs.existsSync(standardizationPath)) {
  console.error('Missing QA or standardization report.');
  process.exit(1);
}

const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
const std = JSON.parse(fs.readFileSync(standardizationPath, 'utf8'));
const stdById = new Map(std.pages.map((page) => [String(page.product_id), page]));
const pages = qa.pages.map((page) => {
  const [status, decision, reason] = classify(page, stdById.get(String(page.product_id)));
  return { ...page, agent_review: { status, decision, reason } };
});
const statusCounts = {};
for (const page of pages) statusCounts[page.agent_review.status] = (statusCounts[page.agent_review.status] || 0) + 1;
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
fs.writeFileSync(path.join(reportDir, 'product-spec-agent-review.html'), `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>AI Agent 審核</title><style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{background:#eef7f0}</style></head><body><h1>AI Agent 審核</h1><pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre><table><thead><tr><th>ID</th><th>產品</th><th>AI 狀態</th><th>決策</th><th>原因</th></tr></thead><tbody>${pages.map((p) => `<tr><td>${htmlEscape(p.product_id)}</td><td><a href="../${htmlEscape(p.preview_rel)}">${htmlEscape(p.title)}</a></td><td>${htmlEscape(p.agent_review.status)}</td><td>${htmlEscape(p.agent_review.decision)}</td><td>${htmlEscape(p.agent_review.reason)}</td></tr>`).join('')}</tbody></table></body></html>`, 'utf8');
console.log(JSON.stringify({ status: 'ok', report: 'site/reports/product-spec-agent-review.html', summary: report.summary }, null, 2));

