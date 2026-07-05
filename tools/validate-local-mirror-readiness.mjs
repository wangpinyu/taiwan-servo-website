import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const checkedRoots = [
  path.join(root, 'index.html'),
  path.join(root, 'preview'),
];

const allowedExternalHosts = new Set([
  'www.taiwan-servo.com.tw',
  'taiwan-servo.com.tw',
  'new.da-vinci.com.tw',
]);

const docExtensions = new Set(['.pdf', '.zip', '.dwg', '.dxf', '.step', '.stp', '.igs', '.iges', '.rar', '.7z']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);
const htmlExtensions = new Set(['.html', '.htm', '']);
const assetUsagePath = path.join(root, 'asset-usage-report.json');

function walk(dir, accept, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, accept, out);
    else if (!accept || accept(full)) out.push(full);
  }
  return out;
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function unique(values) {
  return [...new Set(values)];
}

function readHtmlFiles() {
  const files = [];
  for (const item of checkedRoots) {
    if (!fs.existsSync(item)) continue;
    const stat = fs.statSync(item);
    if (stat.isFile() && item.toLowerCase().endsWith('.html')) files.push(item);
    if (stat.isDirectory()) walk(item, (file) => file.toLowerCase().endsWith('.html'), files);
  }
  return unique(files)
    .filter((file) => !rel(file).startsWith('preview/skipped/'))
    .sort();
}

function attrs(html, name) {
  const re = new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'gi');
  return [...html.matchAll(re)].map((m) => m[2].trim()).filter(Boolean);
}

function srcsetUrls(srcset) {
  return srcset
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function cleanRaw(raw) {
  return raw.split('#')[0].split('?')[0].trim();
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSameOriginKey(raw) {
  let parsed;
  try {
    parsed = new URL(raw, 'https://www.taiwan-servo.com.tw');
  } catch {
    return null;
  }
  return `${parsed.hostname.toLowerCase()}${safeDecode(parsed.pathname)}`;
}

function loadKnownResourceMap() {
  const map = new Map();
  if (!fs.existsSync(assetUsagePath)) return map;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(assetUsagePath, 'utf8'));
  } catch {
    return map;
  }
  for (const resource of data.resources || []) {
    if (!resource.local_rel) continue;
    const localPath = path.join(root, resource.local_rel);
    for (const key of [resource.source_url, resource.future_server_path]) {
      if (!key) continue;
      const normalized = normalizeSameOriginKey(key);
      if (normalized) map.set(normalized, localPath);
    }
  }
  return map;
}

const knownResourceMap = loadKnownResourceMap();

