import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');
const strict = process.argv.includes('--strict');

const INTERNAL_NOTE_RE = /待人工上架|待上架|待確認|後續由人工|不新增未經證實|\bplaceholder\b|\bpending\b|\bTODO\b|對應星泰頁面|欄位與系列排序|未取得可安全轉載|先保留官方文件按鈕|先保留按鈕|本區依|本頁依|本次未納入|後台上架|正式站內(?:檔案|連結)?\s*URL|正式站內連結|正式\s*URL|正式連結|人工補入|再補入|上架後再替換|後替換|後再替換|待替換|待並替換|後設定|預留路徑|已下載到本機|已整理到本機|本機檔案|下載檔案先整理到本機|按鈕先保留|下載按鈕目前|檔案已下載整理到本機|預備區|official-source package|upload to Shin Tai manually|檔案上傳至星泰後台|本機 PDF，後 URL/i;

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

function stripTags(text) {
  return decodeHtml(text)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function count(html, re) {
  return [...String(html || '').matchAll(re)].length;
}

function specBlock(html) {
  const m = String(html || '').match(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/i);
  return m ? m[1] : '';
}

function anchors(html) {
  return [...String(html || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => {
    const attrs = m[1] || '';
    const href = attrs.match(/\shref=(["'])(.*?)\1/i)?.[2] || '';
    const aria = attrs.match(/\saria-label=(["'])(.*?)\1/i)?.[2] || '';
    return { href, aria, text: stripTags(m[2]), tag: m[0] };
  });
}

function hasInternalNote(block) {
  return INTERNAL_NOTE_RE.test(stripTags(block));
}

function hasSpecCta(block) {
  const text = stripTags(block);
  return /請洽星泰|加入詢問|詢問|inquiry|contact|quote/i.test(text);
}

function isTechnicalAnchor(anchor) {
  const joined = `${anchor.tag} ${anchor.text} ${anchor.aria}`;
  return /(?:\.pdf|\.zip|\.dwg|\.step|\.stp|\.dxf|\.cad|PDF|CAD|Manual|Catalog|Drawing|Software|下載|型錄|規格|資料表|手冊|工程圖)/i.test(joined);
}

function isExternalDocumentAnchor(anchor) {
  return /^https?:\/\//i.test(anchor.href || '') && isTechnicalAnchor(anchor);
}

function validate(page) {
  const file = path.join(root, page.preview_rel);
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const block = specBlock(html);
  const linkList = anchors(block);
  const technical = linkList.filter(isTechnicalAnchor);
  const critical = [];
  const warnings = [];

  if (page.status !== 'no-spec-module' && !block) critical.push('missing_standardized_spec_block');
  if (/<img\b/i.test(block)) critical.push('spec_contains_image');
  if (/href=(["'])(?:#|javascript:void\(0\)|)\1/i.test(block)) critical.push('spec_placeholder_href');
  if (/href=(["'])[^"']*\.txt/i.test(block)) critical.push('spec_txt_href');
  if (/file:\/\/\/|[A-Z]:\\/i.test(block)) critical.push('spec_local_path');
  if (/\sdata-(?:local-file|upload-url|source-url)=/i.test(block)) critical.push('spec_internal_data_attrs');
  if (block && hasInternalNote(block)) critical.push('spec_internal_note_text');

  if (block && !hasSpecCta(block)) warnings.push('spec_cta_missing_or_outside_block');

  const weakLabels = technical.filter((a) => {
    const visible = `${a.text}`.trim();
    const label = `${a.aria}`.trim();
    return /^(PDF|CAD|ZIP|Download|下載)$/i.test(visible) && !label;
  }).length;
  if (weakLabels) warnings.push(`download_label_needs_review:${weakLabels}`);

  const qaStatus = critical.length
    ? 'fail'
    : warnings.length
      ? 'warn'
      : block
        ? 'pass'
        : page.status === 'no-spec-module'
          ? 'no-spec-module'
          : 'warn';

  return {
    product_id: page.product_id,
    title: page.title,
    category_path: page.category_path || [],
    preview_rel: page.preview_rel,
    spec_candidate_rel: page.spec_candidate_rel || '',
    overlay_status: page.status,
    qa_status: qaStatus,
    counts: {
      details: count(block, /<details\b/gi),
      tables: count(block, /<table\b/gi),
      pdf_links: count(block, /href=(["'])[^"']*\.pdf(?:[#?][^"']*)?\1/gi),
      cad_links: count(block, /\.(?:dwg|dxf|step|stp|cad)(?:[#?]|["'])/gi),
      zip_links: count(block, /href=(["'])[^"']*\.zip(?:[#?][^"']*)?\1/gi),
      external_document_links: linkList.filter(isExternalDocumentAnchor).length,
      cta_count: hasSpecCta(block) ? 1 : 0,
      spec_images: count(block, /<img\b/gi),
      href_hash: count(block, /href=(["'])(?:#|javascript:void\(0\)|)\1/gi),
      data_attr_count: count(block, /\sdata-(?:local-file|upload-url|source-url)=/gi),
    },
    critical,
    warnings,
  };
}

if (!fs.existsSync(standardizationPath)) {
  console.error(`Missing ${standardizationPath}`);
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(standardizationPath, 'utf8'));
const pages = source.pages.map(validate);
const counts = {};
for (const page of pages) counts[page.qa_status] = (counts[page.qa_status] || 0) + 1;

const report = {
  generated_at: new Date().toISOString(),
  scope: 'GitHub-ready product spec module QA',
  summary: {
    total_pages: pages.length,
    qa_status_counts: counts,
    fail_count: counts.fail || 0,
    warn_count: counts.warn || 0,
    pass_count: counts.pass || 0,
    no_spec_module_count: counts['no-spec-module'] || 0,
  },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'product-spec-module-qa.json'), JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(path.join(reportDir, 'product-spec-module-qa.html'), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>產品規格詳情 QA</title>
  <style>
    body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px;color:#122033}
    table{border-collapse:collapse;width:100%}
    td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#eef7f0}
  </style>
</head>
<body>
  <h1>產品規格詳情 QA</h1>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>ID</th><th>產品</th><th>QA</th><th>嚴重問題</th><th>警告</th></tr></thead>
    <tbody>${pages.map((p) => `<tr><td>${htmlEscape(p.product_id)}</td><td><a href="../${htmlEscape(p.preview_rel)}">${htmlEscape(p.title)}</a></td><td>${htmlEscape(p.qa_status)}</td><td>${htmlEscape(p.critical.join(' / '))}</td><td>${htmlEscape(p.warnings.join(' / '))}</td></tr>`).join('')}</tbody>
  </table>
</body>
</html>`, 'utf8');

console.log(JSON.stringify({ status: report.summary.fail_count ? 'issues' : 'ok', report: 'site/reports/product-spec-module-qa.html', summary: report.summary }, null, 2));

if (report.summary.fail_count || (strict && report.summary.warn_count)) process.exit(1);
