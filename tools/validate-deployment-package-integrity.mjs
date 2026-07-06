import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const packageRoot = path.join(repoRoot, 'site', 'deploy-packages');
const reportDir = path.join(repoRoot, 'site', 'reports');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return null;
  }
}

function expectedSafeToOverwrite(mode) {
  if (mode === 'same-path-overwrite') return true;
  return false;
}

const manifestPaths = fs.existsSync(packageRoot)
  ? fs.readdirSync(packageRoot)
    .map((dir) => path.join(packageRoot, dir, 'manifest.json'))
    .filter((filePath) => fs.existsSync(filePath))
  : [];

const allFiles = [];
const manifests = [];
const issues = [];

for (const manifestPath of manifestPaths) {
  const manifest = readJson(manifestPath);
  const relManifest = path.relative(repoRoot, manifestPath).replaceAll('\\', '/');
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const mode = manifest.deploy_mode || path.basename(path.dirname(manifestPath));
  let missingFiles = 0;
  let byteMismatches = 0;
  let policyIssues = 0;

  for (const file of files) {
    const localPath = file.local_path || path.join(repoRoot, 'site', file.local_rel || '');
    const actualBytes = fileSize(localPath);
    const expectedBytes = Number(file.bytes ?? 0);
    const exists = actualBytes !== null;
    const byteMatches = exists && actualBytes === expectedBytes;
    const safeExpected = expectedSafeToOverwrite(file.deploy_mode || mode);
    const safeActual = Boolean(file.safe_to_overwrite);
    const futureServerPath = String(file.future_server_path || '');
    const policyIssueMessages = [];

    if (!exists) {
      missingFiles += 1;
      const isDeployableMode = ['same-path-overwrite', 'site-static-asset-review', 'backend-managed-download-route'].includes(file.deploy_mode || mode);
      issues.push({
        level: isDeployableMode ? 'error' : 'review',
        type: 'missing-local-file',
        manifest: relManifest,
        local_rel: file.local_rel,
        local_path: localPath,
      });
    }

    if (exists && !byteMatches) {
      byteMismatches += 1;
      issues.push({
        level: 'error',
        type: 'byte-mismatch',
        manifest: relManifest,
        local_rel: file.local_rel,
        expectedBytes,
        actualBytes,
      });
    }

    if (safeActual !== safeExpected) {
      policyIssueMessages.push(`safe_to_overwrite=${safeActual} expected ${safeExpected}`);
    }

    if (['same-path-overwrite', 'site-static-asset-review', 'backend-managed-download-route'].includes(file.deploy_mode || mode) && !futureServerPath) {
      policyIssueMessages.push('future_server_path is required for this deploy mode');
    }

    if (policyIssueMessages.length) {
      policyIssues += 1;
      issues.push({
        level: 'review',
        type: 'deploy-policy',
        manifest: relManifest,
        local_rel: file.local_rel,
        future_server_path: futureServerPath,
        messages: policyIssueMessages,
      });
    }

    allFiles.push({
      manifest: relManifest,
      deploy_mode: file.deploy_mode || mode,
      local_rel: file.local_rel,
      local_path: localPath,
      source_url: file.source_url || '',
      future_server_path: futureServerPath,
      expectedBytes,
      actualBytes,
      exists,
      byteMatches,
      safe_to_overwrite: safeActual,
    });
  }

  manifests.push({
    manifest: relManifest,
    deploy_mode: mode,
    file_count: manifest.file_count ?? files.length,
    bytes: manifest.bytes ?? files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
    checked_files: files.length,
    missing_files: missingFiles,
    byte_mismatches: byteMismatches,
    policy_issues: policyIssues,
  });
}

const targetPathGroups = new Map();
for (const file of allFiles) {
  if (!file.future_server_path) continue;
  const key = file.future_server_path;
  if (!targetPathGroups.has(key)) targetPathGroups.set(key, []);
  targetPathGroups.get(key).push(file);
}

const duplicateTargetConflicts = [];
for (const [future_server_path, files] of targetPathGroups) {
  const byteSignatures = new Set(files.map((file) => String(file.expectedBytes)));
  const modeSignatures = new Set(files.map((file) => file.deploy_mode));
  if (files.length > 1 && (byteSignatures.size > 1 || modeSignatures.size > 1)) {
    duplicateTargetConflicts.push({
      future_server_path,
      entries: files.map((file) => ({
        manifest: file.manifest,
        deploy_mode: file.deploy_mode,
        local_rel: file.local_rel,
        bytes: file.expectedBytes,
      })),
    });
  }
}

