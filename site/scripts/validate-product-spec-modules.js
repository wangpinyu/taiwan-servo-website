const fs = require('fs');
const path = require('path');

const workspace = process.cwd();
const outputRoot = path.join(workspace, '.codex_tmp', 'site-mirror-current');
const previewDetailRoot = path.join(outputRoot, 'preview', 'products', 'detail');
const reportRoot = path.join(outputRoot, 'reports');
const standardizationReportPath = path.join(reportRoot, 'product-standardization-report.json');

const internalNotePatterns = [
  /待人工上架/g,
  /待人工連結/g,
  /待人工替換/g,
  /待上架/g,
  /待確認/g,
  /後續由人工/g,
  /人工上架/g,
  /人工上傳/g,
  /替換正式/g,
  /不新增未經官方證實/g,
  /不新增未經證實/g,
  /按鈕保留上架位置/g,
  /已整理本機官方\s*PDF/g,
  /已上傳至測試網/g,
  /本機下載受阻/g,
  /upload placeholder/gi,
  /placeholder/gi,
  /pending/gi,
  /data-local-file/gi,
];

const technicalDownloadPattern = /(?:\.pdf|\.zip|\.dwg|\.step|\.stp|\.dxf|\.cad|PDF|CAD|Manual|Catalog|Drawing|Software|型錄|手冊|圖面|下載)/i;
const unitSensitiveHeaderPattern = /(?:Force|Stroke|Voltage|Torque|Speed|Current|Power|Accuracy|Resolution|Load|Travel|Thrust|推力|行程|電壓|扭矩|速度|電流|功率|精度|解析度|負載)/i;
const allowedUnitlessHeaderPattern = /^(?:PDF|CAD|型號|系列|Part Number|Model|產品|文件|下載|應用|說明|備註)$/i;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readUtf8(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeUtf8(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, 'utf8');
}

function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(html, re) {
  return [...String(html || '').matchAll(re)].length;
}

function extractSpecBlock(html) {
  const m = String(html || '').match(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/i);
  return m ? m[1] : '';
}

function extractTitle(html, fallback) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripTags(title[1]) : fallback;
}

