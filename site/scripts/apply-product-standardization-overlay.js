const fs = require('fs');
const path = require('path');

const workspace = process.cwd();
const outputRoot = path.join(workspace, '.codex_tmp', 'site-mirror-current');
const previewDetailRoot = path.join(outputRoot, 'preview', 'products', 'detail');
const reportRoot = path.join(outputRoot, 'reports');

const candidateRoots = [
  path.join(workspace, '.codex_tmp', 'smac-specs-current'),
  path.join(workspace, '.codex_tmp', 'side-preview-83f79bd3'),
  path.join(workspace, 'generated', 'batch-spec-upgrade', 'runs'),
].filter((p) => fs.existsSync(p));

const noSpecExpected = new Set(['241', '253', '254', '255', '268', '269']);

const internalTextPatterns = [
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
  /data-local-file="[^"]*"/gi,
  /data-local-file='[^']*'/gi,
];

const internalBlockPatterns = [
  /<p\b[^>]*class=["'][^"']*(?:note|source|footnote)[^"']*["'][^>]*>[\s\S]*?(?:資料來源|原廠來源|後續由人工|待人工|正式選型前|避免自行|本區按鈕|本機|上傳至測試網|站內\s*URL|欄位依序|欄位保留)[\s\S]*?<\/p>/gi,
  /<div\b[^>]*class=["'][^"']*(?:note|source|footnote)[^"']*["'][^>]*>[\s\S]*?(?:資料來源|原廠來源|後續由人工|待人工|正式選型前|避免自行|本區按鈕|本機|上傳至測試網|站內\s*URL|欄位依序|欄位保留)[\s\S]*?<\/div>/gi,
  /<p\b[^>]*>[\s\S]{0,260}(?:資料來源|原廠來源|後續由人工|待人工|正式選型前|避免自行|本區按鈕|本機整理|本機官方|上傳至測試網|站內\s*URL|欄位依序|欄位保留)[\s\S]{0,260}<\/p>/gi,
];

const moduleNameRules = [
  { patterns: [/產品型號總覽/g, /產品型號規格詳情/g, /產品型號規格/g, /產品型號與規格/g, /熱門產品型號/g, /重點產品型號/g, /特殊產品型號/g, /產品分類與特點/g, /產品系列總覽/g, /產品系列特色/g, /產品系列規格詳情/g, /全系列產品陣容/g, /系列導覽/g, /型號導覽/g, /線性執行器系列選型/g], name: '產品系列' },
  { patterns: [/各系列主要規格/g, /產品核心規格\s*\([^)]*\)/g, /產品核心規格/g, /產品規格詳細資料/g, /產品規格詳情/g, /規格與性能參數\s*\([^)]*\)/g, /規格與性能參數/g, /型號規格詳情/g, /系統模組規格\s*\([^)]*\)/g, /系統模組規格/g], name: '產品規格詳情' },
  { patterns: [/推薦應用領域\s*\([^)]*\)/g, /行業應用實例\s*\([^)]*\)/g, /行業應用實例/g, /行業應用實績\s*\([^)]*\)/g, /核心應用領域\s*\([^)]*\)/g, /產業應用範疇/g, /主要應用市場/g, /主要應用領域/g, /典型應用場景/g, /重點應用場景/g, /應用場景建議/g, /應用實例與經驗/g, /應用建議與總結/g, /應用建議/g, /適用應用/g, /應用案例/g, /應用領域/g], name: '應用領域' },
  { patterns: [/技術資料下載\s*\([^)]*\)/g, /原廠資料下載\s*\([^)]*\)/g, /原廠文件下載/g, /技術資源下載/g, /下載資料/g, /下載中心/g, /相關下載/g], name: '技術資料下載' },
];

