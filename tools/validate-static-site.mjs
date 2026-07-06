import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const strict = process.argv.includes('--strict');
const reportDir = path.join(root, 'reports');
const checkedRoots = [
  path.join(root, 'index.html'),
  path.join(root, 'preview'),
];
const docExtensions = new Set(['.pdf', '.zip', '.dwg', '.dxf', '.step', '.stp', '.igs', '.iges', '.rar', '.7z']);

function walk(dir, accept, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, accept, out);
    else if (!accept || accept(full)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function htmlEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attrs(html, name) {
  const re = new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'gi');
  return [...html.matchAll(re)].map((m) => m[2]);
}

function readHtmlFiles() {
  const files = [];
  for (const item of checkedRoots) {
    if (!fs.existsSync(item)) continue;
    const stat = fs.statSync(item);
    if (stat.isFile() && item.toLowerCase().endsWith('.html')) files.push(item);
    if (stat.isDirectory()) walk(item, (file) => file.toLowerCase().endsWith('.html'), files);
  }
  return [...new Set(files)]
    .filter((file) => !rel(file).startsWith('preview/skipped/'))
    .sort();
}

function cleanRaw(raw) {
  return raw.split('#')[0].split('?')[0].trim();
}

function extensionOf(raw) {
  return path.extname(cleanRaw(raw).toLowerCase());
}

function isDocument(raw) {
  return docExtensions.has(extensionOf(raw));
}

function isRuntimePseudoLink(raw) {
  return /^\/cdn-cgi\/l\/email-protection/i.test(raw);
}

function resolveLocal(pageFile, raw) {
  if (!raw || raw.startsWith('#')) return null;
  if (/^(mailto|tel|javascript|data|blob):/i.test(raw)) return null;
  if (isRuntimePseudoLink(raw)) return null;
  if (/^https?:\/\//i.test(raw)) return null;
  const clean = cleanRaw(raw);
  if (!clean) return null;
  const base = clean.startsWith('/') ? root : path.dirname(pageFile);
  return path.resolve(base, clean.replace(/^\/+/, ''));
}

const issues = [];
const warnings = [];
const required = ['index.html', 'preview/products/detail', 'reports/product-standardization-report.html', 'reports/product-spec-module-qa.html'];
for (const item of required) {
  const full = path.join(root, item);
  if (!fs.existsSync(full)) issues.push({ level: 'error', type: 'required_missing', item });
}

const htmlFiles = readHtmlFiles();
let formalSameOriginRefs = 0;
let missingLocalRefs = 0;
let filePathRefs = 0;
let txtHrefRefs = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (/file:\/\/\/|[A-Z]:\\/i.test(html)) {
    filePathRefs += 1;
    issues.push({ level: 'error', type: 'local_path_in_html', file: rel(file) });
  }
  for (const href of attrs(html, 'href')) {
    if (/taiwan-servo\.com\.tw/i.test(href) && !isDocument(href)) {
      formalSameOriginRefs += 1;
      warnings.push({ level: 'warn', type: 'formal_same_origin_href', file: rel(file), href });
    }
    if (/\.txt(?:[#?]|$)/i.test(href)) {
      txtHrefRefs += 1;
      issues.push({ level: 'error', type: 'txt_href', file: rel(file), href });
    }
    const local = resolveLocal(file, href);
    if (local && !fs.existsSync(local)) {
      missingLocalRefs += 1;
      warnings.push({ level: 'warn', type: 'missing_local_href', file: rel(file), href });
    }
  }
  for (const src of attrs(html, 'src')) {
    const local = resolveLocal(file, src);
    if (local && !fs.existsSync(local)) {
      missingLocalRefs += 1;
      warnings.push({ level: 'warn', type: 'missing_local_src', file: rel(file), src });
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  root: root.replace(/\\/g, '/'),
  strict,
  summary: {
    html_files: htmlFiles.length,
    errors: issues.length,
    warnings: warnings.length,
    formal_same_origin_refs: formalSameOriginRefs,
    missing_local_refs: missingLocalRefs,
    file_path_refs: filePathRefs,
    txt_href_refs: txtHrefRefs,
  },
  issues,
  warnings: warnings.slice(0, 1000),
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'github-ready-validation.json'), JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(path.join(reportDir, 'github-ready-validation.html'), `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>GitHub Ready Validation</title><style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{background:#eef7f0}</style></head><body><h1>GitHub Ready Validation</h1><pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre><h2>Issues</h2><table><tbody>${issues.map((x) => `<tr><td>${htmlEscape(x.type)}</td><td>${htmlEscape(x.file || x.item || '')}</td><td>${htmlEscape(x.href || x.src || '')}</td></tr>`).join('')}</tbody></table><h2>Warnings sample</h2><table><tbody>${warnings.slice(0, 300).map((x) => `<tr><td>${htmlEscape(x.type)}</td><td>${htmlEscape(x.file || '')}</td><td>${htmlEscape(x.href || x.src || '')}</td></tr>`).join('')}</tbody></table></body></html>`, 'utf8');

console.log(JSON.stringify({ status: issues.length ? 'issues' : 'ok', report: 'site/reports/github-ready-validation.html', summary: report.summary }, null, 2));
if (issues.length || (strict && warnings.length)) process.exit(1);