function extractAnchors(html) {
  const anchors = [];
  for (const m of String(html || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1] || '';
    const hrefMatch = attrs.match(/\shref=(["'])(.*?)\1/i);
    const ariaMatch = attrs.match(/\saria-label=(["'])(.*?)\1/i);
    const targetMatch = attrs.match(/\starget=(["'])(.*?)\1/i);
    const relMatch = attrs.match(/\srel=(["'])(.*?)\1/i);
    anchors.push({
      tag: m[0],
      attrs,
      text: stripTags(m[2]),
      href: hrefMatch ? hrefMatch[2] : '',
      ariaLabel: ariaMatch ? ariaMatch[2] : '',
      target: targetMatch ? targetMatch[2] : '',
      rel: relMatch ? relMatch[2] : '',
    });
  }
  return anchors;
}

function extractTables(html) {
  return [...String(html || '').matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((m) => m[0]);
}

function extractHeaders(tableHtml) {
  return [...String(tableHtml || '').matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => stripTags(m[1]));
}

function tableIssues(tableHtml) {
  const issues = [];
  if (!/<thead\b/i.test(tableHtml)) issues.push('table_without_thead');
  const headers = extractHeaders(tableHtml);
  if (!headers.length) issues.push('table_without_headers');
  const missingUnits = headers.filter((header) => {
    const clean = header.replace(/\s+/g, ' ').trim();
    if (!clean || allowedUnitlessHeaderPattern.test(clean)) return false;
    if (!unitSensitiveHeaderPattern.test(clean)) return false;
    return !/\([^)]*\)|（[^）]*）|mm|N\b|Nm|rpm|V\b|A\b|W\b|kg|um|µm|arc|deg|°|%/i.test(clean);
  });
  if (missingUnits.length) issues.push(`headers_may_need_units:${missingUnits.join('|')}`);
  return issues;
}

function classifyDownload(anchor) {
  const value = `${anchor.href} ${anchor.text} ${anchor.ariaLabel}`;
  if (/\.pdf|PDF|型錄|手冊|Catalog|Manual/i.test(value)) return 'pdf';
  if (/\.zip|ZIP/i.test(value)) return 'zip';
  if (/\.dwg|\.dxf|\.step|\.stp|\.cad|CAD|Drawing|圖面/i.test(value)) return 'cad';
  if (/Software|軟體/i.test(value)) return 'software';
  if (/下載/i.test(value)) return 'download';
  return '';
}

function hasReadableDownloadLabel(anchor) {
  const label = `${anchor.ariaLabel || ''} ${anchor.text || ''}`.trim();
  if (!label) return false;
  if (/^(PDF|CAD|ZIP|下載|Download)$/i.test(label)) return Boolean(anchor.ariaLabel && anchor.ariaLabel.length >= 6);
  return true;
}

function validatePage(page) {
  const html = readUtf8(path.join(outputRoot, page.preview_rel));
  const block = extractSpecBlock(html);
  const anchors = extractAnchors(block);
  const technicalAnchors = anchors.filter((a) => technicalDownloadPattern.test(`${a.tag} ${a.text}`));
  const tables = extractTables(block);
  const perTableIssues = tables.flatMap(tableIssues);
  const details = countMatches(block, /<details\b/gi);
  const summaryCount = countMatches(block, /<summary\b/gi);
  const missingToggleText = details > 0 && !/(展開|收合|\+|−|- 收合|\+ 展開)/.test(stripTags(block));
  const downloadKinds = {};
  for (const anchor of anchors) {
    const kind = classifyDownload(anchor);
    if (kind) downloadKinds[kind] = (downloadKinds[kind] || 0) + 1;
  }
  const missingDownloadAria = technicalAnchors.filter((anchor) => !hasReadableDownloadLabel(anchor)).length;
  const externalBlankIssues = anchors.filter((anchor) => /^https?:\/\//i.test(anchor.href) && anchor.target === '_blank' && !/\bnoopener\b/i.test(anchor.rel)).length;
  const ctaCount = countMatches(block, /詢問|加入詢問|請洽星泰|洽詢|報價|inquiry|contact/gi);
  const internalNoteCount = internalNotePatterns.reduce((sum, re) => {
    re.lastIndex = 0;
    return sum + countMatches(block, re);
  }, 0);
  const critical = [];
  const warnings = [];

  if (page.status !== 'no-spec-module' && !block) critical.push('missing_standardized_spec_block');
  if (countMatches(block, /<img\b/gi)) critical.push('spec_contains_image');
  if (countMatches(block, /href=(["'])(?:#|javascript:void\(0\)|)\1/gi)) critical.push('spec_placeholder_href');
  if (countMatches(block, /href=(["'])[^"']*\.txt(?:[#?][^"']*)?\1/gi)) critical.push('spec_txt_href');
  if (/file:\/\/\/|[A-Z]:\\/i.test(block)) critical.push('spec_local_path');
  if (countMatches(block, /\sdata-(?:local-file|upload-url|source-url)=/gi)) critical.push('spec_internal_data_attrs');
  if (internalNoteCount) critical.push('spec_internal_note_text');
  if (externalBlankIssues) critical.push('external_blank_without_noopener');
  if (tables.length && perTableIssues.some((x) => x === 'table_without_thead' || x === 'table_without_headers')) warnings.push(...perTableIssues);
  else warnings.push(...perTableIssues);
  if (missingDownloadAria) warnings.push(`download_label_needs_review:${missingDownloadAria}`);
  if (missingToggleText) warnings.push('details_toggle_text_needs_review');
  if (block && !ctaCount) warnings.push('spec_cta_missing_or_outside_block');

  const resultStatus = critical.length ? 'fail' : warnings.length ? 'warn' : block ? 'pass' : page.status === 'no-spec-module' ? 'no-spec-module' : 'warn';

  return {
    product_id: page.product_id,
    title: page.title || extractTitle(html, page.product_id),
    category_path: page.category_path || [],
    preview_rel: page.preview_rel,
    spec_candidate_rel: page.spec_candidate_rel || '',
    overlay_status: page.status,
    qa_status: resultStatus,
    counts: {
      details,
      summaries: summaryCount,
      tables: tables.length,
      table_headers: tables.reduce((sum, table) => sum + extractHeaders(table).length, 0),
      pdf_links: downloadKinds.pdf || 0,
      cad_links: downloadKinds.cad || 0,
      zip_links: downloadKinds.zip || 0,
      software_links: downloadKinds.software || 0,
      other_download_links: downloadKinds.download || 0,
      cta_count: ctaCount,
      spec_images: countMatches(block, /<img\b/gi),
      href_hash: countMatches(block, /href=(["'])(?:#|javascript:void\(0\)|)\1/gi),
      txt_href: countMatches(block, /href=(["'])[^"']*\.txt(?:[#?][^"']*)?\1/gi),
      local_path: /file:\/\/\/|[A-Z]:\\/i.test(block) ? 1 : 0,
      internal_note_count: internalNoteCount,
      data_attr_count: countMatches(block, /\sdata-(?:local-file|upload-url|source-url)=/gi),
      missing_download_aria: missingDownloadAria,
    },
    critical: [...new Set(critical)],
    warnings: [...new Set(warnings)],
  };
}

function renderReport(report) {
  const cards = Object.entries(report.summary.qa_status_counts)
    .map(([key, value]) => `<div class="card"><div>${htmlEscape(key)}</div><strong>${value}</strong></div>`)
    .join('\n');
  const priorityRows = Object.entries(report.summary.priority_category_status || {})
    .map(([key, value]) => `<tr><td>${htmlEscape(key)}</td><td>${value.total}</td><td>${htmlEscape(JSON.stringify(value.qa_status_counts))}</td><td>${htmlEscape(JSON.stringify(value.overlay_status_counts))}</td></tr>`)
    .join('\n');
  const rows = report.pages.map((page) => `<tr class="status-${htmlEscape(page.qa_status)}">
<td>${htmlEscape(page.product_id)}</td>
<td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
<td>${htmlEscape((page.category_path || []).join(' › '))}</td>
<td><span class="badge">${htmlEscape(page.qa_status)}</span></td>
<td>${htmlEscape(page.overlay_status)}</td>
<td>${page.counts.tables}</td>
<td>${page.counts.pdf_links}</td>
<td>${page.counts.cad_links}</td>
<td>${page.counts.cta_count}</td>
<td>${htmlEscape(page.critical.join(' / '))}</td>
<td>${htmlEscape(page.warnings.join(' / '))}</td>
</tr>`).join('\n');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>產品規格詳情 QA 報告</title>
<style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px;background:#fbfdfb;color:#17251d}.summary{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.card{border:1px solid #d9e6dc;background:#fff;border-radius:8px;padding:12px 16px;min-width:150px}.card strong{font-size:24px;color:#00843d}table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d9e6dc;margin:14px 0}th,td{border-bottom:1px solid #e6eee8;padding:8px 9px;text-align:left;vertical-align:top;font-size:13px}th{background:#edf6f0}.badge{border-radius:999px;padding:3px 8px;background:#e8f3ec}.status-pass .badge{background:#dff2e6;color:#00682c}.status-warn .badge{background:#fff3cd;color:#735c00}.status-fail .badge{background:#fde8e8;color:#9f1d1d}.status-no-spec-module .badge{background:#f4eee2;color:#77520c}</style></head><body>
<h1>產品規格詳情 QA 報告</h1>
<p>本報告檢查本機 preview 中的 <code>產品規格詳情</code> 模組，不代表後台已保存或測試網已上架。</p>
<div class="summary">${cards}</div>
<p><a href="product-spec-module-qa.json">查看 JSON</a></p>
<h2>第一優先類別摘要</h2>
<table><thead><tr><th>類別</th><th>頁數</th><th>QA 狀態</th><th>Overlay 狀態</th></tr></thead><tbody>${priorityRows}</tbody></table>
<h2>逐頁 QA</h2>
<table><thead><tr><th>ID</th><th>產品</th><th>分類</th><th>QA</th><th>Overlay</th><th>表格</th><th>PDF</th><th>CAD</th><th>CTA</th><th>阻塞</th><th>警告</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function priorityBucket(categoryPath) {
  const pathText = (categoryPath || []).join(' › ');
  if (/電動缸|SMAC|線性馬達/i.test(pathText)) return '電動缸';
  if (/驅動器/i.test(pathText)) return '驅動器';
  if (/各類馬達|伺服馬達|步進馬達|Harmonic 馬達/i.test(pathText)) return '各類馬達';
  if (/ACS 控制器|ACS/i.test(pathText)) return 'ACS 控制器 / 驅動器';
  if (/Harmonic Drive|減速機/i.test(pathText)) return 'Harmonic Drive 減速機';
  if (/Renishaw|回授|光學尺|磁性編碼器|雷射編碼器/i.test(pathText)) return 'Renishaw 回授元件';
  if (/定位平台|滑台|平台/i.test(pathText)) return '定位平台';
  if (/空氣軸承|滾珠|滾柱|軸承/i.test(pathText)) return '空氣軸承 / 滾珠・滾柱軸承';
  return '';
}

function main() {
  if (!fs.existsSync(standardizationReportPath)) throw new Error(`Missing ${standardizationReportPath}`);
  const standardization = JSON.parse(readUtf8(standardizationReportPath));
  const pages = standardization.pages.map(validatePage);
  const qaStatusCounts = {};
  const overlayStatusCounts = {};
  const priorityCategoryStatus = {};
  for (const page of pages) {
    qaStatusCounts[page.qa_status] = (qaStatusCounts[page.qa_status] || 0) + 1;
    overlayStatusCounts[page.overlay_status] = (overlayStatusCounts[page.overlay_status] || 0) + 1;
    const bucket = priorityBucket(page.category_path);
    if (bucket) {
      priorityCategoryStatus[bucket] = priorityCategoryStatus[bucket] || { total: 0, qa_status_counts: {}, overlay_status_counts: {} };
      priorityCategoryStatus[bucket].total += 1;
      priorityCategoryStatus[bucket].qa_status_counts[page.qa_status] = (priorityCategoryStatus[bucket].qa_status_counts[page.qa_status] || 0) + 1;
      priorityCategoryStatus[bucket].overlay_status_counts[page.overlay_status] = (priorityCategoryStatus[bucket].overlay_status_counts[page.overlay_status] || 0) + 1;
    }
  }
  const report = {
    generated_at: new Date().toISOString(),
    scope: 'site-mirror-current standardized product spec modules',
    output_root: toPosix(outputRoot),
    source_report: toPosix(standardizationReportPath),
    summary: {
      total_pages: pages.length,
      qa_status_counts: qaStatusCounts,
      overlay_status_counts: overlayStatusCounts,
      priority_category_status: priorityCategoryStatus,
      fail_count: qaStatusCounts.fail || 0,
      warn_count: qaStatusCounts.warn || 0,
      pass_count: qaStatusCounts.pass || 0,
      no_spec_module_count: qaStatusCounts['no-spec-module'] || 0,
    },
    pages,
  };
  writeUtf8(path.join(reportRoot, 'product-spec-module-qa.json'), JSON.stringify(report, null, 2));
  writeUtf8(path.join(reportRoot, 'product-spec-module-qa.html'), renderReport(report));
  process.stdout.write(JSON.stringify({
    status: 'completed',
    pages: pages.length,
    summary: report.summary,
    report: 'reports/product-spec-module-qa.html',
    json: 'reports/product-spec-module-qa.json',
  }, null, 2));
}

main();
