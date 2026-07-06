import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportPath = path.join(root, 'reports', 'product-spec-agent-review.json');
const dryRun = process.argv.includes('--dry-run');

const INTERNAL_NOTE_RE = /待人工上架|待上架|待確認|後續由人工|不新增未經證實|\bplaceholder\b|\bpending\b|\bTODO\b|對應星泰頁面|欄位與系列排序|未取得可安全轉載|先保留官方文件按鈕|先保留按鈕|本區依|本頁依|本次未納入|後台上架|正式站內(?:檔案|連結)?\s*URL|正式站內連結|正式\s*URL|正式連結|人工補入|再補入|上架後再替換|後替換|後再替換|待替換|待並替換|後設定|預留路徑|已下載到本機|已整理到本機|本機檔案|下載檔案先整理到本機|按鈕先保留|下載按鈕目前|檔案已下載整理到本機|預備區|official-source package|upload to Shin Tai manually|檔案上傳至星泰後台|本機 PDF，後 URL/i;

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
    .replace(/-\s*正式網搬移.*$/u, '')
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
  <p style="margin:8px 0 12px;">若需要依照行程、推力、扭矩、控制介面或安裝條件選型，可聯繫星泰協助比對規格與文件版本。</p>
  <a href="../../skipped/96da16962be2-inquiry.html" style="display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700;" aria-label="洽詢星泰確認 ${safeTitle} 規格">請洽星泰確認規格</a>
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
  if (/manual|installation|user-guide|operation|guide/i.test(lower) || /Manual|安裝|操作|手冊|說明/i.test(cleanText)) {
    return fileName ? `下載手冊或安裝文件 ${fileName}` : '下載手冊或安裝文件';
  }
  if (/catalog|brochure|datasheet|data-sheet/i.test(lower) || /Catalog|Datasheet|型錄|規格|資料表/i.test(cleanText)) {
    return fileName ? `下載產品規格文件 ${fileName}` : '下載產品規格文件';
  }
  if (/drawing/i.test(lower) || /Drawing|工程圖|圖面/i.test(cleanText)) {
    return fileName ? `下載工程圖 ${fileName}` : '下載工程圖';
  }
  if (/software/i.test(lower) || /Software|軟體/i.test(cleanText)) {
    return fileName ? `下載軟體 ${fileName}` : '下載軟體';
  }
  if (/\.pdf(?:$|[?#])/i.test(decodedHref) || /\bPDF\b/i.test(cleanText)) {
    return fileName ? `下載 PDF 文件 ${fileName}` : '下載 PDF 文件';
  }
  return cleanText ? `開啟文件 ${cleanText}` : '開啟技術文件';
}

function addDownloadAria(block) {
  return block.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (tag, attrs, inner) => {
    if (/\saria-label\s*=/i.test(attrs)) return tag;
    const href = attrs.match(/\shref=(["'])(.*?)\1/i)?.[2] || '';
    const visibleText = stripTags(inner);
    const isTechnical =
      /\.(?:pdf|zip|dwg|dxf|step|stp|cad)(?:$|[?#])/i.test(href) ||
      /^(PDF|CAD|ZIP|Download|下載)$/i.test(visibleText);
    if (!isTechnical) return tag;
    const label = escapeHtml(labelForDownload(href, visibleText));
    return `<a${attrs} aria-label="${label}">${inner}</a>`;
  });
}

function cleanInternalSentenceText(text) {
  return text
    .replace(/\/\s*已整理本機 PDF，後 URL/gi, '/ PDF 文件')
    .replace(/\/。本機 PDF，後 URL/gi, '/ PDF 文件')
    .replace(/下載檔案先整理到本機[；，、,\s]*/gi, '')
    .replace(/(?:PDF\s*)?檔案已下載整理到本機[；，、,\s]*/gi, '')
    .replace(/(?:PDF\s*)?檔案已整理到本機[；，、,\s]*/gi, '')
    .replace(/已整理到本機[^。；<]*(?:。|；)?/gi, '')
    .replace(/已下載到本機[；，、,\s]*/gi, '')
    .replace(/本機檔案已整理[^。；<]*(?:。|；)?/gi, '請洽星泰確認最新版文件')
    .replace(/本機檔案整理/gi, '文件下載')
    .replace(/本機檔案[:：][^。；<]*(?:。|；)?/gi, '請洽星泰確認最新版文件')
    .replace(/本機檔案/gi, '文件下載')
    .replace(/下載按鈕目前先保留[^。；<]*(?:。|；)?/gi, '')
    .replace(/按鈕先保留[^。；<]*(?:。|；)?/gi, '')
    .replace(/PDF 按鈕已預留路徑[^。；<]*(?:。|；)?/gi, '')
    .replace(/正式站內(?:檔案|連結)?\s*URL[^。；<]*(?:。|；)?/gi, '')
    .replace(/正式站內連結[^。；<]*(?:。|；)?/gi, '')
    .replace(/正式\s*URL[^。；<]*(?:。|；)?/gi, '')
    .replace(/正式連結/gi, '')
    .replace(/待並替換[^。；<]*(?:。|；)?/gi, '')
    .replace(/後再替換\s*URL[^。；<]*(?:。|；)?/gi, '')
    .replace(/後設定[^。；<]*(?:。|；)?/gi, '')
    .replace(/(?:由星泰後台|由後台|請由後台)[^。；<]*(?:。|；)?/gi, '')
    .replace(/(?:人工資料確認後再補入|後再補入|再補入|上架後再替換|後替換連結|後替換|後連結|待替換)[^。；<]*(?:。|；)?/gi, '')
    .replace(/(?:後續可|後續)[^。；<]*替換[^。；<]*(?:。|；)?/gi, '')
    .replace(/本區依/gi, '依')
    .replace(/本頁依/gi, '依')
    .replace(/\s+([。；，、])/g, '$1')
    .replace(/[；，、,\s]+$/g, '')
    .trim();
}

function replaceInternalRawPhrases(block) {
  return block
    .replace(/本頁已整理官方圖面檔，產品 PDF 需後續人工取得並上架。?/g, '官方圖面檔可於本頁查閱；產品 PDF 請洽星泰確認。')
    .replace(/此來源目前未取得可安全轉載的公開 HTML 規格表；先保留官方文件按鈕與提示。?/g, '')
    .replace(/本頁先提供可公開取得的原廠文件，正式站內檔案 URL 由後替換。?/g, '')
    .replace(/Series-level PDF document copied from the official-source package; upload to Shin Tai manually\./g, '系列級 PDF 文件。')
    .replace(/檔案上傳至星泰後台與/g, '')
    .replace(/下載文件按鈕預備區|文件下載預備|文件下載按鈕規劃/g, '文件下載')
    .replace(/資料表與請洽星泰確認最新版文件。/g, '資料表與技術文件')
    .replace(/型錄與請洽星泰確認最新版文件。整理/g, '型錄與文件下載')
    .replace(/本頁。官方圖面檔，產品 PDF 需後續人工取得並上架。?/g, '官方圖面檔可於本頁查閱；產品 PDF 請洽星泰確認。')
    .replace(/\/\s*已整理本機 PDF，後 URL/g, '/ PDF 文件')
    .replace(/\/。本機 PDF，後 URL/g, '/ PDF 文件')
    .replace(/([A-Za-z0-9-]+)\s*\/。本機 PDF，後 URL/g, '$1 / PDF 文件')
    .replace(/datasheet\s*\/。本機 PDF，後 URL/g, 'datasheet / PDF 文件')
    .replace(/已建立 PDF 按鈕/g, 'PDF 文件')
    .replace(/規格文件PDF 文件/g, 'PDF 規格文件')
    .replace(/圖片，後續可或保留 PDF 下載/g, '圖片與 PDF 可於本頁查閱')
    .replace(/正式站內 URL 由後替換/g, 'PDF 可於本頁下載')
    .replace(/PDF 已整理/g, 'PDF')
    .replace(/正式上架時若能確認來源，可再補品牌與型號/g, '請洽星泰確認品牌與型號')
    .replace(/依尺寸圖或人工資料確認後再補入，不自行推估/g, '請洽星泰確認')
    .replace(/後續可或保留 PDF 下載/g, '請洽星泰確認最新版文件')
    .replace(/頁面圖片也已整理在 package 的 assets\/images，後續人工決定是否上架。?/g, '')
    .replace(/官方公開尺寸圖面，已下載到本機。?/g, '官方公開尺寸圖面。')
    .replace(/(?:原廠|官方公開|星泰頁面目前公開的|目前產品頁既有檔案，|星泰頁面目前公開的\s*)?([^。；<]{0,80}?)(?:已下載到本機|已整理到本機|已整理)[，。；]?(?:後續可[^。；<]*替換[^。；<]*(?:。|；)?)?/g, (_full, prefix = '') => {
      const cleaned = prefix.trim();
      return cleaned ? `${cleaned}。` : '請洽星泰確認最新版文件。';
    })
    .replace(/本機檔案[:：][^。；<]*(?:。|；)?(?:正式站內(?:檔案|連結)?\s*URL[^。；<]*(?:。|；)?)?/g, '請洽星泰確認最新版文件。')
    .replace(/本機檔案已整理[，,；]?[^。；<]*(?:正式站內(?:檔案|連結)?\s*URL|正式站內連結|待並替換|後替換|後設定)[^。；<]*(?:。|；)?/g, '請洽星泰確認最新版文件。')
    .replace(/上傳到星泰後台後，請將(?:本)?按鈕替換為正式站內檔案 URL。?/g, '')
    .replace(/正式站內(?:檔案|連結)?\s*URL\s*由後替換。?/g, '')
    .replace(/正式站內(?:檔案|連結)?\s*URL\s*後替換。?/g, '')
    .replace(/正式站內連結後替換。?/g, '')
    .replace(/正式連結由後替換。?/g, '')
    .replace(/後再替換 URL。?/g, '')
    .replace(/待並替換成正式站內 URL。?/g, '')
    .replace(/後可改成站內正式連結。?/g, '')
    .replace(/後續可與替換連結。?/g, '')
    .replace(/本機檔案。?/g, '請洽星泰確認最新版文件。')
    .replace(/需人工補檔。?/g, '請洽星泰確認。')
    .replace(/先保留按鈕。?/g, '請洽星泰確認最新版文件。')
    .replace(/<(div|span)\b([^>]*class=(["'])[^"']*\bdoc-meta\b[^"']*\3[^>]*)>[\s。；，、]*<\/\1>/gi, '<$1$2>PDF 文件</$1>')
    .replace(/<em\b([^>]*)>[\s。；，、]*<\/em>/gi, '')
    .replace(/>PDF。<\/(span|em|td|div)>/g, '>PDF</$1>');
}

function replaceInternalTextElements(block) {
  let updated = block;

  updated = updated.replace(/<div\b([^>]*class=(["'])[^"']*\bdoc-meta\b[^"']*\2[^>]*)>([\s\S]*?)<\/div>/gi, (full, attrs, _q, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    const cleanedText = cleanInternalSentenceText(text);
    return `<div${attrs}>${escapeHtml(cleanedText || '請洽星泰確認最新版文件')}</div>`;
  });

  updated = updated.replace(/<(em|small)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tagName, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    const cleanedText = cleanInternalSentenceText(text);
    return cleanedText ? `<${tagName}${attrs}>${escapeHtml(cleanedText)}</${tagName}>` : '';
  });

  updated = updated.replace(/<strong\b([^>]*)>([\s\S]*?)<\/strong>/gi, (full, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    if (/<[a-z][\s\S]*>/i.test(inner)) return full;
    const cleanedText = cleanInternalSentenceText(text);
    return `<strong${attrs}>${escapeHtml(cleanedText || '文件下載')}</strong>`;
  });

  updated = updated.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    const className = attrs.match(/\sclass=(["'])(.*?)\1/i)?.[2] || '';
    if (/未取得可安全轉載|先保留官方文件按鈕/.test(text)) return '';
    if (/lead|note|public-note/i.test(className)) return '';
    const cleanedText = cleanInternalSentenceText(text);
    return cleanedText ? `<p${attrs}>${escapeHtml(cleanedText)}</p>` : '';
  });

  updated = updated.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (full, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    if (/<[a-z][\s\S]*>/i.test(inner)) return full;
    const className = attrs.match(/\sclass=(["'])(.*?)\1/i)?.[2] || '';
    const cleanedText = cleanInternalSentenceText(text);
    if (/summary|meta|note|lead/i.test(className)) {
      return cleanedText ? `<span${attrs}>${escapeHtml(cleanedText)}</span>` : '';
    }
    return full;
  });

  updated = updated.replace(/<div\b([^>]*)>([\s\S]*?)<\/div>/gi, (full, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;
    if (/<[a-z][\s\S]*>/i.test(inner)) return full;
    const className = attrs.match(/\sclass=(["'])(.*?)\1/i)?.[2] || '';
    if (!/note|empty/i.test(className)) return full;
    const cleanedText = cleanInternalSentenceText(text);
    return cleanedText
      ? `<p class="st-public-note" style="margin:0 0 12px;color:#536272;">${escapeHtml(cleanedText)}</p>`
      : '';
  });

  return updated.replace(/<(p|em|small|span|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tagName, attrs, inner) => {
    const text = stripTags(inner);
    if (!INTERNAL_NOTE_RE.test(text)) return full;

    const tag = tagName.toLowerCase();
    const className = attrs.match(/\sclass=(["'])(.*?)\1/i)?.[2] || '';
    const cleanedText = cleanInternalSentenceText(text);

    if (/\bdoc-meta\b/i.test(className)) {
      return `<${tag}${attrs}>${escapeHtml(cleanedText || '請洽星泰確認最新版文件')}</${tag}>`;
    }

    if (/<[a-z][\s\S]*>/i.test(inner)) return full;

    if (tag === 'em' || tag === 'small') return '';

    if (tag === 'span' && /summary|meta|note|lead/i.test(className)) {
      return cleanedText ? `<${tag}${attrs}>${escapeHtml(cleanedText)}</${tag}>` : '';
    }

    if (tag === 'p' && /lead|note/i.test(className)) return '';

    if (tag === 'div' && /note|empty/i.test(className)) {
      return cleanedText
        ? `<p class="st-public-note" style="margin:0 0 12px;color:#536272;">${escapeHtml(cleanedText)}</p>`
        : '';
    }

    return cleanedText ? `<${tag}${attrs}>${escapeHtml(cleanedText)}</${tag}>` : '';
  });
}

function removeInternalNotes(block) {
  let updated = block;
  updated = replaceInternalRawPhrases(updated);
  updated = replaceInternalTextElements(updated);
  updated = updated.replace(/<!--[\s\S]*?(?:待人工上架|pending|placeholder|正式\s*URL|後台上架|TODO)[\s\S]*?-->/gi, '');
  return updated;
}

function fileCards(block) {
  const cards = [];
  const re = /<div\b([^>]*class=(["'])[^"']*\bst-[a-z0-9-]+-file\b[^"']*\2[^>]*)>([\s\S]*?)<\/div>/gi;
  for (const match of block.matchAll(re)) {
    const attrs = match[1] || '';
    const inner = match[3] || '';
    const key = attrs.match(/\sdata-file-key=(["'])(.*?)\1/i)?.[2] || '';
    const title = stripTags(inner.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || inner);
    if (!title && !key) continue;
    cards.push({ key, title: title || key });
  }
  return cards;
}

function documentType(file) {
  const text = `${file.key} ${file.title}`.toLowerCase();
  if (/manual|installation|operation|user/.test(text)) return 'Manual / Installation';
  if (/catalog|brochure/.test(text)) return 'Catalog / Brochure';
  if (/datasheet|data-sheet|data sheet/.test(text)) return 'Datasheet';
  if (/drawing|cad|step|stp|dwg|dxf/.test(text)) return 'CAD / Drawing';
  if (/software/.test(text)) return 'Software';
  return 'PDF';
}

function documentIndexTable(cards) {
  if (!cards.length) return '';
  const rows = cards.map((file) => `
      <tr>
        <th>${escapeHtml(file.title)}</th>
        <td data-label="文件類型">${escapeHtml(documentType(file))}</td>
        <td data-label="適用範圍">系列或產品文件</td>
        <td data-label="狀態">請洽星泰確認最新版</td>
      </tr>`).join('');

  return `
<div class="st-document-index-wrap" style="overflow-x:auto;margin:10px 0 16px;border:1px solid #dfe8e3;border-radius:8px;">
  <table class="st-document-index" style="border-collapse:collapse;width:100%;min-width:640px;background:#fff;">
    <thead>
      <tr>
        <th style="background:#0876a8;color:#fff;padding:9px 10px;border:1px solid #0a6e9b;">文件</th>
        <th style="background:#0876a8;color:#fff;padding:9px 10px;border:1px solid #0a6e9b;">文件類型</th>
        <th style="background:#0876a8;color:#fff;padding:9px 10px;border:1px solid #0a6e9b;">適用範圍</th>
        <th style="background:#0876a8;color:#fff;padding:9px 10px;border:1px solid #0a6e9b;">狀態</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
</div>`;
}

function addDocumentIndexWhenNeeded(block) {
  if (/<table\b/i.test(block)) return block;
  const cards = fileCards(block);
  if (!cards.length) return block;
  const table = documentIndexTable(cards);
  return block.replace(/(<div\b[^>]*class=(["'])[^"']*\bst-[a-z0-9-]+-files\b[^"']*\2[^>]*>)/i, `${table}$1`);
}

/* Legacy table header normalizer superseded below.
function normalizeTableHeaders(block) {
  return block.replace(/(<thead>\s*<tr>\s*)<th>\s*<\/th>/gi, '$1<th>規格項目</th>');
}

*/
function normalizeTableHeaders(block) {
  return block.replace(/(<thead>\s*<tr>\s*)<th>\s*<\/th>/gi, '$1<th>操作</th>');
}

function normalizeOutputText(block) {
  return block
    .replace(/(\d+)\s*份PDF 規格文件/g, '$1 份 PDF 規格文件')
    .replace(/[ \t]+$/gm, '');
}

function updateSpecBlock(html, title) {
  const startMarker = '<!-- standardized-spec-module:start -->';
  const endMarker = '<!-- standardized-spec-module:end -->';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    return { html, changed: false, addedCta: false, addedAria: false, cleanedNotes: false, addedDocumentIndex: false };
  }

  const before = html.slice(0, start + startMarker.length);
  const block = html.slice(start + startMarker.length, end);
  const after = html.slice(end);

  let updated = removeInternalNotes(block);
  const cleanedNotes = updated !== block;

  const beforeIndex = updated;
  updated = addDocumentIndexWhenNeeded(updated);
  const addedDocumentIndex = updated !== beforeIndex;

  updated = normalizeTableHeaders(updated);

  const beforeAria = updated;
  updated = addDownloadAria(updated);
  const addedAria = updated !== beforeAria;

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

  updated = normalizeOutputText(updated);

  return {
    html: `${before}${updated}${after}`,
    changed: updated !== block,
    addedCta,
    addedAria,
    cleanedNotes,
    addedDocumentIndex,
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
    cleaned_notes: result.cleanedNotes,
    added_document_index: result.addedDocumentIndex,
  });
}

console.log(JSON.stringify({
  dry_run: dryRun,
  changed_pages: results.length,
  added_cta_pages: results.filter((r) => r.added_cta).length,
  added_aria_pages: results.filter((r) => r.added_aria).length,
  cleaned_note_pages: results.filter((r) => r.cleaned_notes).length,
  added_document_index_pages: results.filter((r) => r.added_document_index).length,
  pages: results,
}, null, 2));
