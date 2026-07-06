import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'site', 'reports');
const docsDir = path.join(repoRoot, 'docs');
const prDir = path.join(reportsDir, 'github-prs');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function safeGit(args, fallback = '') {
  try {
    return git(args);
  } catch {
    return fallback;
  }
}

function mdEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function categoryPath(page) {
  return Array.isArray(page.category_path) ? page.category_path.join(' / ') : '';
}

function requiredSource(page) {
  const title = page.title || '';
  const disposition = page.disposition || '';
  if (disposition === 'exclude-test-page') {
    return '站方確認 / contact fallback；此頁未確認為正式產品頁前，不補技術規格。';
  }
  if (disposition === 'software-source-needed') {
    return '原廠軟體頁 / software manual / download 或 version notes / 相容控制器資料；不足時 contact fallback。';
  }
  if (disposition === 'informational-source-needed') {
    return '原廠 feature page / datasheet / 說明文件；不足時 contact fallback。';
  }
  if (disposition === 'training-content-no-spec') {
    return '原廠 training page / video source / 教育訓練資料；不套硬體規格表，必要時 contact fallback。';
  }
  if (/RINGFEDER|RINFEDER|Ringfeder/i.test(title)) {
    return '原廠 datasheet / catalog PDF / CAD 或型錄規格表；若缺型號級資料則 contact fallback。';
  }
  if (/Thomson/i.test(title)) {
    return '原廠 datasheet / catalog PDF / CAD / reducer 規格表；若無公開資料則 contact fallback。';
  }
  if (/JVL/i.test(title)) {
    return '原廠產品頁 / datasheet / manual / 產品系列 PDF；需判定是特色總覽或可比較系列頁。';
  }
  if (/山洋|SANYO|SANUPS|SANMOTION/i.test(title)) {
    return '原廠 datasheet / catalog PDF / manual；SANUPS/SANMOTION 需分清系統、馬達、驅動器與控制器來源。';
  }
  return '原廠 PDF / CAD / datasheet / manual；不足時 contact fallback。';
}

function onlineDisposition(page) {
  switch (page.disposition) {
    case 'exclude-test-page':
      return '不建議作為公開正式頁暫時上線；若目前仍公開，需站方確認是否隱藏、刪除或改成正式產品頁。';
    case 'software-source-needed':
      return '可暫時保留為軟體內容頁，但不可套硬體規格表；需補軟體型 schema 或官方軟體來源。';
    case 'informational-source-needed':
      return '可暫時保留為說明頁，但不可宣稱規格模組完成；需人工確認頁面角色。';
    case 'training-content-no-spec':
      return '可暫時保留為教育訓練頁，但不納入硬體產品規格完成範圍。';
    default:
      return '可暫時保留現有頁面上線，但不得標示為規格模組完成；PR/部署前仍保留 source-needed。';
  }
}

function exceptionType(page) {
  switch (page.product_id) {
    case '241':
      return '測試頁 / 非正式產品頁候選';
    case '253':
    case '254':
    case '255':
      return '軟體頁';
    case '268':
      return '說明頁 / feature overview';
    case '269':
      return '教育訓練頁 / 影片內容';
    default:
      return '待確認';
  }
}

function exceptionVerdict(page) {
  if (page.product_id === '241') {
    return '目前依標題與分類判定為測試頁，不視為正式硬體產品頁；但必須由人工確認。若站方確認這是正式硬體頁，需改列待修，不可列為例外。';
  }
  if (['253', '254', '255'].includes(page.product_id)) {
    return '軟體頁，不適合套硬體產品規格詳情；需改用軟體型資料架構。';
  }
  if (page.product_id === '268') {
    return '說明頁，不是具體硬體產品頁；若要優化，需補 ACS 特點/功能官方來源。';
  }
  if (page.product_id === '269') {
    return '教育訓練頁，不是硬體產品頁；應走訓練/影片內容模型。';
  }
  return '待人工確認。';
}

const agentReview = readJson('site/reports/product-spec-agent-review.json');
const sourceAudit = readJson('site/reports/source-needed-audit.json');
const specQa = readJson('site/reports/product-spec-module-qa.json');
const pageSeoQa = readJson('site/reports/product-page-structure-seo-qa.json');
const standardization = readJson('site/reports/product-standardization-report.json');

