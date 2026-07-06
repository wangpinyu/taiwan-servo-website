import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'site', 'reports');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function classifyDeployReview(file) {
  if (file.deploy_mode === 'same-path-overwrite' && file.safe_to_overwrite) {
    return {
      bucket: 'same-path-overwrite',
      action: 'Can be reviewed for optimized same-path upload after backup and approval.',
    };
  }

  if (file.deploy_mode === 'backend-managed-download-route') {
    return {
      bucket: 'backend-managed-download-route',
      action: 'Handle through backend/file-manager workflow, not raw server overwrite.',
    };
  }

  if (file.deploy_mode === 'site-static-asset-review') {
    return {
      bucket: 'site-static-asset-review',
      action: 'Review as site-level static asset before replacement.',
    };
  }

  const usedByCss = (file.used_by_pages || []).some((item) => String(item).endsWith('.css'));
  const noServerPath = !file.source_url && !file.future_server_path;
  const isMissingSourceMarker = file.local_rel === 'assets-cache/missing-source-asset.svg';
  const isZeroByteLocalPlaceholder = Number(file.bytes || 0) === 0 && noServerPath;

  if (file.deploy_mode === 'needs-review' && noServerPath && (isMissingSourceMarker || isZeroByteLocalPlaceholder)) {
    return {
      bucket: 'local-placeholder-exclude',
      action: 'Exclude from deployment; resolve at the page source or original asset mapping before server overwrite.',
    };
  }

  if (file.deploy_mode === 'needs-review' && noServerPath && usedByCss) {
    return {
      bucket: 'css-relative-asset',
      action: 'Keep with the mirrored CSS asset bundle or remap with the CSS source path during deployment.',
    };
  }

  return {
    bucket: 'unresolved-needs-review',
    action: 'Manual deployment classification is still required.',
  };
}

const deployManifest = readJson('site/reports/deploy-manifest.json');
const files = deployManifest.files || [];
const rows = files.map((file) => ({
  ...file,
  ...classifyDeployReview(file),
}));

const bucketCounts = rows.reduce((acc, row) => {
  acc[row.bucket] = (acc[row.bucket] || 0) + 1;
  return acc;
}, {});

const bucketBytes = rows.reduce((acc, row) => {
  acc[row.bucket] = (acc[row.bucket] || 0) + Number(row.bytes || 0);
  return acc;
}, {});

const unresolved = rows.filter((row) => row.bucket === 'unresolved-needs-review');
const report = {
  generatedAt: new Date().toISOString(),
  status: unresolved.length ? 'review-required' : 'classified',
  summary: {
    totalDeployFiles: rows.length,
    bucketCounts,
    bucketBytes,
    unresolvedNeedsReview: unresolved.length,
  },
  buckets: {
    samePathOverwrite: 'Files under /uploads/... that can be optimized and restored to the same server path after backup and approval.',
    backendManagedDownloadRoute: 'Files served by /file/download or /file/output. These are backend-managed and should not be overwritten blindly.',
    siteStaticAssetReview: 'Static site-level assets such as favicon. Review separately before replacement.',
    cssRelativeAsset: 'Assets referenced from mirrored CSS without a stable public future_server_path. Keep them with the CSS bundle or remap during deployment.',
    localPlaceholderExclude: 'Local missing-source markers or zero-byte placeholders. Exclude from deployment and resolve through source mapping.',
    unresolvedNeedsReview: 'Files that still need manual classification.',
  },
  unresolved,
  files: rows,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'deployment-review-classification.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const bucketRows = Object.keys(bucketCounts).sort().map((bucket) => `<tr>
  <td>${htmlEscape(bucket)}</td>
  <td>${htmlEscape(bucketCounts[bucket])}</td>
  <td>${htmlEscape(bucketBytes[bucket] || 0)}</td>
</tr>`).join('');

const sampleRows = rows
  .filter((row) => row.bucket !== 'same-path-overwrite')
  .slice(0, 120)
  .map((row) => `<tr>
    <td>${htmlEscape(row.bucket)}</td>
    <td>${htmlEscape(row.deploy_mode)}</td>
    <td>${htmlEscape(row.local_rel)}</td>
    <td>${htmlEscape(row.future_server_path || '')}</td>
    <td>${htmlEscape(row.used_by_pages?.slice(0, 3).join(', ') || '')}</td>
    <td>${htmlEscape(row.action)}</td>
  </tr>`)
  .join('');

fs.writeFileSync(
  path.join(reportDir, 'deployment-review-classification.html'),
  `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deployment Review Classification</title>
  <style>
    body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df;margin:16px 0}
    th,td{padding:8px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>Deployment Review Classification</h1>
  <p>Status: <strong>${htmlEscape(report.status)}</strong>. Generated at <code>${htmlEscape(report.generatedAt)}</code>.</p>
  <p>This report classifies non-overwrite deployment files so CSS bundle assets, backend-managed downloads, and site static files are not mixed into one vague review bucket.</p>
  <h2>Bucket Summary</h2>
  <table><thead><tr><th>Bucket</th><th>Files</th><th>Bytes</th></tr></thead><tbody>${bucketRows}</tbody></table>
  <h2>Non-overwrite Samples</h2>
  <table><thead><tr><th>Bucket</th><th>Deploy mode</th><th>Local file</th><th>Future server path</th><th>Used by</th><th>Action</th></tr></thead><tbody>${sampleRows}</tbody></table>
</body>
</html>`,
  'utf8',
);

console.log(JSON.stringify({
  status: report.status,
  report: 'site/reports/deployment-review-classification.html',
  summary: report.summary,
}, null, 2));