const seriesHeadingPatterns = [
  /產品系列/,
  /產品型號總覽/,
  /產品型號規格詳情/,
  /產品型號規格/,
  /產品系列總覽/,
  /全系列產品陣容/,
  /線性執行器系列選型/,
  /熱門產品型號/,
  /重點產品型號/,
  /特殊產品型號/,
  /產品分類與特點/,
  /產品系列特色/,
  /產品系列規格詳情/,
  /系列導覽/,
  /型號導覽/,
];
const specHeadingPatterns = [/產品規格詳情/, /各系列主要規格/, /產品核心規格/, /規格與性能參數/, /型號規格詳情/, /系統模組規格/];
const applicationHeadingPatterns = [/應用領域/, /主要應用領域/, /重點應用場景/, /產業應用範疇/, /行業應用實例/, /適用應用/, /應用案例/, /Industry Applications/i, /Applications/i];
const downloadHeadingPatterns = [/技術資料下載/, /下載資料/, /下載中心/, /相關下載/, /Downloads/i];
const allowedNonStandardHeadings = [
  /核心技術能力/i,
  /CAPABILITIES/i,
  /技術特色/,
  /產品特色/,
  /產品特性/,
  /產品特點/,
  /主要特色/,
  /產品定位/,
  /快速選型/,
  /依需求快速選型/,
  /基本規格/,
  /技術規格/,
  /一般技術規格/,
  /官方規格/,
  /性能規格/,
  /規格總覽/,
  /規格摘要/,
  /規格與尺寸/,
  /規格比較/,
  /型號與規格比較/,
  /主要型號與規格/,
  /可選尺寸/,
  /尺寸規格/,
  /系統組件規格/i,
  /惡劣與工業環境應用/,
  /適合工具機應用/,
  /應用場景與系統/,
  /低壓工業鼓風機系列/i,
  /中壓與高壓系列/i,
  /特殊應用鼓風機/i,
  /ATEX 防爆與安全系列/i,
  /特殊材質系列/i,
  /蝸輪絲桿升降機系列/i,
  /電動推桿系列/i,
  /Xenus Plus 系列/i,
  /Xenus 系列/i,
  /^(?:[A-Z0-9][A-Z0-9+\-\/\s().™®]*)(?:\s*系列)?$/i,
];

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

function stripScriptsForSearch(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, (m) => ' '.repeat(m.length));
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

function walkFiles(root, accept) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (/node_modules|\.git|assets-cache|raw|backup|runtime-backups|documents-cache/i.test(entry.name)) continue;
        stack.push(full);
      } else if (accept(full)) {
        out.push(full);
      }
    }
  }
  return out;
}

function fileLooksLikeSpecCandidate(file) {
  const name = path.basename(file).toLowerCase();
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.htm', '.txt'].includes(ext)) return false;
  if (/report|validation|readme|index|manifest|backup|original|log/.test(name)) return false;
  return /spec|規格|fragment|module|to-copy|copy|current|insert/.test(name);
}

function extractIdsFromPath(file) {
  const norm = file.replace(/\\/g, '/');
  const ids = new Set();
  const patterns = [
    /(?:^|\/)id[-_](\d{2,4})(?:[-_\/]|$)/gi,
    /(?:^|\/)detail[-_](\d{2,4})(?:[-_.\/]|$)/gi,
    /(?:^|\/)module[-_](\d{2,4})(?:[-_.\/]|$)/gi,
    /(?:^|\/)current[-_](\d{2,4})(?:[-_.\/]|$)/gi,
    /(?:^|\/)(\d{2,4})[-_][^\/]*(?:spec|規格|fragment|module|copy)/gi,
    /(?:spec|規格|fragment|module|copy)[-_](\d{2,4})(?:[-_.\/]|$)/gi,
  ];
  for (const re of patterns) {
    for (const m of norm.matchAll(re)) ids.add(String(Number(m[1])));
  }
  return [...ids];
}