const branch = git(['branch', '--show-current']);
const head = git(['rev-parse', '--short', 'HEAD']);
const baselineAuditCommit = safeGit(['rev-parse', '--short', 'HEAD~1'], head);
const main = safeGit(['rev-parse', '--short', 'origin/main'], 'unknown');
const shortStat = safeGit(['diff', '--shortstat', 'origin/main...HEAD'], 'diff unavailable');
const changedFiles = safeGit(['diff', '--name-only', 'origin/main...HEAD'], '')
  .split(/\r?\n/)
  .filter(Boolean);
const changedProductPages = changedFiles.filter((file) => /^site\/preview\/products\/detail\/.+\.html$/.test(file));
const changedReports = changedFiles.filter((file) => /^site\/reports\//.test(file));
const changedDocs = changedFiles.filter((file) => /^docs\//.test(file));
const changedTools = changedFiles.filter((file) => /^tools\//.test(file));

const sourceAuditById = new Map(sourceAudit.pages.map((page) => [page.product_id, page]));
const sourceNeededPages = agentReview.pages
  .filter((page) => page.agent_review?.status === 'agent-source-needed')
  .map((page) => {
    const audit = sourceAuditById.get(page.product_id) || {};
    return {
      ...page,
      disposition: audit.disposition || 'official-source-needed',
      auditReason: audit.reason,
      auditNextAction: audit.nextAction,
    };
  });

const noSpecPages = specQa.pages.filter((page) => page.qa_status === 'no-spec-module');
const qaSummary = specQa.summary;
const agentSummary = agentReview.summary;
const seoSummary = pageSeoQa.summary;

fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(prDir, { recursive: true });

const generatedAt = new Date().toISOString();

const integrationSummary = [
  '# Integration Review Summary',
  '',
  `Generated at: ${generatedAt}`,
  '',
  '## Review Baseline',
  '',
  `- Review baseline branch: \`${branch}\``,
  `- Baseline audit commit: \`${baselineAuditCommit}\``,
  `- Latest branch commit captured for PR review: \`${head}\``,
  `- Remote main reference used only for diff: \`origin/main@${main}\``,
  '- PR review target: `main`',
  '- Deployment baseline: not `main`.',
  '- Production deployment: not approved.',
  '',
  '## Main Is Not The Completion Baseline',
  '',
  '`main` is only the stable comparison target for reviewing what changed. It is not the deployment baseline and must not be used to judge whether the product-page optimization work is complete. Current completion/readiness must be evaluated from `phase-integration-product-optimization` and its QA reports.',
  '',
  '## Difference From Main',
  '',
  `- Git diff summary: ${shortStat}`,
  `- Changed product preview pages: ${changedProductPages.length}`,
  `- Changed report files: ${changedReports.length}`,
  `- Changed documentation files: ${changedDocs.length}`,
  `- Changed workflow/tool files: ${changedTools.length}`,
  '',
  'The integration branch adds or updates product preview overlays, product specification module QA, product page SEO/structure QA, source-needed audit outputs, GitHub workflow/readiness reports, GitHub issue/PR preparation artifacts, and reusable validation/fix tooling. This is the branch that represents the current reviewable product-page optimization state.',
  '',
  '## Current Review Evidence',
  '',
  `- Product spec module QA: pass=${qaSummary.pass_count}, no-spec-module=${qaSummary.no_spec_module_count}, fail=${qaSummary.fail_count}, warn=${qaSummary.warn_count}.`,
  `- AI agent review: ${Object.entries(agentSummary.agent_status_counts).map(([key, value]) => `${key}=${value}`).join(', ')}.`,
  `- Product page SEO/structure QA: pass=${seoSummary.pass_count}, warn=${seoSummary.warn_count}, no-spec-module=${seoSummary.no_spec_module_count}, fail=${seoSummary.fail_count}.`,
  `- Standardization: inserted=${standardization.summary.status_counts.inserted}, inserted-before-application=${standardization.summary.status_counts['inserted-before-application']}, no-spec-module=${standardization.summary.status_counts['no-spec-module']}.`,
  '',
  '## Deployment Boundary',
  '',
  '- Do not deploy.',
  '- Do not overwrite production.',
  '- Do not use `main` as proof of current optimization completion.',
  '- Allowed next state: PR review of `phase-integration-product-optimization` into `main`.',
  '',
].join('\n');

const sourceRows = sourceNeededPages.map((page) => {
  return `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | \`${mdEscape(page.preview_rel)}\` | ${mdEscape(categoryPath(page))} | ${mdEscape(page.agent_review?.reason || '需補官方來源或確認頁面角色。')} | ${mdEscape(requiredSource(page))} | ${mdEscape(onlineDisposition(page))} |`;
});

const sourceNeededDoc = [
  '# Agent Source Needed Pages',
  '',
  `Generated at: ${generatedAt}`,
  '',
  'These 20 pages are still `agent-source-needed` on the `phase-integration-product-optimization` review baseline. They are not approved as completed product specification work. A page may remain visible temporarily only under the condition listed below, but it must not be represented as source-complete.',
  '',
  `- Total source-needed pages: ${sourceNeededPages.length}`,
  `- Official source audit queue: ${sourceNeededPages.filter((page) => page.disposition === 'official-source-needed').length}`,
  `- Non-standard/no-spec exception pages included in source-needed: ${sourceNeededPages.filter((page) => page.qa_status === 'no-spec-module').length}`,
  '',
  '| Product ID | Product title | Local preview path | Category | Why source-needed | Required source type | Can temporarily remain online? |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...sourceRows,
  '',
  '## Handling Rule',
  '',
  '- Do not invent specifications.',
  '- Move a page out of `agent-source-needed` only after official manufacturer pages, official PDFs, CAD/download pages, manuals, or a documented contact fallback are attached to the review evidence.',
  '- Large-file/server upload issues are not deployment blockers for local preview, but unresolved official-source mapping remains a review blocker.',
  '',
].join('\n');

const exceptionRows = noSpecPages.map((page) => {
  const audit = sourceAuditById.get(page.product_id) || {};
  return `| ${mdEscape(page.product_id)} | ${mdEscape(page.title)} | \`${mdEscape(page.preview_rel)}\` | ${mdEscape(categoryPath(page))} | ${mdEscape(exceptionType(page))} | ${mdEscape(exceptionVerdict(page))} | ${audit.disposition === 'official-source-needed' ? 'Yes, move to fix' : 'No, exception pending human confirmation'} |`;
});

const exceptionsDoc = [
  '# No Spec Module Exceptions',
  '',
  `Generated at: ${generatedAt}`,
  '',
  'These 6 pages have `qa_status=no-spec-module`. They are not counted as completed product specification modules. They are exception candidates only because the current evidence suggests they are test, software, informational, or training pages rather than normal hardware product pages.',
  '',
  `- Total no-spec-module pages: ${noSpecPages.length}`,
  '- Human confirmation is still required for all 6 pages before production deployment.',
  '- If any page is confirmed to be a real hardware product page, it must move to the fix/source-needed queue and cannot remain an exception.',
  '',
  '| Product ID | Product title | Local preview path | Category | Current classification | Exception verdict | Hardware product page requiring fix? |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...exceptionRows,
  '',
  '## Exception Policy',
  '',
  '- Test pages should be hidden, removed, or formalized before deployment.',
  '- Software pages need a software-specific schema, not the hardware spec module.',
  '- Informational and training pages need content/learning-resource treatment, not invented product specs.',
  '',
].join('\n');

const deploymentReadiness = [
  '# Deployment Readiness',
  '',
  `Generated at: ${generatedAt}`,
  '',
  '## Conclusion',
  '',
  '`not ready for production deployment`',
  '',
  '## Allowed Status',
  '',
  '`ready for PR review`',
  '',
  '## Baseline',
  '',
  `- Review branch: \`${branch}\``,
  `- Baseline audit commit: \`${baselineAuditCommit}\``,
  `- Latest branch commit captured for PR review: \`${head}\``,
  '- PR review target: `main`',
  '- `main` is not the current optimization completion baseline.',
  '',
  '## Pending Items',
  '',
  `- 20 source-needed pages remain unresolved on the AI agent review baseline.`,
  `- 6 no-spec-module exception pages require human confirmation before production deployment.`,
  '- PR review is pending.',
  '- Deployment approval is not granted.',
  '- Deployment remains not approved after the commit reference refresh.',
  '',
  '## QA Evidence',
  '',
  `- Product spec module QA: pass=${qaSummary.pass_count}, no-spec-module=${qaSummary.no_spec_module_count}, fail=${qaSummary.fail_count}, warn=${qaSummary.warn_count}.`,
  `- AI agent review: ${Object.entries(agentSummary.agent_status_counts).map(([key, value]) => `${key}=${value}`).join(', ')}.`,
  `- Product page SEO/structure QA: pass=${seoSummary.pass_count}, warn=${seoSummary.warn_count}, no-spec-module=${seoSummary.no_spec_module_count}, fail=${seoSummary.fail_count}.`,
  '',
  '## Deployment Boundary',
  '',
  '- Do not deploy this branch to production.',
  '- Do not overwrite production files.',
  '- Do not treat `main` as proof of completion.',
  '- The next safe action is PR review only.',
  '',
].join('\n');

const sourceNeededList = sourceNeededPages
  .map((page) => `- ${page.product_id} ${page.title}: ${page.disposition}; ${requiredSource(page)}`)
  .join('\n');

const exceptionList = noSpecPages
  .map((page) => `- ${page.product_id} ${page.title}: ${exceptionType(page)}; ${exceptionVerdict(page)}`)
  .join('\n');

const prBody = [
  '# Product page specification modules and SEO structure integration',
  '',
  'Source branch: `phase-integration-product-optimization`',
  '',
  'Target branch: `main`',
  '',
  '## Summary',
  '',
  'This PR prepares the current product-page optimization integration branch for review. It does not approve deployment and does not overwrite production. `main` is used only as the PR target and diff base; completion/readiness is judged from this branch and its QA reports.',
  '',
  '## Product Spec Module QA Result',
  '',
  `- Total pages: ${qaSummary.total_pages}`,
  `- Pass: ${qaSummary.pass_count}`,
  `- No spec module: ${qaSummary.no_spec_module_count}`,
  `- Fail: ${qaSummary.fail_count}`,
  `- Warn: ${qaSummary.warn_count}`,
  '- Evidence: `site/reports/product-spec-module-qa.html` and `site/reports/product-spec-module-qa.json`',
  '',
  '## Agent Review Result',
  '',
  ...Object.entries(agentSummary.agent_status_counts).map(([key, value]) => `- ${key}: ${value}`),
  '- Evidence: `site/reports/product-spec-agent-review.html` and `site/reports/product-spec-agent-review.json`',
  '',
  '## 20 Source-needed Pages',
  '',
  sourceNeededList,
  '',
  'Full clean list: `docs/agent-source-needed-pages.md`',
  '',
  '## 6 No-spec-module Exceptions',
  '',
  exceptionList,
  '',
  'Full clean list: `docs/no-spec-module-exceptions.md`',
  '',
  '## Deployment Not Approved',
  '',
  '- Deployment is not approved.',
  '- Production overwrite is not approved.',
  '- Current conclusion: `not ready for production deployment`.',
  '- Allowed current status: `ready for PR review`.',
  '- Pending items: 20 source-needed pages, 6 exception pages requiring human confirmation, PR review.',
  '',
  '## Review Documents',
  '',
  '- `docs/integration-review-summary.md`',
  '- `docs/agent-source-needed-pages.md`',
  '- `docs/no-spec-module-exceptions.md`',
  '- `docs/deployment-readiness.md`',
  '',
].join('\n');

function writeMarkdown(relPath, content) {
  fs.writeFileSync(path.join(repoRoot, relPath), `${content.trimEnd()}\n`, 'utf8');
}

writeMarkdown(path.join('docs', 'integration-review-summary.md'), integrationSummary);
writeMarkdown(path.join('docs', 'agent-source-needed-pages.md'), sourceNeededDoc);
writeMarkdown(path.join('docs', 'no-spec-module-exceptions.md'), exceptionsDoc);
writeMarkdown(path.join('docs', 'deployment-readiness.md'), deploymentReadiness);
writeMarkdown(path.join('site', 'reports', 'github-prs', 'phase-integration-product-optimization.md'), prBody);

console.log(JSON.stringify({
  generatedAt,
  branch,
  head,
  sourceNeededPages: sourceNeededPages.length,
  noSpecPages: noSpecPages.length,
  productSpecQa: qaSummary,
  agentStatusCounts: agentSummary.agent_status_counts,
  outputs: [
    'docs/integration-review-summary.md',
    'docs/agent-source-needed-pages.md',
    'docs/no-spec-module-exceptions.md',
    'docs/deployment-readiness.md',
    'site/reports/github-prs/phase-integration-product-optimization.md',
  ],
}, null, 2));
