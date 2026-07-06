import { spawnSync } from 'node:child_process';

const tokenPresent = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
const skipStrict = process.argv.includes('--skip-strict');
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeBin = process.execPath;

function run(label, command, args) {
  console.log(`\n[github-bootstrap-safe] ${label}`);
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  if (result.error) {
    console.error(`[github-bootstrap-safe] ${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[github-bootstrap-safe] ${label} failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function refreshReports() {
  run('refresh GitHub readiness', nodeBin, ['tools/generate-github-bootstrap-readiness.mjs']);
  run('verify GitHub remote state', nodeBin, ['tools/verify-github-remote-state.mjs']);
  run('refresh GitHub API handoff', nodeBin, ['tools/generate-github-api-bootstrap-handoff.mjs']);
  run('refresh completion audit', nodeBin, ['tools/generate-gpt-optimization-completion-audit.mjs']);
}

run('dry run full bootstrap draft set', nodeBin, ['tools/github-bootstrap.mjs', '--all']);
run('dry run smoke issue set', nodeBin, ['tools/github-bootstrap.mjs', '--labels', '--issues', '--max-issues=1']);
run('dry run smoke PR set', nodeBin, ['tools/github-bootstrap.mjs', '--prs', '--max-prs=1']);

if (!tokenPresent) {
  refreshReports();
  console.error('\n[github-bootstrap-safe] GITHUB_TOKEN or GH_TOKEN is not set. No GitHub API mutation was attempted.');
  console.error('[github-bootstrap-safe] Set a fine-grained token in this PowerShell session, then rerun npm run github:bootstrap:safe.');
  process.exit(2);
}

run('apply smoke issue set', nodeBin, ['tools/github-bootstrap.mjs', '--labels', '--issues', '--max-issues=1', '--apply']);
run('apply smoke PR set', nodeBin, ['tools/github-bootstrap.mjs', '--prs', '--max-prs=1', '--apply']);
run('apply full bootstrap set', nodeBin, ['tools/github-bootstrap.mjs', '--all', '--apply']);

refreshReports();

if (!skipStrict) {
  run('validate strict', npmBin, ['run', 'validate:strict']);
}

console.log('\n[github-bootstrap-safe] GitHub bootstrap finished. Clear the token from the session when done: Remove-Item Env:\\GITHUB_TOKEN');
