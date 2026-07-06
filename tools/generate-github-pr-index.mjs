import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repo = 'https://github.com/wangpinyu/taiwan-servo-website';
const outDir = path.join('site', 'reports', 'github-prs');

const plan = [
  { priority: 1, branch: 'phase-1-smac-spec-standard', category: '電動缸', base: 'main' },
  { priority: 2, branch: 'phase-2-drivers-spec-review', category: '驅動器 / ACS 控制器', base: 'phase-1-smac-spec-standard' },
  { priority: 3, branch: 'phase-2-motors-spec-review', category: '各類馬達', base: 'phase-1-smac-spec-standard' },
  { priority: 4, branch: 'phase-3-harmonic-drive', category: 'Harmonic Drive 減速機', base: 'phase-1-smac-spec-standard' },
  { priority: 5, branch: 'phase-3-renishaw-feedback', category: 'Renishaw 回授元件', base: 'phase-1-smac-spec-standard' },
  { priority: 6, branch: 'phase-3-positioning-stage', category: '定位平台', base: 'phase-1-smac-spec-standard' },
  { priority: 7, branch: 'phase-3-bearings-air-mechanical', category: '空氣軸承 / 滾珠滾柱軸承', base: 'phase-1-smac-spec-standard' },
  { priority: 8, branch: 'phase-4-couplings', category: '聯軸器', base: 'phase-1-smac-spec-standard' },
  { priority: 9, branch: 'phase-4-fms-tension', category: 'FMS 張力系統', base: 'phase-1-smac-spec-standard' },
  { priority: 10, branch: 'phase-4-solid-state-relays', category: '固態繼電器', base: 'phase-1-smac-spec-standard' },
  { priority: 11, branch: 'phase-4-sanyo-denki', category: '山洋電氣 SANYO DENKI', base: 'phase-1-smac-spec-standard' },
  { priority: 12, branch: 'phase-4-special-environments', category: '特殊環境', base: 'phase-1-smac-spec-standard' },
  { priority: 13, branch: 'phase-5-ceramic-chucks', category: '陶瓷吸盤', base: 'phase-1-smac-spec-standard' },
  { priority: 14, branch: 'phase-5-sejinigb', category: 'SEJINIGB 齒排與轉台', base: 'phase-1-smac-spec-standard' },
  { priority: 15, branch: 'phase-5-blowers', category: '鼓風機', base: 'phase-1-smac-spec-standard' },
  { priority: 16, branch: 'phase-5-automation-systems', category: '自動化系統', base: 'phase-1-smac-spec-standard' },
  { priority: 17, branch: 'phase-5-other-feedback', category: '其他回授元件', base: 'phase-1-smac-spec-standard' },
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function remoteBranchExists(branch) {
  return git(['ls-remote', '--heads', 'origin', branch]).length > 0;
}

function readFromBranch(branch, relPath) {
  try {
    return git(['show', `origin/${branch}:${relPath}`]);
  } catch {
    return null;
  }
}

function readSmoke(branch) {
  const relPath = `${outDir}/${branch}-smoke.json`.replaceAll(path.sep, '/');
  const localPath = path.join(outDir, `${branch}-smoke.json`);
  const raw = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : readFromBranch(branch, relPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readPrSummaryExists(branch) {
  const relPath = `${outDir}/${branch}.md`.replaceAll(path.sep, '/');
  const localPath = path.join(outDir, `${branch}.md`);
  return fs.existsSync(localPath) || readFromBranch(branch, relPath) !== null;
}

function readableSourceCategory(value) {
  const text = String(value || '').trim();
  if (!text || /\?{2,}|\uFFFD/.test(text)) return null;
  return text;
}

fs.mkdirSync(outDir, { recursive: true });

const generatedAt = new Date().toISOString();
const existingPullRefs = git(['ls-remote', 'origin', 'refs/pull/*/head'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const entries = plan.map((item) => {
  const remoteExists = remoteBranchExists(item.branch);
  const smoke = remoteExists ? readSmoke(item.branch) : null;
  const sourceCategory = readableSourceCategory(smoke?.category);
  return {
    ...item,
    remoteExists,
    prSummaryExists: remoteExists ? readPrSummaryExists(item.branch) : false,
    prUrl: `${repo}/pull/new/${item.branch}`,
    smoke: smoke
      ? {
          category: item.category,
          ...(sourceCategory && sourceCategory !== item.category ? { sourceCategory } : {}),
          pages: smoke.pages,
          checks: smoke.checks,
          failures: Array.isArray(smoke.failures) ? smoke.failures.length : null,
        }
      : null,
  };
});

const json = {
  generatedAt,
  repository: repo,
  existingPullRequestRefs: existingPullRefs.length,
  note: 'Create PRs from lower priority to higher priority only after phase-1 is accepted, or use the listed base branch for stacked review.',
  entries,
};

const md = [
  '# GitHub PR 控制表',
  '',
  `更新時間：${generatedAt}`,
  '',
  '這個表列出目前已準備好的 GitHub 分支、建議 base branch、smoke evidence 與 PR 建立入口。PR 仍需在 GitHub 網站中建立；本檔只負責提供可追蹤的控制面板。',
  '',
  `目前 GitHub pull request refs：${existingPullRefs.length}`,
  '',
  '## 建議 PR 順序',
  '',
  '- 先建立 `phase-1-smac-spec-standard`，base 使用 `main`。',
  '- Phase 1 接受後，其餘分支可先以 `phase-1-smac-spec-standard` 作為 base 做 stacked review。',
  '- Phase 1 合併後，再視情況將後續分支 rebase 到 `main` 後建立 PR。',
  '',
  '## PR 清單',
  '',
  '| # | Category | Branch | Base | Pages | Checks | Failures | PR |',
  '| --- | --- | --- | --- | ---: | ---: | ---: | --- |',
  ...entries.map((entry) => {
    const pages = entry.smoke?.pages ?? '';
    const checks = entry.smoke?.checks ?? '';
    const failures = entry.smoke?.failures ?? '';
    const pr = entry.remoteExists ? `[Create PR](${entry.prUrl})` : 'remote branch missing';
    return `| ${entry.priority} | ${entry.category} | \`${entry.branch}\` | \`${entry.base}\` | ${pages} | ${checks} | ${failures} | ${pr} |`;
  }),
  '',
  '## 驗收條件',
  '',
  '- 每個 PR 必須通過 `npm run validate`。',
  '- GitHub Actions `Preview QA` 必須通過。',
  '- Smoke failures 必須為 0。',
  '- `source-needed` 頁面不得補寫未經來源支持的規格。',
  '- 後台保存、測試網上架、正式伺服器覆蓋不在本 PR 工作流中執行。',
  '',
];

fs.writeFileSync(path.join(outDir, 'index.json'), `${JSON.stringify(json, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'index.md'), `${md.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  generatedAt,
  entries: entries.length,
  remoteBranches: entries.filter((entry) => entry.remoteExists).length,
  existingPullRequestRefs: existingPullRefs.length,
  missingSmoke: entries.filter((entry) => !entry.smoke).map((entry) => entry.branch),
}, null, 2));
