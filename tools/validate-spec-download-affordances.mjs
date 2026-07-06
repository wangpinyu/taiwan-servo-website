import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const productDir = path.join(root, 'preview', 'products', 'detail');
const reportDir = path.join(root, 'reports');
const strict = process.argv.includes('--strict');

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function attrValue(attrs, name) {
  return attrs.match(new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'i'))?.[2] || '';
}

function countMatches(value, re) {
  return [...String(value || '').matchAll(re)].length;
}

function extractSpecBlocks(html) {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/gi)) {
    blocks.push(match[1]);
  }
  if (blocks.length) return blocks;
  for (const match of String(html || '').matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)) {
    if (/產品規格詳情/.test(stripTags(match[1]))) blocks.push(match[0]);
  }
  return blocks;
}

function anchors(block) {
  return [...String(block || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => {
    const attrs = match[1] || '';
    return {
      href: attrValue(attrs, 'href'),
      aria: attrValue(attrs, 'aria-label'),
      text: stripTags(match[2]),
      tag: match[0],
    };
  });
}

function technicalText(value) {
  return /(?:\.pdf|\.zip|\.dwg|\.dxf|\.step|\.stp|\.cad|PDF|CAD|ZIP|Manual|Catalog|Drawing|Software|datasheet|data sheet|規格|型錄|手冊|下載|文件|工程圖)/i.test(value);
}

function validateFile(file) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = fs.readFileSync(file, 'utf8');
  const blocks = extractSpecBlocks(html);
  const combined = blocks.join('\n');
  const critical = [];
  const warnings = [];

  const pageInternalAttrs = countMatches(html, /\sdata-(?:file-key|original-url|source-url)=/gi);
  if (pageInternalAttrs) critical.push(`internal_download_attrs:${pageInternalAttrs}`);

  const placeholderDocHrefs = anchors(combined).filter((anchor) => {
    const href = String(anchor.href || '').trim();
    return technicalText(`${anchor.tag} ${anchor.text} ${anchor.aria}`) && (!href || href === '#' || /^javascript:/i.test(href));
  }).length;
  if (placeholderDocHrefs) critical.push(`placeholder_doc_href:${placeholderDocHrefs}`);

  const combinedWithoutAnchors = combined.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ');
  const inertFileLabels = [...combinedWithoutAnchors.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi)].filter((match) => {
    const attrs = match[1] || '';
    const visible = stripTags(match[2]);
    const className = attrValue(attrs, 'class');
    const hasContactStatus = /請洽星泰|原廠未公開|待人工確認/.test(visible);
    const hasHref = /\shref=/i.test(attrs);
    const isFileUi = /\b(?:file|download|doc)\b/i.test(className);
    const isDecorative = /\b(?:badge|code|icon)\b/i.test(className);
    return isFileUi && !hasHref && !hasContactStatus && !isDecorative && /^(PDF|CAD|ZIP|Download|下載)$/i.test(visible);
  }).length;
  if (inertFileLabels) critical.push(`inert_file_labels:${inertFileLabels}`);

  const technicalLinks = anchors(combined).filter((anchor) => technicalText(`${anchor.href} ${anchor.text} ${anchor.aria}`));
  const weakLinkLabels = technicalLinks.filter((anchor) => {
    const visible = anchor.text.trim();
    const aria = anchor.aria.trim();
    return /^(PDF|CAD|ZIP|Download|下載)$/i.test(visible) && !aria;
  }).length;
  if (weakLinkLabels) warnings.push(`weak_doc_link_labels:${weakLinkLabels}`);

  const contactStatuses = countMatches(combined, /請洽星泰/g);
  const actionableDocLinks = technicalLinks.filter((anchor) => {
    const href = String(anchor.href || '').trim();
    return href && href !== '#' && !/^javascript:/i.test(href);
  }).length;

  return {
    file: rel,
    spec_blocks: blocks.length,
    actionable_doc_links: actionableDocLinks,
    contact_statuses: contactStatuses,
    critical,
    warnings,
    status: critical.length ? 'fail' : warnings.length && strict ? 'warn' : 'pass',
  };
}

if (!fs.existsSync(productDir)) {
  console.error(`Missing product directory: ${productDir}`);
  process.exit(1);
}

const pages = fs.readdirSync(productDir)
  .filter((entry) => entry.endsWith('.html'))
  .map((entry) => validateFile(path.join(productDir, entry)));

const pagesWithSpecs = pages.filter((page) => page.spec_blocks > 0);
const failed = pages.filter((page) => page.critical.length);
const warned = pages.filter((page) => page.warnings.length);

const report = {
  generated_at: new Date().toISOString(),
  scope: 'product detail download affordance validation',
  summary: {
    total_pages: pages.length,
    pages_with_specs: pagesWithSpecs.length,
    fail_count: failed.length,
    warn_count: warned.length,
    actionable_doc_links: pages.reduce((sum, page) => sum + page.actionable_doc_links, 0),
    contact_statuses: pages.reduce((sum, page) => sum + page.contact_statuses, 0),
  },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'spec-download-affordance-validation.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(reportDir, 'spec-download-affordance-validation.html'), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>產品規格下載入口驗證</title>
  <style>
    body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px;color:#122033}
    table{border-collapse:collapse;width:100%}
    td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#eef7f0}
    .fail{color:#b42318;font-weight:700}.warn{color:#9a6700;font-weight:700}.pass{color:#087443;font-weight:700}
  </style>
</head>
<body>
  <h1>產品規格下載入口驗證</h1>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>頁面</th><th>狀態</th><th>可點文件連結</th><th>請洽星泰</th><th>Critical</th><th>Warnings</th></tr></thead>
    <tbody>${pages.map((page) => `<tr><td><a href="../${htmlEscape(page.file)}">${htmlEscape(page.file)}</a></td><td class="${htmlEscape(page.status)}">${htmlEscape(page.status)}</td><td>${page.actionable_doc_links}</td><td>${page.contact_statuses}</td><td>${htmlEscape(page.critical.join(' / '))}</td><td>${htmlEscape(page.warnings.join(' / '))}</td></tr>`).join('')}</tbody>
  </table>
</body>
</html>
`, 'utf8');

console.log(JSON.stringify({
  status: failed.length || (strict && warned.length) ? 'issues' : 'ok',
  report: 'site/reports/spec-download-affordance-validation.html',
  summary: report.summary,
}, null, 2));

if (failed.length || (strict && warned.length)) process.exit(1);