for (const conflict of duplicateTargetConflicts) {
  issues.push({
    level: 'error',
    type: 'duplicate-target-conflict',
    future_server_path: conflict.future_server_path,
    entries: conflict.entries,
  });
}

const summary = {
  manifests: manifests.length,
  files_checked: allFiles.length,
  bytes_expected: allFiles.reduce((sum, file) => sum + Number(file.expectedBytes || 0), 0),
  missing_files: issues.filter((issue) => issue.type === 'missing-local-file').length,
  byte_mismatches: issues.filter((issue) => issue.type === 'byte-mismatch').length,
  duplicate_target_conflicts: duplicateTargetConflicts.length,
  policy_issues: issues.filter((issue) => issue.type === 'deploy-policy').length,
  error_count: issues.filter((issue) => issue.level === 'error').length,
  review_count: issues.filter((issue) => issue.level === 'review').length,
};

const status = summary.error_count ? 'fail' : summary.review_count ? 'review' : 'pass';

const report = {
  generatedAt: new Date().toISOString(),
  status,
  packageRoot: path.relative(repoRoot, packageRoot).replaceAll('\\', '/'),
  summary,
  manifests,
  issues,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'deployment-package-integrity.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const manifestRows = manifests.map((manifest) => `<tr>
  <td><code>${htmlEscape(manifest.manifest)}</code></td>
  <td>${htmlEscape(manifest.deploy_mode)}</td>
  <td>${htmlEscape(manifest.checked_files)}</td>
  <td>${htmlEscape(manifest.missing_files)}</td>
  <td>${htmlEscape(manifest.byte_mismatches)}</td>
  <td>${htmlEscape(manifest.policy_issues)}</td>
</tr>`).join('');

const issueRows = issues.slice(0, 200).map((issue) => `<tr>
  <td>${htmlEscape(issue.level)}</td>
  <td>${htmlEscape(issue.type)}</td>
  <td><code>${htmlEscape(issue.manifest || '')}</code></td>
  <td><code>${htmlEscape(issue.local_rel || issue.future_server_path || '')}</code></td>
  <td>${htmlEscape((issue.messages || []).join('; ') || JSON.stringify(issue.entries || ''))}</td>
</tr>`).join('');

fs.writeFileSync(
  path.join(reportDir, 'deployment-package-integrity.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deployment Package Integrity</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df;margin:16px 0}
    th,td{padding:8px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:700}
  </style>
</head>
<body>
  <h1>Deployment Package Integrity</h1>
  <p>Status: <strong>${htmlEscape(status)}</strong>. Generated at <code>${htmlEscape(report.generatedAt)}</code>.</p>
  <p>This report validates local deployment package manifests only. It does not upload files or authorize deployment.</p>
  <div class="cards">
    <div class="card"><div>Manifests</div><div class="num">${summary.manifests}</div></div>
    <div class="card"><div>Files checked</div><div class="num">${summary.files_checked}</div></div>
    <div class="card"><div>Missing files</div><div class="num">${summary.missing_files}</div></div>
    <div class="card"><div>Byte mismatches</div><div class="num">${summary.byte_mismatches}</div></div>
    <div class="card"><div>Target conflicts</div><div class="num">${summary.duplicate_target_conflicts}</div></div>
  </div>
  <h2>Manifests</h2>
  <table><thead><tr><th>Manifest</th><th>Mode</th><th>Files</th><th>Missing</th><th>Byte mismatch</th><th>Policy review</th></tr></thead><tbody>${manifestRows}</tbody></table>
  <h2>Issues</h2>
  <table><thead><tr><th>Level</th><th>Type</th><th>Manifest</th><th>Path</th><th>Detail</th></tr></thead><tbody>${issueRows || '<tr><td colspan="5">No issues.</td></tr>'}</tbody></table>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status,
  report: 'site/reports/deployment-package-integrity.html',
  summary,
}, null, 2));

if (summary.error_count) process.exit(1);
