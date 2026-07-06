import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const productDir = path.join(root, 'preview', 'products', 'detail');
const reportDir = path.join(root, 'reports');
const dryRun = process.argv.includes('--dry-run');

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeAttr(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function encodeAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}

function attrValue(attrs, name) {
  return attrs.match(new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'i'))?.[2] || '';
}

function removeInternalAttrs(attrs) {
  return String(attrs || '')
    .replace(/\sdata-file-key=(["']).*?\1/gi, '')
    .replace(/\sdata-original-url=(["']).*?\1/gi, '')
    .replace(/\sdata-source-url=(["']).*?\1/gi, '');
}

function hasAttr(attrs, name) {
  return new RegExp(`\\s${name}=`, 'i').test(attrs);
}

function fileKindFrom(text) {
  const value = String(text || '').toLowerCase();
  if (/\.(?:dwg|dxf|step|stp|cad)(?:$|[?#])|\bcad\b|drawing|2d|3d|工程圖/.test(value)) return 'CAD';
  if (/\.zip(?:$|[?#])|\bzip\b/.test(value)) return 'ZIP';
  if (/software|軟體/.test(value)) return 'Software';
  if (/manual|installation|user.?guide|操作|安裝|手冊/.test(value)) return 'Manual';
  if (/catalog|brochure|datasheet|data.?sheet|型錄|規格/.test(value)) return 'PDF';
  if (/\.pdf(?:$|[?#])|\bpdf\b/.test(value)) return 'PDF';
  return '資料';
}

function labelForHref(href, visibleText) {
  const decodedHref = decodeURIComponent(decodeAttr(href));
  const fileName = decodedHref.split(/[/?#]/).filter(Boolean).pop() || '';
  const kind = fileKindFrom(`${href} ${visibleText}`);
  if (kind === '資料') return fileName ? `下載技術資料 ${fileName}` : '下載技術資料';
  return fileName ? `下載${kind}文件 ${fileName}` : `下載${kind}文件`;
}

function ensureTargetAttrs(attrs, href) {
  let next = removeInternalAttrs(attrs).replace(/\s+/g, ' ').trimEnd();
  const isExternal = /^https?:\/\//i.test(decodeAttr(href));
  if (isExternal && !hasAttr(next, 'target')) next += ' target="_blank"';
  if (isExternal) {
    if (hasAttr(next, 'rel')) {
      next = next.replace(/\srel=(["'])(.*?)\1/i, (_m, quote, value) => {
        const tokens = new Set(String(value).split(/\s+/).filter(Boolean));
        tokens.add('noopener');
        return ` rel=${quote}${[...tokens].join(' ')}${quote}`;
      });
    } else {
      next += ' rel="noopener"';
    }
  }
  return next;
}

function normalizeAnchors(block, stats) {
  return block.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, inner) => {
    const href = attrValue(attrs, 'href');
    if (!href) return full;
    const visible = stripTags(inner);
    const isTechnical =
      /\.(?:pdf|zip|dwg|dxf|step|stp|cad)(?:$|[?#])/i.test(decodeAttr(href)) ||
      /\b(?:PDF|CAD|ZIP|Download)\b|下載|規格|型錄|手冊|文件/i.test(visible);
    let nextAttrs = ensureTargetAttrs(attrs, href);
    if (isTechnical && !hasAttr(nextAttrs, 'aria-label')) {
      nextAttrs += ` aria-label="${escapeHtml(labelForHref(href, visible))}"`;
      stats.ariaAdded += 1;
    }
    const nextInner = visible ? inner : escapeHtml(fileKindFrom(href));
    if (!visible && isTechnical) stats.emptyAnchorTextFixed += 1;
    if (nextAttrs !== attrs) stats.internalAttrsRemoved += 1;
    return `<a${nextAttrs ? ` ${nextAttrs.trim()}` : ''}>${nextInner}</a>`;
  });
}

function normalizeContactInner(inner) {
  if (/請洽星泰/.test(stripTags(inner))) return inner;
  if (/<span\b[^>]*>\s*<\/span>/i.test(inner)) {
    return inner.replace(/<span\b([^>]*)>\s*<\/span>/i, (_match, attrs) => {
      const classAttr = attrValue(attrs, 'class');
      const classText = classAttr ? ` class="${escapeHtml(classAttr)}"` : ' class="st-doc-status"';
      return `<span${classText} role="note" aria-label="下載資料請洽星泰">請洽星泰</span>`;
    });
  }
  return `${inner}<span class="st-doc-status" role="note" aria-label="下載資料請洽星泰">請洽星泰</span>`;
}

function normalizeFileElements(block, stats) {
  let nextBlock = block.replace(/<(span|div)\b([^>]*\bdata-file-key=(["']).*?\3[^>]*)>([\s\S]*?)<\/\1>/gi, (full, tagName, attrs, _quote, inner) => {
    const originalUrl = attrValue(attrs, 'data-original-url') || attrValue(attrs, 'data-source-url');
    const classAttr = attrValue(attrs, 'class');
    const visible = stripTags(inner);
    const kind = fileKindFrom(`${visible} ${attrs} ${originalUrl}`);
    if (originalUrl) {
      let nextAttrs = removeInternalAttrs(attrs);
      nextAttrs = nextAttrs.replace(/\srole=(["'])note\1/gi, '');
      nextAttrs = nextAttrs.replace(/\saria-label=(["']).*?\1/gi, '');
      nextAttrs += ` href="${encodeAttr(originalUrl)}"`;
      nextAttrs = ensureTargetAttrs(nextAttrs, originalUrl);
      nextAttrs += ` aria-label="${escapeHtml(labelForHref(originalUrl, visible || kind))}"`;
      stats.spansLinked += 1;
      return `<a${nextAttrs ? ` ${nextAttrs.trim()}` : ''}>${escapeHtml(visible || kind)}</a>`;
    }

    if (tagName.toLowerCase() === 'div') {
      let nextAttrs = removeInternalAttrs(attrs);
      if (!hasAttr(nextAttrs, 'role')) nextAttrs += ' role="note"';
      stats.spansConvertedToContact += 1;
      stats.internalAttrsRemoved += 1;
      return `<div${nextAttrs ? ` ${nextAttrs.trim()}` : ''}>${normalizeContactInner(inner)}</div>`;
    }

    const safeClass = classAttr ? ` class="${escapeHtml(classAttr.replace(/\bpdf\b/gi, '').replace(/\s+/g, ' ').trim())}"` : '';
    stats.spansConvertedToContact += 1;
    return `<span${safeClass} role="note" aria-label="下載資料請洽星泰">請洽星泰</span>`;
  });
  nextBlock = nextBlock.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (full, attrs, inner) => {
    const visible = stripTags(inner);
    const className = attrValue(attrs, 'class');
    const isFileUi = /\b(?:file|download|doc)\b/i.test(className);
    const isDecorative = /\b(?:badge|code|icon)\b/i.test(className);
    const hasHref = /\shref=/i.test(attrs);
    if (!isFileUi || isDecorative || hasHref || !/^(PDF|CAD|ZIP|Download|下載)$/i.test(visible)) return full;
    stats.spansConvertedToContact += 1;
    return `<span${attrs ? ` ${removeInternalAttrs(attrs).trim()}` : ''} role="note" aria-label="下載資料請洽星泰">請洽星泰</span>`;
  });
  return nextBlock;
}

function normalizeSpecBlock(block, stats) {
  let next = block;
  next = normalizeAnchors(next, stats);
  next = normalizeFileElements(next, stats);
  return next;
}

function transformHtml(html, stats) {
  let next = html.replace(/<!-- standardized-spec-module:start -->([\s\S]*?)<!-- standardized-spec-module:end -->/gi, (full, block) => {
    const normalized = normalizeSpecBlock(block, stats);
    return `<!-- standardized-spec-module:start -->${normalized}<!-- standardized-spec-module:end -->`;
  });
  next = next.replace(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi, (full, attrs, body) => {
    if (!/產品規格詳情/.test(stripTags(body))) return full;
    const normalized = normalizeSpecBlock(body, stats);
    return `<section${attrs}>${normalized}</section>`;
  });
  return next;
}

const changed = [];
if (!fs.existsSync(productDir)) {
  console.error(`Missing product detail directory: ${productDir}`);
  process.exit(1);
}

for (const entry of fs.readdirSync(productDir)) {
  if (!entry.endsWith('.html')) continue;
  const file = path.join(productDir, entry);
  const before = fs.readFileSync(file, 'utf8');
  const stats = {
    file: path.relative(root, file).replaceAll(path.sep, '/'),
    spansLinked: 0,
    spansConvertedToContact: 0,
    ariaAdded: 0,
    emptyAnchorTextFixed: 0,
    internalAttrsRemoved: 0,
  };
  const after = transformHtml(before, stats);
  const touched = after !== before;
  if (touched) {
    changed.push(stats);
    if (!dryRun) fs.writeFileSync(file, after, 'utf8');
  }
}

const report = {
  generated_at: new Date().toISOString(),
  dry_run: dryRun,
  summary: {
    files_changed: changed.length,
    spans_linked: changed.reduce((sum, item) => sum + item.spansLinked, 0),
    spans_converted_to_contact: changed.reduce((sum, item) => sum + item.spansConvertedToContact, 0),
    aria_added: changed.reduce((sum, item) => sum + item.ariaAdded, 0),
    empty_anchor_text_fixed: changed.reduce((sum, item) => sum + item.emptyAnchorTextFixed, 0),
    internal_attrs_removed: changed.reduce((sum, item) => sum + item.internalAttrsRemoved, 0),
  },
  changed,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'spec-download-affordance-normalization.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report.summary, null, 2));