function resolveLocal(pageFile, raw) {
  if (!raw || raw.startsWith('#')) return null;
  if (/^(mailto|tel|javascript|data|blob):/i.test(raw)) return null;
  if (/^https?:\/\//i.test(raw)) return null;

  const clean = cleanRaw(raw);
  if (!clean) return null;

  const base = clean.startsWith('/') ? root : path.dirname(pageFile);
  const normalized = clean.replace(/^\/+/, '');
  const rawPath = path.resolve(base, normalized);
  const decodedPath = path.resolve(base, safeDecode(normalized));
  return { rawPath, decodedPath, clean };
}

function resolveSameOriginCandidates(raw) {
  if (!/^https?:\/\//i.test(raw)) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (!allowedExternalHosts.has(parsed.hostname.toLowerCase())) return null;
  const pathname = safeDecode(parsed.pathname);
  const clean = pathname.replace(/^\/+/, '');
  const candidates = [path.join(root, clean)];
  const known = knownResourceMap.get(normalizeSameOriginKey(raw));
  if (known) candidates.push(known);

  const detail = pathname.match(/^\/products\/detail\/(\d+)\/?$/i);
  if (detail) candidates.push(path.join(root, 'preview', 'products', 'detail', `${detail[1]}.html`));

  const category = pathname.match(/^\/products\/category\/(\d+)\/?$/i);
  if (category) candidates.push(path.join(root, 'preview', 'products', 'category', `${category[1]}.html`));

  if (/^\/products\/?$/i.test(pathname)) candidates.push(path.join(root, 'preview', 'products', 'index.html'));
  if (/^\/services\/?$/i.test(pathname)) candidates.push(path.join(root, 'preview', 'services', 'index.html'));

  return unique(candidates);
}

function existsAny(paths) {
  return paths.some((candidate) => candidate && fs.existsSync(candidate));
}

function extensionOf(raw) {
  const pathname = cleanRaw(raw).toLowerCase();
  return path.extname(pathname);
}

function isDocument(raw) {
  return docExtensions.has(extensionOf(raw));
}

function isImage(raw) {
  return imageExtensions.has(extensionOf(raw));
}

function isHtmlish(raw) {
  return htmlExtensions.has(extensionOf(raw));
}

function isSkippedSection(raw) {
  return /\/(contact|faq|download|downloads|recruit|article|video|videos)(\/|$)/i.test(raw);
}

function isRuntimePseudoLink(raw) {
  return /^\/cdn-cgi\/l\/email-protection/i.test(raw);
}

function collectReferences(file, html) {
  const refs = [];
  for (const attr of ['href', 'src', 'poster', 'data-src', 'data-original']) {
    for (const value of attrs(html, attr)) refs.push({ attr, raw: value });
  }
  for (const value of attrs(html, 'srcset')) {
    for (const src of srcsetUrls(value)) refs.push({ attr: 'srcset', raw: src });
  }
  return refs;
}

function issue(level, type, file, raw, extra = {}) {
  return { level, type, file: rel(file), raw, ...extra };
}

const htmlFiles = readHtmlFiles();
const issues = [];
const warnings = [];
let localRefs = 0;
let localMissing = 0;
let sameOriginRefs = 0;
let sameOriginMissing = 0;
let externalRefs = 0;
let documentRefs = 0;
let imageRefs = 0;
let filePathRefs = 0;
let txtHrefRefs = 0;
let skippedSectionRefs = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (/file:\/\/\/|[A-Z]:\\/i.test(html)) {
    filePathRefs += 1;
    issues.push(issue('error', 'local_path_in_html', file, ''));
  }

  for (const ref of collectReferences(file, html)) {
    const { attr, raw } = ref;
    if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript|data|blob):/i.test(raw)) continue;
    if (isRuntimePseudoLink(raw)) continue;
    if (attr === 'href' && /\.txt(?:[#?]|$)/i.test(raw)) {
      txtHrefRefs += 1;
      issues.push(issue('error', 'txt_href', file, raw));
      continue;
    }
    if (isDocument(raw)) documentRefs += 1;
    if (isImage(raw)) imageRefs += 1;

    const sameOriginCandidates = resolveSameOriginCandidates(raw);
    if (sameOriginCandidates) {
      sameOriginRefs += 1;
      if (isSkippedSection(raw)) {
        skippedSectionRefs += 1;
        continue;
      }
      if (!existsAny(sameOriginCandidates)) {
        sameOriginMissing += 1;
        warnings.push(issue('warn', 'same_origin_not_localized', file, raw, { expected: sameOriginCandidates.map((candidate) => rel(candidate)).join(' | ') }));
      }
      continue;
    }

    if (/^https?:\/\//i.test(raw)) {
      externalRefs += 1;
      continue;
    }

    const local = resolveLocal(file, raw);
    if (!local) continue;
    localRefs += 1;
    if (existsAny([local.rawPath, local.decodedPath])) continue;
    localMissing += 1;
    const level = isHtmlish(raw) || isImage(raw) ? 'error' : 'warn';
    const target = local.rawPath === local.decodedPath ? local.rawPath : `${local.rawPath} | ${local.decodedPath}`;
    const entry = issue(level, 'missing_local_reference', file, raw, { expected: target.replace(/\\/g, '/') });
    if (level === 'error') issues.push(entry);
    else warnings.push(entry);
  }
}

const report = {
  generated_at: new Date().toISOString(),
  root: root.replace(/\\/g, '/'),
  checked_scope: ['site/index.html', 'site/preview/**/*.html'],
  summary: {
    html_files: htmlFiles.length,
    errors: issues.length,
    warnings: warnings.length,
    local_refs: localRefs,
    missing_local_refs: localMissing,
    same_origin_refs: sameOriginRefs,
    same_origin_missing: sameOriginMissing,
    external_refs: externalRefs,
    document_refs: documentRefs,
    image_refs: imageRefs,
    file_path_refs: filePathRefs,
    txt_href_refs: txtHrefRefs,
    skipped_section_refs: skippedSectionRefs,
  },
  issues,
  warnings,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'local-mirror-readiness-current.json'), JSON.stringify(report, null, 2), 'utf8');

const rows = [...issues, ...warnings].slice(0, 1000).map((item) => `
  <tr>
    <td>${htmlEscape(item.level)}</td>
    <td>${htmlEscape(item.type)}</td>
    <td>${htmlEscape(item.file)}</td>
    <td>${htmlEscape(item.raw)}</td>
    <td>${htmlEscape(item.expected || '')}</td>
  </tr>`).join('');

fs.writeFileSync(path.join(reportDir, 'local-mirror-readiness-current.html'), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>Local Mirror Readiness Current</title>
  <style>
    body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px;color:#173326}
    pre{background:#f4f8f5;border:1px solid #d8e5dc;border-radius:8px;padding:16px;overflow:auto}
    table{border-collapse:collapse;width:100%;font-size:14px}
    th,td{border-bottom:1px solid #d8e5dc;padding:8px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    h1{color:#0b6f3a}
  </style>
</head>
<body>
  <h1>Local Mirror Readiness Current</h1>
  <p>Scope: <code>site/index.html</code> and <code>site/preview/**/*.html</code>.</p>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <h2>Issues And Warnings</h2>
  <table>
    <thead><tr><th>Level</th><th>Type</th><th>File</th><th>Reference</th><th>Expected Local Path</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`, 'utf8');

console.log(JSON.stringify({
  status: issues.length ? 'issues' : 'ok',
  report: 'site/reports/local-mirror-readiness-current.html',
  summary: report.summary,
}, null, 2));

if (issues.length) process.exit(1);
