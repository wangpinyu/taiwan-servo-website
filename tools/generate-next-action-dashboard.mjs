import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');
const outJson = path.join(reportDir, 'next-action-dashboard.json');
const outHtml = path.join(reportDir, 'next-action-dashboard.html');
const outMd = path.join(reportDir, 'next-action-dashboard.md');

function readJson(relPath, fallback = {}) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return fallback;
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
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

const completion = readJson('site/reports/gpt-optimization-completion-audit.json');
const githubManual = readJson('site/reports/github-manual-bootstrap-handoff.json');
const githubApi = readJson('site/reports/github-api-bootstrap-handoff.json');
const githubRemote = readJson('site/reports/github-remote-state-verification.json');
const deployment = readJson('site/reports/deployment-phase-handoff.json');
const packageIntegrity = readJson('site/reports/deployment-package-integrity.json');
const visual = readJson('site/reports/visual-sample-qa.json');

const remainingExternalActions = completion.summary?.remainingExternalActions || [];
const hasGithubExternalAction = remainingExternalActions.includes('github-api-bootstrap');
const remotePrRefs = Number(githubRemote.gitRemote?.pullRequestRefs || 0);

const actions = [
  {
    priority: 1,
    title: '選擇 GitHub 建立方式',
    status: hasGithubExternalAction ? '需要外部動作' : '已完成',
    recommended:
      '若可提供 token，使用安全腳本建立 labels、issues、PR；若暫不提供 token，改用手動交接頁逐項建立。',
    links: [
      { label: 'GitHub API 交接', href: 'github-api-bootstrap-handoff.html' },
      { label: 'GitHub 手動交接', href: 'github-manual-bootstrap-handoff.html' },
      { label: 'GitHub 遠端狀態', href: 'github-remote-state-verification.html' },
    ],
    command: 'npm run github:bootstrap:safe',
    manualFallback:
      '開啟 site/reports/github-manual-bootstrap-handoff.html，依序建立 labels、tracking issues 與 phase 1 PR。',
  },
  {
    priority: 2,
    title: 'Phase 1 PR 審查',
    status: remotePrRefs > 0 ? '可審查' : '等待 PR 建立',
    recommended:
      '先審查 phase-1-smac-spec-standard，再依優先序處理後續類別分支；每個 PR 合併前保持 validate 通過。',
    links: [
      { label: 'PR 草案總覽', href: 'github-prs/index.html' },
      { label: 'Issue 草案總覽', href: 'github-issues/index.html' },
    ],
    command: 'npm run validate:external-handoff',
  },
  {
    priority: 3,
    title: '部署階段批准',
    status: deployment.deploymentAllowedNow ? '可部署' : '尚未批准',
    recommended:
      '部署、後台保存與伺服器覆蓋仍屬下一階段；等本機與 PR 審查完成後，再由使用者明確批准。',
    links: [
      { label: '部署交接', href: 'deployment-phase-handoff.html' },
      { label: '部署準備度', href: 'deployment-readiness-audit.html' },
      { label: '部署檔案完整性', href: 'deployment-package-integrity.html' },
    ],
    command: 'npm run workflow:deployment-handoff',
  },
];

