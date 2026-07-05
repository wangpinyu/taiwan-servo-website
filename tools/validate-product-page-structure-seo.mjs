import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const standardizationPath = path.join(reportDir, 'product-standardization-report.json');
const strict = process.argv.includes('--strict');

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stripTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function count(html, re) {
  return [...String(html || '').matchAll(re)].length;
}

function matchOne(html, re) {
  return String(html || '').match(re)?.[0] || '';
}

function getHead(html) {
  return String(html || '').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
}

function getBody(html) {
  return String(html || '').match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
}

function specBlock(html) {
  const m = String(html || '').match(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/i);
  return m ? m[1] : '';
}

function attrValue(attrs, name) {
  return attrs.match(new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'i'))?.[2] || '';
}

function anchors(html) {
  return [...String(html || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => {
    const attrs = m[1] || '';
    return {
      href: attrValue(attrs, 'href'),
      aria: attrValue(attrs, 'aria-label'),
      text: stripTags(m[2]),
      tag: m[0],
    };
  });
}

function buttonTags(html) {
  return [...String(html || '').matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].map((m) => ({
    attrs: m[1] || '',
    text: stripTags(m[2]),
  }));
}

function tableHeaders(tableHtml) {
  return [...String(tableHtml || '').matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => stripTags(m[1]));
}

function classifyDownload(anchor) {
  const joined = `${anchor.href} ${anchor.aria} ${anchor.text}`.toLowerCase();
  if (/\.pdf(?:[#?]|$)/i.test(anchor.href) || /\bpdf\b/i.test(joined)) return 'pdf';
  if (/\.(?:dwg|dxf|step|stp|cad)(?:[#?]|$)/i.test(anchor.href) || /\bcad\b|drawing|2d|3d|step/i.test(joined)) return 'cad';
  if (/\.zip(?:[#?]|$)/i.test(anchor.href)) return 'zip';
  if (/manual|installation|user guide|操作|安裝|手冊/i.test(joined)) return 'manual';
  if (/catalog|datasheet|data sheet|型錄|規格書|資料表/i.test(joined)) return 'document';
  if (/software|軟體/i.test(joined)) return 'software';
  return '';
}

function validate(page) {
  const file = path.join(root, page.preview_rel);
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const head = getHead(html);
  const body = getBody(html);
  const block = specBlock(html);
  const critical = [];
  const warnings = [];

  const h1Count = count(body, /<h1\b/gi);
  const titleText = stripTags(matchOne(head, /<title\b[^>]*>[\s\S]*?<\/title>/i));
  const canonical = head.match(/<link\b[^>]*rel=(["'])canonical\1[^>]*>/i)?.[0] || '';
  const metaDescription = head.match(/<meta\b[^>]*name=(["'])description\1[^>]*>/i)?.[0] || '';
  const breadcrumbPresent = /BreadcrumbList/i.test(head) || /麵包屑|breadcrumb/i.test(body);
  const bodyTitleCount = count(body, /<title\b/gi);

  if (!html) critical.push('html_missing');
  if (h1Count !== 1) critical.push(`h1_count:${h1Count}`);
  if (!titleText) critical.push('title_missing');
  if (!canonical) critical.push('canonical_missing');
  if (!breadcrumbPresent) warnings.push('breadcrumb_not_detected');
  if (!metaDescription) warnings.push('meta_description_missing');
  if (bodyTitleCount) warnings.push(`body_title_tag:${bodyTitleCount}`);

  const status = page.status || '';
  if (status !== 'no-spec-module' && !block) critical.push('spec_block_missing');
  if (block) {
    const specIndex = html.indexOf('<!-- standardized-spec-module:start -->');
    const seriesIndex = Number(page.validation?.order?.seriesIdx ?? -1);
    if (seriesIndex >= 0 && specIndex >= 0 && specIndex < seriesIndex) critical.push('spec_before_series');
    if (/<img\b/i.test(block)) critical.push('spec_contains_image');
    if (/href=(["'])(?:#|javascript:void\(0\)|)\1/i.test(block)) critical.push('spec_placeholder_href');
    if (/href=(["'])[^"']*\.txt(?:[#?][^"']*)?\1/i.test(block)) critical.push('spec_txt_href');
    if (/file:\/\/\/|[A-Z]:\\/i.test(block)) critical.push('spec_local_path');
    if (/\sdata-(?:local-file|upload-url|source-url)=/i.test(block)) critical.push('spec_internal_data_attrs');
    if (/待人工上架|待上架|待確認|後續由人工|不新增未經證實|placeholder|pending|TODO/i.test(block)) {
      critical.push('spec_internal_note_text');
    }

    const detailsCount = count(block, /<details\b/gi);
    const summaryCount = count(block, /<summary\b/gi);
    const buttons = buttonTags(block);
    const ariaButtons = buttons.filter((button) => /aria-expanded=/i.test(button.attrs) && /aria-controls=/i.test(button.attrs));
    if (detailsCount && summaryCount < detailsCount) warnings.push('details_without_matching_summary');
    if (!detailsCount && buttons.length && ariaButtons.length < buttons.length) warnings.push('accordion_buttons_need_aria_review');
    if (!detailsCount && !buttons.length && /accordion|展開|收合/i.test(block)) warnings.push('accordion_control_not_detected');

    const tables = [...block.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => m[0]);
    if (!tables.length) warnings.push('spec_table_missing');
    for (const [index, table] of tables.entries()) {
      const headers = tableHeaders(table);
      if (!headers.length) warnings.push(`table_${index + 1}_headers_missing`);
      const modelLike = headers.some((header) => /part\s*number|model|型號|系列/i.test(header));
      if (!modelLike) warnings.push(`table_${index + 1}_model_header_not_detected`);
      const unitLike = headers.some((header) => /\((?:mm|n|kg|v|dc|ac|nm|rpm|um|μm|a|w|kw)\)|mm|力|電壓|行程|尺寸|扭矩|解析度/i.test(header));
      if (!unitLike) warnings.push(`table_${index + 1}_unit_header_not_detected`);
    }

    const specAnchors = anchors(block);
    const downloadAnchors = specAnchors
      .map((anchor) => ({ ...anchor, downloadType: classifyDownload(anchor) }))
      .filter((anchor) => anchor.downloadType);
    const weakDownloadLabels = downloadAnchors.filter((anchor) => {
      const visible = `${anchor.aria} ${anchor.text}`.trim();
      return !anchor.aria && /^(PDF|CAD|ZIP|Download|下載)$/i.test(visible);
    });
    if (weakDownloadLabels.length) warnings.push(`download_label_too_generic:${weakDownloadLabels.length}`);
    if (downloadAnchors.some((anchor) => !anchor.downloadType)) warnings.push('download_type_unclassified');

    const ctaAnchors = specAnchors.filter((anchor) => /詢問|加入詢問|洽詢|contact|inquiry|quote/i.test(`${anchor.href} ${anchor.aria} ${anchor.text}`));
    if (!ctaAnchors.length && !/請洽星泰|洽星泰/i.test(block)) warnings.push('spec_cta_not_detected');
    if (ctaAnchors.some((anchor) => !anchor.href || anchor.href === '#')) critical.push('spec_cta_placeholder_href');
  }

  const warningSet = [...new Set(warnings)];
  const criticalSet = [...new Set(critical)];
  return {
    product_id: page.product_id,
    title: page.title,
    category_path: page.category_path || [],
    preview_rel: page.preview_rel,
    overlay_status: status,
    page_checks: {
      h1_count: h1Count,
      title_present: Boolean(titleText),
      canonical_present: Boolean(canonical),
      meta_description_present: Boolean(metaDescription),
      breadcrumb_detected: breadcrumbPresent,
      body_title_tag_count: bodyTitleCount,
    },
    spec_checks: {
      has_spec_block: Boolean(block),
      details: count(block, /<details\b/gi),
      summaries: count(block, /<summary\b/gi),
      buttons: buttonTags(block).length,
      aria_buttons: buttonTags(block).filter((button) => /aria-expanded=/i.test(button.attrs) && /aria-controls=/i.test(button.attrs)).length,
      tables: count(block, /<table\b/gi),
      download_links: anchors(block).map(classifyDownload).filter(Boolean).length,
      cta_links: anchors(block).filter((anchor) => /詢問|加入詢問|洽詢|contact|inquiry|quote/i.test(`${anchor.href} ${anchor.aria} ${anchor.text}`)).length,
    },
    critical: criticalSet,
    warnings: warningSet,
    qa_status: criticalSet.length ? 'fail' : warningSet.length ? 'warn' : status === 'no-spec-module' ? 'no-spec-module' : 'pass',
  };
}

if (!fs.existsSync(standardizationPath)) {
  console.error(`Missing ${standardizationPath}`);
  process.exit(1);
}

const standardization = JSON.parse(fs.readFileSync(standardizationPath, 'utf8'));
const pages = (standardization.pages || []).map(validate);
const counts = {};
for (const page of pages) counts[page.qa_status] = (counts[page.qa_status] || 0) + 1;

const report = {
  generated_at: new Date().toISOString(),
  scope: 'Product detail page SEO and structure QA',
  strict,
  policy: {
    fails_validate_on: ['missing html', 'wrong H1 count', 'missing title', 'missing canonical', 'spec block safety errors'],
    warnings_are_review_queue: true,
  },
  summary: {
    total_pages: pages.length,
    status_counts: counts,
    fail_count: counts.fail || 0,
    warn_count: counts.warn || 0,
    pass_count: counts.pass || 0,
    no_spec_module_count: counts['no-spec-module'] || 0,
  },
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'product-page-structure-seo-qa.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const rows = pages
  .map((page) => `<tr>
    <td>${htmlEscape(page.product_id)}</td>
    <td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
    <td>${htmlEscape(page.qa_status)}</td>
    <td>${htmlEscape(page.critical.join(' / '))}</td>
    <td>${htmlEscape(page.warnings.join(' / '))}</td>
  </tr>`)
  .join('\n');

fs.writeFileSync(path.join(reportDir, 'product-page-structure-seo-qa.html'), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>產品頁 SEO 與結構 QA</title>
  <style>
    body{font-family:Arial,"Noto Sans TC","Microsoft JhengHei",sans-serif;margin:24px;color:#122033;background:#f8faf8}
    table{border-collapse:collapse;width:100%;background:#fff}
    th,td{border:1px solid #d8e2dc;padding:10px;text-align:left;vertical-align:top}
    th{background:#e9f4ed}
    .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
    .card{background:#fff;border:1px solid #d8e2dc;border-radius:8px;padding:12px 16px}
  </style>
</head>
<body>
  <h1>產品頁 SEO 與結構 QA</h1>
  <p>檢查 H1、title、canonical、breadcrumb、產品規格詳情位置、accordion/table/CTA/download 可用性，以及是否有前台不該出現的內部註解。</p>
  <div class="summary">
    <div class="card">Total: ${htmlEscape(report.summary.total_pages)}</div>
    <div class="card">Fail: ${htmlEscape(report.summary.fail_count)}</div>
    <div class="card">Warn: ${htmlEscape(report.summary.warn_count)}</div>
    <div class="card">Pass: ${htmlEscape(report.summary.pass_count)}</div>
    <div class="card">No spec module: ${htmlEscape(report.summary.no_spec_module_count)}</div>
  </div>
  <pre>${htmlEscape(JSON.stringify(report.summary, null, 2))}</pre>
  <table>
    <thead><tr><th>ID</th><th>產品頁</th><th>QA</th><th>Critical</th><th>Warnings</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`, 'utf8');

console.log(JSON.stringify({ status: report.summary.fail_count ? 'issues' : 'ok', report: 'site/reports/product-page-structure-seo-qa.html', summary: report.summary }, null, 2));
if (report.summary.fail_count || (strict && report.summary.warn_count)) process.exit(1);