function scoreCandidate(file) {
  const norm = file.replace(/\\/g, '/').toLowerCase();
  const name = path.basename(file).toLowerCase();
  let score = 0;
  if (norm.includes('/.codex_tmp/smac-specs-current/')) score += 120;
  if (norm.includes('/.codex_tmp/side-preview-83f79bd3/')) score += 90;
  if (norm.includes('/generated/batch-spec-upgrade/runs/')) score += 80;
  if (name.includes('specs-insert-to-copy-utf8')) score += 80;
  if (name.includes('backend-fragment')) score += 70;
  if (name.includes('spec-section')) score += 65;
  if (name.includes('full-spec')) score += 60;
  if (name.includes('fragment')) score += 50;
  if (name.includes('module-')) score += 45;
  if (name.includes('current-')) score += 35;
  if (name.endsWith('.txt')) score += 15;
  if (/preview|proposal|integrated|complete/.test(name)) score -= 50;
  try {
    const size = fs.statSync(file).size;
    if (size > 3000 && size < 160000) score += 10;
    if (size > 300000) score -= 30;
  } catch {}
  return score;
}

function buildCandidateMap(formalIds) {
  const byId = new Map();
  for (const root of candidateRoots) {
    const files = walkFiles(root, fileLooksLikeSpecCandidate);
    for (const file of files) {
      const ids = extractIdsFromPath(file).filter((id) => formalIds.has(id));
      if (!ids.length) continue;
      const item = { file, score: scoreCandidate(file), size: fs.statSync(file).size };
      for (const id of ids) {
        const prev = byId.get(id);
        if (!prev || item.score > prev.score || (item.score === prev.score && item.size > prev.size)) byId.set(id, item);
      }
    }
  }
  return byId;
}

function findHeadingIndex(html, patterns, start = 0) {
  const scrubbed = stripScriptsForSearch(html);
  const headingRe = /<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi;
  headingRe.lastIndex = start;
  let match;
  while ((match = headingRe.exec(scrubbed))) {
    const text = stripTags(match[0]);
    if (patterns.some((p) => p.test(text))) return match.index;
  }
  return -1;
}

function extractHeadings(html) {
  const headings = [];
  const re = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  for (const m of stripScriptsForSearch(html).matchAll(re)) {
    const text = stripTags(m[0]);
    const attrs = m[2] || '';
    const moduleLike =
      /\b(?:cat-title|section-title|module-title|block-title|title01)\b/i.test(attrs) ||
      /border-left/i.test(attrs) ||
      /data-standard-module/i.test(attrs);
    if (text) headings.push({ level: Number(m[1]), text, index: m.index, attrs, moduleLike });
  }
  return headings;
}

function findContainingSectionStart(html, idx) {
  if (idx < 0) return idx;
  const before = html.slice(0, idx);
  let best = idx;
  for (const tag of ['<section', '<div']) {
    const pos = before.toLowerCase().lastIndexOf(tag);
    if (pos >= 0 && pos > best - 5000) best = Math.min(best, pos);
  }
  return best;
}

function removeExistingStandardizedSpec(html) {
  return html.replace(/\n?<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->\n?/gi, '\n');
}

function normalizeHeadingNames(html) {
  return html.replace(/(<h[1-6]\b[^>]*>)([\s\S]*?)(<\/h[1-6]>)/gi, (all, open, inner, close) => {
    let next = inner;
    for (const rule of moduleNameRules) {
      for (const pattern of rule.patterns) next = next.replace(pattern, rule.name);
    }
    return open + next + close;
  });
}