const dashboard = {
  generatedAt: new Date().toISOString(),
  status: completion.summary?.fullObjectiveComplete ? 'complete' : 'in-progress',
  localOptimizationReady: Boolean(completion.summary?.localOptimizationReady),
  fullObjectiveComplete: Boolean(completion.summary?.fullObjectiveComplete),
  completionSummary: completion.summary || {},
  github: {
    apiStatus: githubApi.status,
    manualMode: githubManual.mode,
    tokenRequiredForManual: githubManual.tokenRequired,
    labels: githubManual.counts?.labels,
    issues: githubManual.counts?.issues,
    prs: githubManual.counts?.prs,
    remotePullRequestRefs: remotePrRefs,
  },
  deployment: {
    status: deployment.status,
    deploymentAllowedNow: deployment.deploymentAllowedNow,
    packageIntegrityStatus: packageIntegrity.status,
    packageIntegrityReviewCount: packageIntegrity.summary?.review_count,
    packageIntegrityErrorCount: packageIntegrity.summary?.error_count,
  },
  visualSample: {
    pass: visual.summary?.pass,
    warn: visual.summary?.warn,
    fail: visual.summary?.fail,
  },
  actions,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');

const cards = [
  ['本機優化', dashboard.localOptimizationReady ? 'ready' : 'not ready'],
  ['完整目標', dashboard.fullObjectiveComplete ? 'complete' : 'in progress'],
  ['GitHub labels', dashboard.github.labels],
  ['GitHub issues', dashboard.github.issues],
  ['GitHub PRs', dashboard.github.prs],
  ['遠端 PR refs', dashboard.github.remotePullRequestRefs],
  ['部署狀態', dashboard.deployment.status],
  ['部署完整性 review', dashboard.deployment.packageIntegrityReviewCount],
]
  .map(
    ([label, value]) =>
      `<div class="card"><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></div>`,
  )
  .join('\n');

const rows = actions
  .map(
    (action) => `<tr>
  <td>${htmlEscape(action.priority)}</td>
  <td>${htmlEscape(action.title)}</td>
  <td>${htmlEscape(action.status)}</td>
  <td>${htmlEscape(action.recommended)}</td>
  <td>${action.command ? `<code>${htmlEscape(action.command)}</code>` : ''}</td>
  <td>${action.links.map((link) => `<a href="${htmlEscape(link.href)}">${htmlEscape(link.label)}</a>`).join('<br>')}</td>
</tr>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>下一步操作面板</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .card span{display:block;color:#52675b;font-size:13px}
    .card strong{display:block;font-size:22px;margin-top:6px}
    table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    code{background:#edf4ef;padding:2px 5px;border-radius:4px}
    a{color:#087d3d}
  </style>
</head>
<body>
  <h1>下一步操作面板</h1>
  <p>Generated at ${htmlEscape(dashboard.generatedAt)}. 這個頁面集中目前仍需要外部動作或下一階段批准的工作，避免在多份報告之間反覆查找。</p>
  <div class="grid">${cards}</div>
  <h2>下一步</h2>
  <table>
    <thead><tr><th>#</th><th>任務</th><th>狀態</th><th>建議</th><th>指令</th><th>連結</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(outHtml, html, 'utf8');

const md = [
  '# 下一步操作面板',
  '',
  `Generated at: ${dashboard.generatedAt}`,
  '',
  `Local optimization ready: ${dashboard.localOptimizationReady}`,
  `Full objective complete: ${dashboard.fullObjectiveComplete}`,
  '',
  '| # | 任務 | 狀態 | 建議 | 指令 |',
  '| --- | --- | --- | --- | --- |',
  ...actions.map(
    (action) =>
      `| ${action.priority} | ${mdEscape(action.title)} | ${mdEscape(action.status)} | ${mdEscape(action.recommended)} | ${
        action.command ? `\`${mdEscape(action.command)}\`` : ''
      } |`,
  ),
  '',
  '## Key links',
  '',
  '- GitHub 手動交接：site/reports/github-manual-bootstrap-handoff.html',
  '- GitHub API 交接：site/reports/github-api-bootstrap-handoff.html',
  '- 部署交接：site/reports/deployment-phase-handoff.html',
  '- 完成度稽核：site/reports/gpt-optimization-completion-audit.html',
  '',
];

fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      status: dashboard.status,
      report: 'site/reports/next-action-dashboard.html',
      localOptimizationReady: dashboard.localOptimizationReady,
      fullObjectiveComplete: dashboard.fullObjectiveComplete,
      actions: actions.length,
    },
    null,
    2,
  ),
);
