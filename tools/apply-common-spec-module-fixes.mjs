import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportPath = path.join(root, 'reports', 'product-spec-agent-review.json');
const dryRun = process.argv.includes('--dry-run');

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeTitle(title) {
  return stripTags(title)
    .replace(/-星泰國際科技股份有限公司$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSpecCta(block) {
  return /class=(["'])[^"']*\bst-spec-cta\b[^"']*\1/i.test(block);
}

function specCta(title) {
  const safeTitle = escapeHtml(normalizeTitle(title) || '產品');
  return `
<div class="st-spec-cta" style="margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033;">
  <strong>需要協助確認 ${safeTitle} 規格？</strong>
  <p style="margin:8px 0 12px;">請提供預計應用、安裝條件、關鍵尺寸、負載與控制需求，星泰可協助比對適合的系列、型號與技術文件。</p>
  <a href="../../skipped/96da16962be2-inquiry.html" style="display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700;" aria-label="聯絡星泰確認 ${safeTitle} 規格">請洽星泰確認規格</a>
</div>`;
}

function labelForDownload(href, text) {
  const cleanText = stripTags(text);
  const decodedHref = decodeURIComponent(String(href || ''));
  const fileName = decodedHref.split(/[/?#]/).filter(Boolean).pop() || '';
  const lower = decodedHref.toLowerCase();
  if (/\.(?:dwg|dxf|step|stp|cad)(?:$|[?#])/i.test(decodedHref) || /\bCAD\b/i.test(cleanText)) {
    return fileName ? `下載 CAD 檔案 ${fileName}` : '下載 CAD 檔案';
  }
  if (/\.zip(?:$|[?#])/i.test(decodedHref) || /\bZIP\b/i.test(cleanText)) {
    return fileName ? `下載壓縮檔 ${fileName}` : '下載壓縮檔';
  }
  if (/manual/i.test(lower)) {
    return fileName ? `下載操作手冊 ${fileName}` : '下載操作手冊';
  }
  if (/catalog|brochure/i.test(lower)) {
    return fileName ? `下載型錄 ${fileName}` : '下載型錄';
  }
  if (/drawing/i.test(lower)) {
    return fileName ? `下載圖面 ${fileName}` : '下載圖面';
  }
  if (/software/i.test(lower)) {
    return fileName ? `下載軟體 ${fileName}` : '下載軟體';
  }
  if (/\.pdf(?:$|[?#])/i.test(decodedHref) || /\bPDF\b/i.test(cleanText)) {
    return fileName ? `下載 PDF 文件 ${fileName}` : '下載 PDF 文件';
  }
  return cleanText ? `開啟 ${cleanText}` : '開啟技術文件';
}

function addDownloadAria(block) {
  return block.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (tag, attrs, inner) => {
    if (/\saria-label\s*=/i.test(attrs)) return tag;
    const href = attrs.match(/\shref=(["'])(.*?)\1/i)?.[2] || '';
    const visibleText = stripTags(inner);
    const isTechnical =
      /\.(?:pdf|zip|dwg|dxf|step|stp|cad)(?:$|[?#])/i.test(href) ||
      /^(PDF|CAD|ZIP|下載|Download)$/i.test(visibleText);
    if (!isTechnical) return tag;
    const label = escapeHtml(labelForDownload(href, visibleText));
    return `<a${attrs} aria-label="${label}">${inner}</a>`;
  });
}

function updateSpecBlock(html, title) {
  const startMarker = '<!-- standardized-spec-module:start -->';
  const endMarker = '<!-- standardized-spec-module:end -->';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return { html, changed: false, addedCta: false, addedAria: false };

  const before = html.slice(0, start + startMarker.length);
  const block = html.slice(start + startMarker.length, end);
  const after = html.slice(end);

  let updated = addDownloadAria(block);
  const addedAria = updated !== block;
  let addedCta = false;

  if (!hasSpecCta(updated)) {
    const closeIndex = updated.lastIndexOf('</section>');
    const cta = specCta(title);
    if (closeIndex >= 0) {
      updated = `${updated.slice(0, closeIndex)}${cta}\n${updated.slice(closeIndex)}`;
    } else {
      updated = `${updated}\n${cta}\n`;
    }
    addedCta = true;
  }

  return {
    html: `${before}${updated}${after}`,
    changed: updated !== block,
    addedCta,
    addedAria,
  };
}

if (!fs.existsSync(reportPath)) {
  console.error(`Missing ${reportPath}. Run npm run validate first.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const results = [];

for (const page of report.pages || []) {
  if (page.qa_status === 'no-spec-module') continue;
  const file = path.join(root, page.preview_rel);
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  const result = updateSpecBlock(original, page.title);
  if (!result.changed) continue;
  if (!dryRun) fs.writeFileSync(file, result.html, 'utf8');
  results.push({
    product_id: page.product_id,
    title: page.title,
    preview_rel: page.preview_rel,
    added_cta: result.addedCta,
    added_aria: result.addedAria,
  });
}

console.log(JSON.stringify({
  dry_run: dryRun,
  changed_pages: results.length,
  added_cta_pages: results.filter((r) => r.added_cta).length,
  added_aria_pages: results.filter((r) => r.added_aria).length,
  pages: results,
}, null, 2));