function getBodyInner(html) {
  const m = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function sanitizeSpecFragment(raw) {
  let html = getBodyInner(raw).trim();
  const firstSection = html.search(/<style\b|<section\b|<div\b[^>]*(?:產品規格詳情|各系列主要規格|spec)/i);
  if (firstSection > 0) html = html.slice(firstSection);
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<div\b[^>]*class=(["'])[^"']*\b(?:media|gallery|image-grid|product-images?)\b[^"']*\1[^>]*>[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<figure\b[\s\S]*?<\/figure>/gi, '');
  html = html.replace(/<img\b[^>]*>/gi, '');
  html = html.replace(/各系列主要規格與文件/g, '產品規格詳情');
  html = html.replace(/各系列主要規格/g, '產品規格詳情');
  html = html.replace(/產品系列規格詳情/g, '產品規格詳情');
  html = normalizeHeadingNames(html);
  for (const re of internalBlockPatterns) html = html.replace(re, '');
  for (const re of internalTextPatterns) html = html.replace(re, '');
  html = html.replace(/PDF\s*待上架/g, 'PDF');
  html = html.replace(/待整理重上架/g, '文件');
  html = html.replace(/正式站內\s*URL\s*由人工上傳後替換/g, '');
  html = html.replace(/待人工取得[^。；<]*(?:。|；)?/g, '');
  html = html.replace(/待人工依[^。；<]*確認/g, '請洽星泰確認');
  html = html.replace(/待人工確認/g, '請洽星泰');
  html = html.replace(/人工確認/g, '請洽星泰');
  html = html.replace(/正式上架前確認[^。；<]*(?:。|；)?/g, '請洽星泰確認。');
  html = html.replace(/缺檔項目待人工補檔/g, '部分文件請洽星泰');
  html = html.replace(/原廠公開檔案待補或請洽星泰/g, '請洽星泰');
  html = html.replace(/公開文件待補或請洽星泰/g, '請洽星泰');
  html = html.replace(/文件待補或請洽星泰/g, '請洽星泰');
  html = html.replace(/原始公開檔案暫未成功下載/g, '');
  html = html.replace(/本機已整理，?待後站內\s*URL/g, '');
  html = html.replace(/待後站內\s*URL/g, '');
  html = html.replace(/後站內\s*URL/g, '');
  html = html.replace(/本機已整理/g, '');
  html = html.replace(/已整理成本機檔案/g, '');
  html = html.replace(/正式站內\s*PDF\s*URL/g, '');
  html = html.replace(/\b[\w.-]+\.txt\b/gi, '');
  html = html.replace(/\sdata-upload-url=(["'])\s*\1/gi, '');
  html = html.replace(/\sdata-upload-url=(["'])待[^"']*\1/gi, '');
  html = html.replace(/\sdata-local-file=(["'])[^"']*\1/gi, '');
  html = html.replace(/<a\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\sdata-source-url=(["'])(https?:\/\/[^"']+)\1/i);
    const upload = tag.match(/\sdata-upload-url=(["'])([^"']+)\1/i);
    const hasBadHref = /\shref=(["'])(?:#|javascript:void\(0\)|)\1/i.test(tag);
    let next = tag;
    if (hasBadHref && source) {
      next = next.replace(/\shref=(["'])(?:#|javascript:void\(0\)|)\1/i, ` href="${source[2]}"`);
    } else if (hasBadHref && upload && /^(?:https?:\/\/|\/|\.{1,2}\/)/i.test(upload[2])) {
      next = next.replace(/\shref=(["'])(?:#|javascript:void\(0\)|)\1/i, ` href="${upload[2]}"`);
    }
    next = next.replace(/\sdata-source-url=(["'])[^"']*\1/gi, '');
    next = next.replace(/\sdata-upload-url=(["'])[^"']*\1/gi, '');
    next = next.replace(/\sdata-local-file=(["'])[^"']*\1/gi, '');
    if (/href=(["'])https?:\/\//i.test(next) && !/target=["']_blank["']/i.test(next)) next = next.replace(/>$/, ' target="_blank">');
    if (/target=["']_blank["']/i.test(next) && !/\srel=/i.test(next)) next = next.replace(/>$/, ' rel="noopener">');
    if (!/\saria-label=/i.test(next) && /(?:\.pdf|\.zip|\.dwg|\.step|\.stp|\.dxf|\.cad|PDF|CAD|Manual|Catalog|Drawing|Software)/i.test(next)) {
      next = next.replace(/>$/, ' aria-label="下載技術資料">');
    }
    return next;
  });
  html = html.replace(/\sdata-source-url=(["'])[^"']*\1/gi, '');
  html = html.replace(/<a\b([^>]*)\shref=(["'])(?:#|javascript:void\(0\)|)\2([^>]*)>([\s\S]*?)<\/a>/gi, '<span$1$3 aria-label="下載資料請洽星泰">請洽星泰</span>');
  html = html.replace(/(<span\b[^>]*class=(["'])[^"']*\bplus\b[^"']*\2[^>]*>)[\s\S]*?(<\/span>)/gi, '$1展開 / 收合$3');
  if (!/產品規格詳情/.test(stripTags(html))) {
    html = `<section class="st-standard-spec-heading"><h3>產品規格詳情</h3></section>\n${html}`;
  }
  return `\n<!-- standardized-spec-module:start -->\n<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">\n${html}\n</div>\n<!-- standardized-spec-module:end -->\n`;
}

function insertSpecFragment(html, specFragment) {
  const seriesIdx = findHeadingIndex(html, seriesHeadingPatterns);
  const appIdx = findHeadingIndex(html, applicationHeadingPatterns);
  const downloadIdx = findHeadingIndex(html, downloadHeadingPatterns);
  let insertIdx = -1;
  let anchor = '';
  const afterSeries = [appIdx, downloadIdx].filter((x) => seriesIdx >= 0 && x > seriesIdx);
  if (seriesIdx >= 0 && afterSeries.length) {
    insertIdx = Math.min(...afterSeries);
    anchor = 'inserted';
  } else if (appIdx >= 0) {
    insertIdx = appIdx;
    anchor = 'inserted-before-application';
  } else if (downloadIdx >= 0) {
    insertIdx = downloadIdx;
    anchor = 'inserted-before-downloads';
  } else {
    insertIdx = html.search(/<\/main>|<\/article>|<\/body>/i);
    anchor = 'inserted-fallback-end';
  }
  if (insertIdx < 0) return { html: html + specFragment, anchor: 'inserted-append' };
  return { html: html.slice(0, insertIdx) + specFragment + html.slice(insertIdx), anchor };
}

function countMatches(html, re) {
  return [...html.matchAll(re)].length;
}

function specBlock(html) {
  const m = html.match(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/i);
  return m ? m[1] : '';
}

function withoutSpecBlock(html) {
  return html.replace(/<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/gi, ' ');
}

function extractTitle(html, fallback) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripTags(title[1]) : fallback;
}

function extractCategoryPath(html) {
  const pathMatch = html.match(/<div\b[^>]*class=["'][^"']*\bpath\b[^"']*["'][^>]*>[\s\S]*?<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  if (!pathMatch) return [];
  const out = [];
  for (const m of pathMatch[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripTags(m[1]).replace(/\s+/g, ' ').trim();
    if (text && !/^首頁$/.test(text) && !/^產品資訊$/.test(text)) out.push(text);
  }
  return out;
}

function validatePage(html, pageTitle = '') {
  const seriesIdx = findHeadingIndex(html, [/產品系列/]);
  const specIdx = findHeadingIndex(html, [/產品規格詳情/]);
  const appIdx = findHeadingIndex(html, [/應用領域/]);
  const downloadIdx = findHeadingIndex(html, [/技術資料下載/]);
  const block = specBlock(html);
  const warnings = [];
  if (specIdx >= 0 && seriesIdx >= 0 && specIdx < seriesIdx) warnings.push('spec_before_series');
  if (/href=(["'])[^"']*\.txt(?:[#?][^"']*)?\1/i.test(html)) warnings.push('txt_href');
  if (/file:\/\/\/|[A-Z]:\\/i.test(html)) warnings.push('local_path');
  if (/data-local-file/i.test(block)) warnings.push('spec_data_local_file');
  if (internalTextPatterns.some((re) => {
    re.lastIndex = 0;
    return re.test(block);
  })) warnings.push('spec_internal_note_text');
  const headings = extractHeadings(withoutSpecBlock(html));
  const unknownHeadings = headings
    .filter((h) => h.level !== 1)
    .filter((h) => h.text !== pageTitle)
    .filter((h) => h.moduleLike)
    .filter((h) => /產品|應用|Applications|Industry|Downloads|下載|規格|型號|系列|能力|CAPABILITIES|特色/i.test(h.text))
    .filter((h) => ![/產品系列/, /產品規格詳情/, /應用領域/, /技術資料下載/, /介紹/, ...allowedNonStandardHeadings].some((p) => p.test(h.text)))
    .map((h) => h.text);
  return {
    hasSeries: seriesIdx >= 0,
    hasSpec: specIdx >= 0,
    hasApplications: appIdx >= 0,
    hasDownloads: downloadIdx >= 0,
    order: { seriesIdx, specIdx, appIdx, downloadIdx },
    details: countMatches(html, /<details\b/gi),
    tables: countMatches(html, /<table\b/gi),
    pdfLinks: countMatches(html, /href=(["'])[^"']*\.pdf(?:[#?][^"']*)?\1/gi),
    cadRefs: countMatches(html, /\b(?:CAD|DWG|STEP|STP)\b/gi),
    specImages: countMatches(block, /<img\b/gi),
    unknownHeadings: [...new Set(unknownHeadings)],
    warnings,
  };
}

function statusFor(id, candidate, anchor, validation) {
  if (!candidate) return noSpecExpected.has(id) ? 'no-spec-module' : 'no-spec-module';
  if (validation.unknownHeadings.length) return 'needs-review-unknown-module';
  if (validation.warnings.length) return 'inserted-with-warnings';
  if (anchor === 'inserted-before-application') return 'inserted-before-application';
  if (anchor && anchor.startsWith('inserted')) return 'inserted';
  return 'insert-failed';
}

function renderReportHtml(report) {
  const rows = report.pages.map((p) => `<tr class="status-${htmlEscape(p.status)}">
<td>${htmlEscape(p.product_id)}</td>
<td><a href="../${htmlEscape(p.preview_rel)}">${htmlEscape(p.title)}</a></td>
<td>${htmlEscape((p.category_path || []).join(' › '))}</td>
<td><span class="badge">${htmlEscape(p.status)}</span></td>
<td>${htmlEscape(p.anchor || '')}</td>
<td>${htmlEscape(p.spec_candidate_rel || '')}</td>
<td>${htmlEscape((p.validation.unknownHeadings || []).join(' / '))}</td>
<td>${htmlEscape((p.validation.warnings || []).join(' / '))}</td>
</tr>`).join('\n');
  const cards = Object.entries(report.summary.status_counts).map(([k, v]) => `<div class="card"><div>${htmlEscape(k)}</div><strong>${v}</strong></div>`).join('\n');
  const categoryRows = Object.entries(report.summary.category_status_counts || {}).map(([category, counts]) => {
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const statusText = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' / ');
    return `<tr><td>${htmlEscape(category)}</td><td>${total}</td><td>${htmlEscape(statusText)}</td></tr>`;
  }).join('\n');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>產品頁標準化報告</title>
<style>body{font-family:Arial,'Noto Sans TC',sans-serif;margin:24px;background:#fbfdfb;color:#17251d}.summary{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.card{border:1px solid #d9e6dc;background:#fff;border-radius:8px;padding:12px 16px;min-width:150px}.card strong{font-size:24px;color:#00843d}table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d9e6dc}th,td{border-bottom:1px solid #e6eee8;padding:8px 9px;text-align:left;vertical-align:top;font-size:13px}th{background:#edf6f0}.badge{border-radius:999px;padding:3px 8px;background:#e8f3ec}.status-inserted .badge{background:#dff2e6;color:#00682c}.status-inserted-before-application .badge,.status-needs-review-unknown-module .badge,.status-inserted-with-warnings .badge{background:#fff3cd;color:#735c00}.status-no-spec-module .badge{background:#f4eee2;color:#77520c}</style></head><body>
<h1>產品頁標準化報告</h1><p>本報告只反映本機 preview overlay 狀態，沒有後台保存或上架。</p><div class="summary">${cards}</div>
<p><a href="product-standardization-report.json">查看 JSON</a></p>
<h2>分類狀態彙總</h2>
<table><thead><tr><th>正式網分類路徑</th><th>頁數</th><th>狀態統計</th></tr></thead><tbody>${categoryRows}</tbody></table>
<h2>逐頁結果</h2>
<table><thead><tr><th>ID</th><th>產品</th><th>分類</th><th>狀態</th><th>插入位置</th><th>規格候選</th><th>未知標題</th><th>警告</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function main() {
  if (!fs.existsSync(previewDetailRoot)) throw new Error(`Missing product detail preview root: ${previewDetailRoot}`);
  const detailFiles = fs.readdirSync(previewDetailRoot).filter((x) => /^\d+\.html$/.test(x)).sort((a, b) => Number(path.basename(a, '.html')) - Number(path.basename(b, '.html')));
  const ids = new Set(detailFiles.map((f) => path.basename(f, '.html')));
  const candidates = buildCandidateMap(ids);
  const pages = [];

  for (const file of detailFiles) {
    const id = path.basename(file, '.html');
    const filePath = path.join(previewDetailRoot, file);
    let html = readUtf8(filePath);
    const originalTitle = extractTitle(html, id);
    const categoryPath = extractCategoryPath(html);
    html = removeExistingStandardizedSpec(html);
    html = normalizeHeadingNames(html);
    const candidate = candidates.get(id);
    let anchor = '';
    if (candidate) {
      const fragment = sanitizeSpecFragment(readUtf8(candidate.file));
      const inserted = insertSpecFragment(html, fragment);
      html = inserted.html;
      anchor = inserted.anchor;
    }
    writeUtf8(filePath, html);
    const validation = validatePage(html, originalTitle);
    const status = statusFor(id, candidate, anchor, validation);
    pages.push({
      product_id: id,
      title: originalTitle,
      category_path: categoryPath,
      preview_rel: toPosix(path.relative(outputRoot, filePath)),
      spec_candidate_path: candidate ? toPosix(candidate.file) : '',
      spec_candidate_rel: candidate ? toPosix(path.relative(workspace, candidate.file)) : '',
      candidate_score: candidate ? candidate.score : 0,
      status,
      anchor,
      validation,
    });
  }

  const statusCounts = {};
  for (const page of pages) statusCounts[page.status] = (statusCounts[page.status] || 0) + 1;
  const categoryStatusCounts = {};
  for (const page of pages) {
    const key = page.category_path.length ? page.category_path.join(' › ') : '未分類';
    categoryStatusCounts[key] = categoryStatusCounts[key] || {};
    categoryStatusCounts[key][page.status] = (categoryStatusCounts[key][page.status] || 0) + 1;
  }
  const report = {
    generated_at: new Date().toISOString(),
    scope: 'site-mirror-current product detail preview pages',
    output_root: toPosix(outputRoot),
    candidate_roots: candidateRoots.map(toPosix),
    summary: {
      total_pages: pages.length,
      spec_candidates_found: pages.filter((p) => p.spec_candidate_path).length,
      no_spec_module: pages.filter((p) => !p.spec_candidate_path).length,
      status_counts: statusCounts,
      category_status_counts: categoryStatusCounts,
    },
    pages,
  };
  ensureDir(reportRoot);
  writeUtf8(path.join(reportRoot, 'product-standardization-report.json'), JSON.stringify(report, null, 2));
  writeUtf8(path.join(reportRoot, 'product-standardization-report.html'), renderReportHtml(report));
  process.stdout.write(JSON.stringify({
    status: 'completed',
    pages: pages.length,
    summary: report.summary,
    report: 'reports/product-standardization-report.html',
    json: 'reports/product-standardization-report.json',
  }, null, 2));
}

main();
