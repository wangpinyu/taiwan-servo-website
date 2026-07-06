import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const detailDir = path.join(root, 'site/preview/products/detail');
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const INTERNAL_VISIBLE_TEXT_RE = /正式上架|待人工|待確認|後續由人工|人工確認後|不要放前台|開發人員|內部註解|\bplaceholder\b|\bpending\b|\bTODO\b|data-upload-url|data-local-file|local file|本機檔案|本機路徑|未經證實|不新增未經證實/i;
const CTA_RE = /詢問|洽詢|加入詢問|詢價|聯絡星泰|inquiry|contact|quote/i;

function stripTags(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupInternalParagraphs(block) {
  let next = block;
  next = next.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
    const visible = stripTags(paragraph);
    return INTERNAL_VISIBLE_TEXT_RE.test(visible) ? '' : paragraph;
  });
  next = next.replace(/<div\b([^>]*)>[\s\S]*?<\/div>/gi, (div) => {
    const visible = stripTags(div);
    if (!visible || visible.length > 220) return div;
    return INTERNAL_VISIBLE_TEXT_RE.test(visible) ? '' : div;
  });
  return next;
}

function hasCta(block) {
  return CTA_RE.test(stripTags(block));
}

function ctaHtml(productId) {
  return `
<div class="st-common-spec-cta" style="margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033;">
  <strong>需要協助確認規格或選型？</strong>
  <p style="margin:8px 0 12px;">可提供應用條件、安裝空間、負載、速度、精度或環境需求，由星泰協助比對適合的系列、型號與下載文件。</p>
  <a href="${inquiryHref}" aria-label="詢問產品 ${productId} 規格" style="display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700;">詢問此產品規格</a>
</div>`;
}

function insertCta(block, productId) {
  if (hasCta(block)) return block;
  const cta = ctaHtml(productId);
  const lastSectionClose = block.lastIndexOf('</section>');
  if (lastSectionClose >= 0) {
    return `${block.slice(0, lastSectionClose)}${cta}\n${block.slice(lastSectionClose)}`;
  }
  const lastDivClose = block.lastIndexOf('</div>');
  if (lastDivClose >= 0) {
    return `${block.slice(0, lastDivClose)}${cta}\n${block.slice(lastDivClose)}`;
  }
  return `${block}${cta}`;
}

let changed = 0;
let ctaAdded = 0;
let internalCleaned = 0;

for (const fileName of fs.readdirSync(detailDir)) {
  if (!fileName.endsWith('.html')) continue;
  const productId = path.basename(fileName, '.html');
  const file = path.join(detailDir, fileName);
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/i);
  if (!match) continue;

  const originalBlock = match[1];
  let block = cleanupInternalParagraphs(originalBlock);
  if (block !== originalBlock) internalCleaned += 1;
  if (!hasCta(block)) {
    block = insertCta(block, productId);
    ctaAdded += 1;
  }

  if (block !== originalBlock) {
    const next = html.replace(match[0], `<!-- standardized-spec-module:start -->${block}<!-- standardized-spec-module:end -->`);
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, ctaAdded, internalCleaned }, null, 2));
