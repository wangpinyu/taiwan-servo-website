const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const workspace = process.cwd();
const outputRoot = path.join(workspace, '.codex_tmp', 'site-mirror-current');
const rawRoot = path.join(outputRoot, 'raw');
const previewRoot = path.join(outputRoot, 'preview');
const assetRoot = path.join(outputRoot, 'assets-cache');
const documentRoot = path.join(outputRoot, 'documents-cache');
const reportRoot = path.join(outputRoot, 'reports');
const previousProductManifestPath = path.join(workspace, '.codex_tmp', 'product-page-mirror', 'all-products', 'manifest.json');

const baseOrigin = 'https://www.taiwan-servo.com.tw';
const userAgent = 'CodexTaiwanServoSiteMirror/1.0 local-preview';
const requestTimeoutMs = 25000;
const documentRequestTimeoutMs = 120000;
const maxAssetBytes = 18 * 1024 * 1024;
const maxDocumentBytes = Number(process.env.SITE_MIRROR_MAX_DOCUMENT_BYTES || 0);
const downloadDocuments = process.env.SITE_MIRROR_DOWNLOAD_DOCUMENTS !== '0';
const maxPages = 900;

const documentExtensions = new Set([
  '.pdf', '.zip', '.rar', '.7z', '.doc', '.docx', '.xls', '.xlsx',
  '.ppt', '.pptx', '.stp', '.step', '.igs', '.iges', '.dwg', '.dxf',
  '.cad', '.3dm', '.x_t', '.x_b', '.prt', '.sldprt', '.sldasm'
]);

const renderAssetExtensions = new Set([
  '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.svg', '.ico', '.bmp', '.avif', '.woff', '.woff2', '.ttf', '.otf',
  '.eot', '.mp4', '.webm'
]);

const skippedPathPrefixes = [
  '/download',
  '/inquiry',
  '/news',
  '/faq',
  '/contact',
  '/recruit',
  '/recruitment',
  '/career',
  '/careers',
  '/article',
  '/articles',
  '/technical',
  '/technology',
  '/blog',
  '/video',
  '/videos'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value, 'utf8');
}

function applyServicePreviewOverlay() {
  const scriptPath = path.join(outputRoot, 'scripts', 'apply-service-preview-overlay.py');
  if (!fs.existsSync(scriptPath)) {
    return { status: 'skipped', reason: 'overlay script missing' };
  }
  const result = spawnSync('python', ['-X', 'utf8', scriptPath], {
    cwd: workspace,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    return {
      status: 'failed',
      exit_code: result.status,
      stderr: (result.stderr || '').trim().slice(0, 2000),
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return {
      status: 'completed',
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
}

function applyProductStandardizationOverlay() {
  const scriptPath = path.join(outputRoot, 'scripts', 'apply-product-standardization-overlay.js');
  if (!fs.existsSync(scriptPath)) {
    return { status: 'skipped', reason: 'product overlay script missing' };
  }
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    return {
      status: 'failed',
      exit_code: result.status,
      stderr: (result.stderr || '').trim().slice(0, 2000),
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return {
      status: 'completed',
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
}

function validateProductSpecModules() {
  const scriptPath = path.join(outputRoot, 'scripts', 'validate-product-spec-modules.js');
  if (!fs.existsSync(scriptPath)) {
    return { status: 'skipped', reason: 'product spec QA script missing' };
  }
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    return {
      status: 'failed',
      exit_code: result.status,
      stderr: (result.stderr || '').trim().slice(0, 2000),
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return {
      status: 'completed',
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
}

function generateProductSpecAgentReview() {
  const scriptPath = path.join(outputRoot, 'scripts', 'generate-product-spec-agent-review.js');
  if (!fs.existsSync(scriptPath)) {
    return { status: 'skipped', reason: 'product spec agent review script missing' };
  }
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    return {
      status: 'failed',
      exit_code: result.status,
      stderr: (result.stderr || '').trim().slice(0, 2000),
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return {
      status: 'completed',
      stdout: (result.stdout || '').trim().slice(0, 2000)
    };
  }
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attrEscape(value) {
  return htmlEscape(value).replace(/'/g, '&#39;');
}

function hashShort(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
}

function safeSegment(value, fallback = 'item') {
  const safe = String(value || '')
    .replace(/%/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || fallback;
}

function extOfUrl(urlObj) {
  const name = path.posix.basename(urlObj.pathname).toLowerCase();
  return path.posix.extname(name);
}

function normalizeUrl(input, base = baseOrigin + '/') {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(mailto|tel|javascript|data):/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed, base);
    url.hash = '';
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function isSameOrigin(urlObj) {
  return urlObj.origin === baseOrigin;
}

function isDocumentUrl(urlObj) {
  return documentExtensions.has(extOfUrl(urlObj)) || urlObj.pathname.startsWith('/file/download/');
}

function isRenderAssetUrl(urlObj) {
  return renderAssetExtensions.has(extOfUrl(urlObj));
}

function isSkippedPage(urlObj) {
  const p = urlObj.pathname.toLowerCase();
  return skippedPathPrefixes.some(prefix => p === prefix || p.startsWith(prefix + '/'));
}

function isIncludedPage(urlObj) {
  if (!isSameOrigin(urlObj)) return false;
  const p = urlObj.pathname;
  return p === '/'
    || p === '/company' || p.startsWith('/company/')
    || p === '/brands' || p.startsWith('/brands/')
    || p === '/products' || p.startsWith('/products/')
    || p === '/services' || p.startsWith('/services/');
}

function localPageAlias(urlObj) {
  if (!urlObj || !isSameOrigin(urlObj)) return null;
  if (urlObj.pathname === '/about') return normalizeUrl('/company', baseOrigin + '/');
  return null;
}

function pageType(urlObj) {
  const p = urlObj.pathname;
  if (p === '/') return 'home';
  if (p === '/company') return 'company-profile';
  if (p.startsWith('/company')) return 'company-other';
  if (p === '/brands') return 'brand-list';
  if (p.startsWith('/brands')) return 'brand-other';
  if (p === '/products') return 'product-list';
  if (/^\/products\/category\/\d+/.test(p)) return 'product-category';
  if (/^\/products\/detail\/\d+/.test(p)) return 'product-detail';
  if (p === '/services') return 'service-list';
  if (/^\/services\/detail\/\d+/.test(p)) return 'service-detail';
  if (p.startsWith('/products')) return 'product-other';
  if (p.startsWith('/services')) return 'service-other';
  return 'other';
}

function canonicalUrl(urlObj) {
  const url = new URL(urlObj.href);
  url.hash = '';
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.href;
}

function previewPathForUrl(urlObj) {
  const p = urlObj.pathname;
  const q = urlObj.search ? '-' + safeSegment(urlObj.search.slice(1)) : '';
  if (p === '/') return path.join(previewRoot, 'index.html');
  if (p === '/products') return path.join(previewRoot, 'products', `index${q}.html`);
  if (p === '/services') return path.join(previewRoot, 'services', `index${q}.html`);
  const parts = p.split('/').filter(Boolean).map(part => safeSegment(decodeURIComponentSafe(part)));
  const last = parts.pop() || 'index';
  return path.join(previewRoot, ...parts, `${last}${q}.html`);
}

function rawPathForUrl(urlObj) {
  const p = previewPathForUrl(urlObj);
  return path.join(rawRoot, path.relative(previewRoot, p));
}

function stubPathForUrl(urlObj) {
  const key = safeSegment(urlObj.pathname + (urlObj.search || ''), 'skipped');
  return path.join(previewRoot, 'skipped', `${hashShort(urlObj.href)}-${key}.html`);
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = requestTimeoutMs, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'user-agent': userAgent,
        ...(fetchOptions.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).trim() : '';
}

function extractH1(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]).trim() : '';
}

function stripTags(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function extractAttrs(html, attrName) {
  const out = [];
  const re = new RegExp(`\\b${attrName}\\s*=\\s*([\"'])(.*?)\\1`, 'gi');
  let m;
  while ((m = re.exec(html))) out.push(m[2]);
  return out;
}

function extractLinks(html, baseUrl) {
  const links = [];
  for (const href of extractAttrs(html, 'href')) {
    const url = normalizeUrl(href, baseUrl);
    if (url) links.push(url);
  }
  return links;
}

function extractCategoryIdsFromProducts(productPages) {
  const ids = new Set();
  for (const page of productPages) {
    for (const source of page.discovered_from || []) {
      const m = String(source).match(/\/products\/category\/(\d+)/);
      if (m) ids.add(m[1]);
    }
    for (const id of page.category_ids || []) ids.add(String(id));
  }
  return [...ids].sort((a, b) => Number(a) - Number(b));
}

function buildCategoryTree(productPages) {
  const roots = [];
  const rootByName = new Map();
  for (const page of productPages) {
    const pathParts = Array.isArray(page.category_path) && page.category_path.length ? page.category_path : [page.category].filter(Boolean);
    if (!pathParts.length) continue;
    let currentList = roots;
    let keyPath = '';
    for (const part of pathParts) {
      const label = String(part || '').trim();
      if (!label) continue;
      keyPath += '/' + label;
      let node = rootByName.get(keyPath);
      if (!node) {
        node = { label, count: 0, children: [], pages: [] };
        rootByName.set(keyPath, node);
        currentList.push(node);
      }
      node.count += 1;
      if (label === pathParts[pathParts.length - 1]) {
        node.pages.push({ id: page.product_id, title: page.h1 || page.title || page.product_id });
      }
      currentList = node.children;
    }
  }
  return roots;
}

function extractProductSideCategoryTree(html, productPages) {
  let marker = html.indexOf('nav-title03');
  if (marker < 0) marker = html.indexOf('分類列表');
  if (marker < 0) return [];
  const navStart = html.indexOf('<nav', marker);
  const navEnd = html.indexOf('</nav>', marker);
  if (navStart < 0 || navEnd < 0) return [];
  const segment = html.slice(navStart, navEnd + 6);
  const directCounts = new Map();
  for (const page of productPages) {
    if (page.category) directCounts.set(page.category, (directCounts.get(page.category) || 0) + 1);
  }

  const roots = [];
  const lastAtDepth = new Map();
  let currentDepth = 1;
  const tokenRe = /<ul\b[^>]*class=["'][^"']*\bnode([123])\b[^"']*["'][^>]*>|<\/ul>|<a\b[^>]*href=["']\/products\/category\/(\d+)[^"']*["'][^>]*title=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = tokenRe.exec(segment))) {
    if (m[1]) {
      currentDepth = Number(m[1]);
      continue;
    }
    if (m[0].toLowerCase() === '</ul>') {
      currentDepth = Math.max(1, currentDepth - 1);
      continue;
    }
    if (m[2]) {
      const node = {
        id: m[2],
        label: decodeHtmlEntity(m[3]),
        count: directCounts.get(decodeHtmlEntity(m[3])) || 0,
        children: [],
        pages: []
      };
      if (currentDepth <= 1) {
        roots.push(node);
      } else {
        const parent = lastAtDepth.get(currentDepth - 1);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
      lastAtDepth.set(currentDepth, node);
      for (const depth of [...lastAtDepth.keys()]) {
        if (depth > currentDepth) lastAtDepth.delete(depth);
      }
    }
  }
  function rollup(node) {
    for (const child of node.children) node.count += rollup(child);
    return node.count;
  }
  for (const node of roots) rollup(node);
  return roots;
}

function decodeHtmlEntity(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extensionFromContentType(contentType) {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  const map = {
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/vnd.rar': '.rar',
    'application/x-7z-compressed': '.7z',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
  };
  return map[type] || '.bin';
}

function documentLocalPathForUrl(urlObj, contentType = '') {
  const ext = extOfUrl(urlObj) || extensionFromContentType(contentType);
  const baseName = safeSegment(path.posix.basename(urlObj.pathname), 'document');
  const hasExt = ext && baseName.toLowerCase().endsWith(ext.toLowerCase());
  const name = `${hashShort(urlObj.href)}-${baseName}${hasExt ? '' : ext}`;
  return path.join(documentRoot, name);
}

function documentResultFromExisting(urlObj, localPath) {
  const stat = fs.statSync(localPath);
  return {
    url: canonicalUrl(urlObj),
    status: 200,
    ok: true,
    content_type: '',
    content_length: stat.size,
    bytes: stat.size,
    local_path: toPosix(localPath),
    local_rel: toPosix(path.relative(outputRoot, localPath)),
    note: 'reused local document'
  };
}

function missingAssetPlaceholderPath() {
  const localPath = path.join(assetRoot, 'missing-source-asset.svg');
  if (!fs.existsSync(localPath)) {
    ensureDir(path.dirname(localPath));
    fs.writeFileSync(localPath, `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="Missing source image">
  <rect width="640" height="360" fill="#f6f8f7"/>
  <rect x="24" y="24" width="592" height="312" rx="12" fill="none" stroke="#cfdcd5" stroke-width="3" stroke-dasharray="10 8"/>
  <text x="320" y="170" text-anchor="middle" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" fill="#58705f">Source image unavailable</text>
  <text x="320" y="210" text-anchor="middle" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="18" fill="#7d8b82">正式網來源圖片目前無法下載</text>
</svg>`, 'utf8');
  }
  return localPath;
}

async function cacheAsset(urlObj, pageFile, assetStats, referrerUrl) {
  if (!isSameOrigin(urlObj) || isDocumentUrl(urlObj)) return urlObj.href;
  if (!isRenderAssetUrl(urlObj) && !urlObj.pathname.startsWith('/uploads/')) return urlObj.href;

  const key = canonicalUrl(urlObj);
  const ext = extOfUrl(urlObj) || '.bin';
  const name = `${hashShort(urlObj.href)}-${safeSegment(path.posix.basename(urlObj.pathname), 'asset')}${ext && !path.posix.basename(urlObj.pathname).toLowerCase().endsWith(ext) ? ext : ''}`;
  const localPath = path.join(assetRoot, name);
  const rel = toPosix(path.relative(path.dirname(pageFile), localPath));

  if (fs.existsSync(localPath)) {
    const stat = fs.statSync(localPath);
    if (!assetStats.byUrl.has(key)) {
      const item = {
        url: key,
        status: 200,
        ok: true,
        content_type: '',
        bytes: stat.size,
        local_path: toPosix(localPath),
        local_rel: toPosix(path.relative(outputRoot, localPath)),
        note: 'reused local asset'
      };
      assetStats.items.push(item);
      assetStats.byUrl.set(key, item);
    }
    assetStats.reused += 1;
    return rel;
  }

  try {
    const res = await fetchWithTimeout(urlObj.href, { headers: referrerUrl ? { referer: referrerUrl } : {} });
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (!res.ok) {
      const placeholder = missingAssetPlaceholderPath();
      assetStats.byUrl.set(key, {
        url: key,
        status: res.status,
        ok: false,
        local_path: toPosix(placeholder),
        local_rel: toPosix(path.relative(outputRoot, placeholder)),
        note: 'asset download failed; local placeholder used'
      });
      assetStats.failed += 1;
      assetStats.failures.push({ url: urlObj.href, status: res.status });
      return toPosix(path.relative(path.dirname(pageFile), placeholder));
    }
    if (contentLength > maxAssetBytes) {
      assetStats.byUrl.set(key, { url: key, status: res.status, ok: false, bytes: contentLength, note: 'asset skipped by size limit' });
      assetStats.skippedLarge += 1;
      assetStats.large.push({ url: urlObj.href, bytes: contentLength });
      return urlObj.href;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxAssetBytes) {
      assetStats.byUrl.set(key, { url: key, status: res.status, ok: false, bytes: buf.length, note: 'asset skipped by size limit' });
      assetStats.skippedLarge += 1;
      assetStats.large.push({ url: urlObj.href, bytes: buf.length });
      return urlObj.href;
    }
    ensureDir(path.dirname(localPath));
    fs.writeFileSync(localPath, buf);
    assetStats.cached += 1;
    assetStats.bytes += buf.length;
    const item = {
      url: key,
      status: res.status,
      ok: true,
      local_path: toPosix(localPath),
      local_rel: toPosix(path.relative(outputRoot, localPath)),
      bytes: buf.length,
      content_type: res.headers.get('content-type') || '',
      note: 'downloaded'
    };
    assetStats.items.push(item);
    assetStats.byUrl.set(key, item);
    if ((res.headers.get('content-type') || '').includes('text/css') || ext === '.css') {
      await rewriteCssAsset(localPath, urlObj.href, assetStats);
    }
    return rel;
  } catch (err) {
    const placeholder = missingAssetPlaceholderPath();
    assetStats.byUrl.set(key, {
      url: key,
      status: null,
      ok: false,
      error: String(err && err.message || err),
      local_path: toPosix(placeholder),
      local_rel: toPosix(path.relative(outputRoot, placeholder)),
      note: 'asset download failed; local placeholder used'
    });
    assetStats.failed += 1;
    assetStats.failures.push({ url: urlObj.href, error: String(err && err.message || err) });
    return toPosix(path.relative(path.dirname(pageFile), placeholder));
  }
}

async function cacheDocument(urlObj, pageFile, documentStats, referrerUrl) {
  const key = canonicalUrl(urlObj);
  if (!downloadDocuments || !isSameOrigin(urlObj)) return urlObj.href;
  if (documentStats.byUrl.has(key)) {
    const existing = documentStats.byUrl.get(key);
    return existing.ok && existing.local_path
      ? toPosix(path.relative(path.dirname(pageFile), existing.local_path))
      : urlObj.href;
  }

  let localPath = documentLocalPathForUrl(urlObj);
  const rel = () => toPosix(path.relative(path.dirname(pageFile), localPath));
  if (fs.existsSync(localPath)) {
    const result = documentResultFromExisting(urlObj, localPath);
    documentStats.reused += 1;
    documentStats.bytes += result.bytes;
    documentStats.items.push(result);
    documentStats.byUrl.set(key, result);
    return rel();
  }

  try {
    const res = await fetchWithTimeout(urlObj.href, {
      timeoutMs: documentRequestTimeoutMs,
      headers: referrerUrl ? { referer: referrerUrl } : {}
    });
    const contentType = res.headers.get('content-type') || '';
    const contentLength = Number(res.headers.get('content-length') || 0);
    localPath = documentLocalPathForUrl(urlObj, contentType);
    if (!res.ok) {
      const result = {
        url: key,
        status: res.status,
        ok: false,
        content_type: contentType,
        content_length: contentLength,
        error: `HTTP ${res.status}`,
        note: 'download failed'
      };
      documentStats.failed += 1;
      documentStats.failures.push(result);
      documentStats.byUrl.set(key, result);
      return urlObj.href;
    }
    if (maxDocumentBytes > 0 && contentLength > maxDocumentBytes) {
      const result = {
        url: key,
        status: res.status,
        ok: false,
        content_type: contentType,
        content_length: contentLength,
        error: `document larger than configured SITE_MIRROR_MAX_DOCUMENT_BYTES=${maxDocumentBytes}`,
        note: 'download skipped by configured size limit'
      };
      documentStats.skippedLarge += 1;
      documentStats.large.push(result);
      documentStats.byUrl.set(key, result);
      return urlObj.href;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (maxDocumentBytes > 0 && buf.length > maxDocumentBytes) {
      const result = {
        url: key,
        status: res.status,
        ok: false,
        content_type: contentType,
        content_length: buf.length,
        error: `document larger than configured SITE_MIRROR_MAX_DOCUMENT_BYTES=${maxDocumentBytes}`,
        note: 'download skipped by configured size limit'
      };
      documentStats.skippedLarge += 1;
      documentStats.large.push(result);
      documentStats.byUrl.set(key, result);
      return urlObj.href;
    }
    ensureDir(path.dirname(localPath));
    fs.writeFileSync(localPath, buf);
    const result = {
      url: key,
      status: res.status,
      ok: true,
      content_type: contentType,
      content_length: contentLength || buf.length,
      bytes: buf.length,
      local_path: toPosix(localPath),
      local_rel: toPosix(path.relative(outputRoot, localPath)),
      note: 'downloaded'
    };
    documentStats.downloaded += 1;
    documentStats.bytes += buf.length;
    documentStats.items.push(result);
    documentStats.byUrl.set(key, result);
    return rel();
  } catch (err) {
    const result = {
      url: key,
      status: null,
      ok: false,
      error: String(err && err.message || err),
      note: 'download failed'
    };
    documentStats.failed += 1;
    documentStats.failures.push(result);
    documentStats.byUrl.set(key, result);
    return urlObj.href;
  }
}

async function rewriteCssAsset(cssPath, cssUrl, assetStats) {
  let css;
  try {
    css = fs.readFileSync(cssPath, 'utf8');
  } catch {
    return;
  }
  const replacements = [];
  const re = /url\((['"]?)(.*?)\1\)/gi;
  let m;
  while ((m = re.exec(css))) {
    const raw = m[2].trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('#')) continue;
    const url = normalizeUrl(raw, cssUrl);
    if (!url || !isSameOrigin(url) || isDocumentUrl(url)) continue;
    const rel = await cacheAsset(url, cssPath, assetStats, cssUrl);
    replacements.push({ start: m.index, end: re.lastIndex, value: `url("${rel}")` });
  }
  if (!replacements.length) return;
  let out = '';
  let last = 0;
  for (const r of replacements) {
    out += css.slice(last, r.start) + r.value;
    last = r.end;
  }
  out += css.slice(last);
  fs.writeFileSync(cssPath, out, 'utf8');
}

function replaceRanges(input, ranges) {
  if (!ranges.length) return input;
  ranges.sort((a, b) => a.start - b.start);
  let out = '';
  let last = 0;
  for (const r of ranges) {
    if (r.start < last) continue;
    out += input.slice(last, r.start) + r.value;
    last = r.end;
  }
  out += input.slice(last);
  return out;
}

async function rewriteHtml(html, pageUrl, pageFile, pageMap, stubMap, docLinks, assetStats, documentStats) {
  const ranges = [];
  const attrRe = /\b(href|src)\s*=\s*(["'])(.*?)\2/gi;
  let m;
  while ((m = attrRe.exec(html))) {
    const attr = m[1].toLowerCase();
    const quote = m[2];
    const raw = m[3];
    const url = normalizeUrl(raw, pageUrl);
    if (!url) continue;
    let replacement = null;
    if (attr === 'href') {
      if (isSameOrigin(url) && isDocumentUrl(url)) {
        docLinks.add(canonicalUrl(url));
        replacement = await cacheDocument(url, pageFile, documentStats, pageUrl);
      } else if (localPageAlias(url)) {
        const target = pageMap.get(canonicalUrl(localPageAlias(url)));
        if (target) replacement = toPosix(path.relative(path.dirname(pageFile), target));
      } else if (isSameOrigin(url) && isIncludedPage(url)) {
        const target = pageMap.get(canonicalUrl(url));
        if (target) replacement = toPosix(path.relative(path.dirname(pageFile), target));
      } else if (isSameOrigin(url) && isSkippedPage(url)) {
        const target = stubMap.get(canonicalUrl(url)) || createSkippedStub(url, stubMap);
        replacement = toPosix(path.relative(path.dirname(pageFile), target));
      } else if (isSameOrigin(url) && isRenderAssetUrl(url)) {
        replacement = await cacheAsset(url, pageFile, assetStats, pageUrl);
      }
    } else if (attr === 'src') {
      if (isSameOrigin(url)) replacement = await cacheAsset(url, pageFile, assetStats, pageUrl);
    }
    if (replacement) {
      ranges.push({ start: m.index, end: attrRe.lastIndex, value: `${attr}=${quote}${attrEscape(replacement)}${quote}` });
    }
  }

  const srcsetRe = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
  while ((m = srcsetRe.exec(html))) {
    const quote = m[1];
    const raw = m[2];
    const parts = raw.split(',').map(part => part.trim()).filter(Boolean);
    const rewritten = [];
    let changed = false;
    for (const part of parts) {
      const pieces = part.split(/\s+/);
      const url = normalizeUrl(pieces[0], pageUrl);
      if (url && isSameOrigin(url)) {
        const rel = await cacheAsset(url, pageFile, assetStats, pageUrl);
        rewritten.push([rel, ...pieces.slice(1)].join(' '));
        changed = true;
      } else {
        rewritten.push(part);
      }
    }
    if (changed) {
      ranges.push({ start: m.index, end: srcsetRe.lastIndex, value: `srcset=${quote}${attrEscape(rewritten.join(', '))}${quote}` });
    }
  }

  return replaceRanges(html, ranges);
}

function createSkippedStub(urlObj, stubMap) {
  const key = canonicalUrl(urlObj);
  const target = stubPathForUrl(urlObj);
  if (!stubMap.has(key)) {
    stubMap.set(key, target);
    const html = `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Skipped - ${htmlEscape(urlObj.pathname)}</title>
<style>body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:40px;color:#17261d}.card{max-width:760px;border:1px solid #d7e3dc;border-radius:8px;padding:24px;background:#f7fbf8}a{color:#07883f}</style></head>
<body><div class="card"><h1>此頁未納入本機鏡像</h1><p>依本輪範圍，下載專區、人才招募、技術文章、影片連結、聯絡我們、常見問答等高度後台綁定頁面先不下載。</p><p>原始 URL：<a href="${attrEscape(urlObj.href)}">${htmlEscape(urlObj.href)}</a></p><p><a href="../index.html">回本機鏡像首頁</a></p></div></body></html>`;
    writeText(target, html);
  }
  return target;
}

async function checkDocumentLink(url) {
  try {
    let res = await fetchWithTimeout(url, { method: 'HEAD' });
    if (res.status === 405 || res.status === 403) {
      res = await fetchWithTimeout(url, { method: 'GET', headers: { range: 'bytes=0-0' } });
    }
    return {
      url,
      status: res.status,
      ok: res.ok || res.status === 206,
      content_type: res.headers.get('content-type') || '',
      content_length: Number(res.headers.get('content-length') || 0),
      note: 'not downloaded'
    };
  } catch (err) {
    return { url, status: null, ok: false, error: String(err && err.message || err), note: 'not downloaded' };
  }
}

function localFileUrl(file) {
  return 'file:///' + toPosix(path.resolve(file)).replace(/^([A-Za-z]):/, '$1:');
}

function backendEditabilityMap() {
  const regions = [
    {
      page_type: 'product-detail',
      editable_high_freedom: [
        { region: '產品規格 / 主內容 CKEditor', backend_field: 'tw_specifications', notes: '主要 HTML/CSS/table/details/spec 模組編輯面；適合產品規格詳情、應用、下載入口等。' },
        { region: '產品介紹 CKEditor', backend_field: 'tw_description', notes: '可放基本介紹；不應承載完整規格比較表，避免與主內容混用。' }
      ],
      structured_not_free_layout: [
        { region: '產品名稱', backend_field: 'tw_name', notes: '影響標題與列表名稱。' },
        { region: '產品分類', backend_field: 'cid', notes: '影響側欄分類、列表與 breadcrumb。' },
        { region: '產品系列', backend_field: 'tw_series', notes: '可作系列標籤，但不是自由 HTML。' },
        { region: '代表圖', backend_field: 'photo', notes: '600x600 結構化圖片欄位；需要命名、裁切、壓縮與上傳驗證。' },
        { region: '圖片', backend_field: 'photos', notes: '600x600 產品詳情 gallery 欄位；非 CKEditor 自由區。' },
        { region: 'SEO 欄位', backend_field: 'seo[...]', notes: 'meta title/keywords/description，需事實來源支持。' }
      ],
      locked_or_template: [
        { region: '側邊標籤「介紹」', notes: '前台/模板固定文字，不應規劃為可改標題。' },
        { region: '全站導覽、產品分類側欄、footer、浮動按鈕', notes: '模板/全站資料驅動，單頁 CKEditor 無法自由改。' },
        { region: '產品圖片區的前台位置與 gallery 結構', notes: '由 photo/photos 與模板控制，不能用主內容區直接替代。' }
      ]
    },
    {
      page_type: 'product-category',
      locked_or_template: [
        { region: '產品列表卡片與分類側欄', notes: '主要由分類與產品資料驅動；本機可預覽，但單一 CKEditor 片段不能改列表模板。' }
      ],
      structured_not_free_layout: [
        { region: '分類名稱/排序/SEO', backend_field: 'ProductCategories', notes: '可由後台分類模組管理，仍不是自由排版 HTML。' }
      ]
    },
    {
      page_type: 'home',
      structured_not_free_layout: [
        { region: '首頁內容模組', notes: '需另行檢查首頁後台模組；本輪只鏡像前端呈現。' }
      ]
    },
    {
      page_type: 'service',
      structured_not_free_layout: [
        { region: '服務項目內容', notes: '可能由服務項目後台模組管理；本輪納入前端鏡像，但不做後台判定或保存。' }
      ]
    }
  ];
  return {
    generated_at: new Date().toISOString(),
    source: 'local governance docs and backend operation notes; no backend login in this run',
    regions
  };
}

function renderBackendMapHtml(map) {
  const cards = map.regions.map(region => {
    const sections = ['editable_high_freedom', 'structured_not_free_layout', 'locked_or_template'].map(key => {
      const items = region[key] || [];
      if (!items.length) return '';
      const title = key === 'editable_high_freedom' ? '高自由度可編輯' : key === 'structured_not_free_layout' ? '結構化可編輯但非自由排版' : '模板鎖死 / 單頁不可自由編輯';
      return `<h3>${title}</h3><table><thead><tr><th>區塊</th><th>後台欄位</th><th>說明</th></tr></thead><tbody>${items.map(item => `<tr><td>${htmlEscape(item.region)}</td><td>${htmlEscape(item.backend_field || '')}</td><td>${htmlEscape(item.notes || '')}</td></tr>`).join('')}</tbody></table>`;
    }).join('');
    return `<section class="card"><h2>${htmlEscape(region.page_type)}</h2>${sections}</section>`;
  }).join('');
  return pageShell('後台限制對照表', `<p><a href="../index.html">回主控面板</a></p>${cards}`);
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlEscape(title)}</title>
<style>
body{font-family:Arial,"Microsoft JhengHei",sans-serif;margin:0;color:#102033;background:#f6f8f7}
a{color:#087d3d} header{background:#0b8e43;color:white;padding:22px 28px} main{padding:24px;max-width:1280px;margin:auto}
.grid{display:grid;grid-template-columns:320px 1fr;gap:20px}.panel,.card{background:white;border:1px solid #d9e5de;border-radius:8px;padding:18px;margin-bottom:16px}
input,select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cddbd3;border-radius:6px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;background:white} th{background:#eaf4ee;text-align:left} th,td{padding:10px;border-bottom:1px solid #dde7e1;vertical-align:top}
.status-ok{color:#087d3d;font-weight:700}.status-warn{color:#9b6a00;font-weight:700}.status-bad{color:#b3261e;font-weight:700}
.tree ul{list-style:none;padding-left:18px}.tree li{margin:7px 0}.small{font-size:13px;color:#5b6b75}.pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#eaf4ee;margin-left:6px}
@media(max-width:900px){.grid{grid-template-columns:1fr}main{padding:12px}table{font-size:13px}}
</style>
</head>
<body><header><h1>${htmlEscape(title)}</h1></header><main>${body}</main></body></html>`;
}

function renderCategoryTree(nodes) {
  if (!nodes || !nodes.length) return '';
  return `<ul>${nodes.map(node => `<li><strong>${htmlEscape(node.label)}</strong> <span class="pill">${node.count}</span>${renderCategoryTree(node.children)}</li>`).join('')}</ul>`;
}

function renderIndex(manifest, categoryTree, validation) {
  const rows = manifest.pages.map(page => `<tr data-type="${htmlEscape(page.type)}"><td>${htmlEscape(page.type)}</td><td><a href="${attrEscape(page.preview_rel)}">${htmlEscape(page.title || page.h1 || page.url)}</a></td><td>${htmlEscape(page.h1 || '')}</td><td>${htmlEscape(page.source_path)}</td><td class="${page.ok ? 'status-ok' : 'status-bad'}">${page.status || ''}</td></tr>`).join('');
  const body = `<div class="grid">
<aside class="panel">
<h2>主控面板</h2>
<p class="small">輸出時間：${htmlEscape(manifest.generated_at)}</p>
<p><a href="reports/site-readiness-report.html">查看可調整準備度</a> · <a href="reports/mirror-validation-report.html">查看驗證報告</a> · <a href="reports/backend-editability-map.html">查看後台限制對照</a> · <a href="reports/product-standardization-report.html">查看產品標準化報告</a> · <a href="reports/product-spec-module-qa.html">查看產品規格詳情 QA</a> · <a href="reports/product-spec-agent-review.html">查看 AI Agent 審核</a> · <a href="reports/asset-usage-report.html">查看資源使用</a> · <a href="reports/deploy-manifest.html">查看上架對照</a> · <a href="reports/local-link-integrity-report.html">查看本機連結檢查</a> · <a href="reports/service-optimization-source-map.html">查看服務優化來源</a> · <a href="optimization-sources/index.html">查看優化來源</a> · <a href="site-manifest.json">查看 JSON</a></p>
<input id="q" placeholder="搜尋 ID、標題、URL">
<select id="type"><option value="">全部頁型</option><option>home</option><option>company-profile</option><option>brand-list</option><option>product-list</option><option>product-category</option><option>product-detail</option><option>service-list</option><option>service-detail</option></select>
<h3>正式網產品分類</h3><div class="tree">${renderCategoryTree(categoryTree)}</div>
</aside>
<section class="panel">
<h2>鏡像頁面</h2>
<p>頁面 ${manifest.summary.pages_total}；公司頁 ${manifest.summary.company_pages || 0}；品牌頁 ${manifest.summary.brand_pages || 0}；產品頁 ${manifest.summary.product_detail_pages}；產品分類/列表 ${manifest.summary.product_listing_pages}；服務頁 ${manifest.summary.service_pages}；排除導覽 ${manifest.summary.skipped_links}；文件連結 ${manifest.summary.document_links}；文件已下載 ${manifest.summary.documents_downloaded || 0}；文件已重用 ${manifest.summary.documents_reused || 0}；文件失敗 ${manifest.summary.documents_failed || 0}。</p>
<table id="pages"><thead><tr><th>頁型</th><th>標題</th><th>H1</th><th>來源路徑</th><th>HTTP</th></tr></thead><tbody>${rows}</tbody></table>
</section></div>
<script>
const q=document.getElementById('q'); const type=document.getElementById('type'); const rows=[...document.querySelectorAll('#pages tbody tr')];
function f(){const s=q.value.toLowerCase(); const t=type.value; rows.forEach(r=>{const ok=(!t||r.dataset.type===t)&&r.textContent.toLowerCase().includes(s); r.style.display=ok?'':'none';});}
q.addEventListener('input',f); type.addEventListener('change',f);
</script>`;
  return pageShell('星泰網站本機鏡像主控面板', body);
}

function renderValidationHtml(validation) {
  const body = `<section class="card"><h2>摘要</h2><table><tbody>${Object.entries(validation.summary).map(([k, v]) => `<tr><th>${htmlEscape(k)}</th><td>${htmlEscape(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`).join('')}</tbody></table></section>
<section class="card"><h2>問題</h2>${validation.issues.length ? `<table><thead><tr><th>等級</th><th>項目</th><th>說明</th></tr></thead><tbody>${validation.issues.map(i => `<tr><td>${htmlEscape(i.level)}</td><td>${htmlEscape(i.item)}</td><td>${htmlEscape(i.message)}</td></tr>`).join('')}</tbody></table>` : '<p class="status-ok">未發現阻塞問題。</p>'}</section>
<section class="card"><h2>文件下載狀態</h2><p>產品頁/服務頁中的同站 PDF、CAD、ZIP 等文件會下載到本機；失敗者保留正式網連結並列入此表。</p><table><thead><tr><th>狀態</th><th>Content-Type</th><th>Bytes</th><th>本機路徑</th><th>URL</th></tr></thead><tbody>${validation.document_links.slice(0, 500).map(d => `<tr><td class="${d.ok ? 'status-ok' : 'status-bad'}">${htmlEscape(d.status || '')}</td><td>${htmlEscape(d.content_type || '')}</td><td>${htmlEscape(d.bytes || d.content_length || '')}</td><td>${htmlEscape(d.local_rel || '')}</td><td>${htmlEscape(d.url)}</td></tr>`).join('')}</tbody></table></section>`;
  return pageShell('本機鏡像驗證報告', body);
}

function validatePreviewFiles(pages, docResults, skippedLinks, assetStats) {
  const issues = [];
  let liveNavigationHrefCount = 0;
  let liveDocumentHrefCount = 0;
  let missingTitleCount = 0;
  let missingH1Count = 0;
  for (const page of pages) {
    if (!page.title) missingTitleCount += 1;
    if (!page.h1 && page.type !== 'home' && page.type !== 'product-list' && page.type !== 'service-list') missingH1Count += 1;
    if (!page.preview_path || !fs.existsSync(page.preview_path)) {
      issues.push({ level: 'error', item: page.url, message: 'preview file missing' });
      continue;
    }
    const html = fs.readFileSync(page.preview_path, 'utf8');
    const hrefs = extractAttrs(html, 'href');
    for (const href of hrefs) {
      const raw = String(href || '').trim();
      const isExplicitFormal = raw.startsWith(baseOrigin);
      const isRootNavigation = raw.startsWith('/products') || raw.startsWith('/services') || raw === '/';
      if (!isExplicitFormal && !isRootNavigation) continue;
      const u = normalizeUrl(raw, page.url);
      if (u && isSameOrigin(u) && !isDocumentUrl(u) && !isRenderAssetUrl(u)) {
        liveNavigationHrefCount += 1;
      }
      if (downloadDocuments && u && isSameOrigin(u) && isDocumentUrl(u)) {
        liveDocumentHrefCount += 1;
      }
    }
    if (/file:\/\/\/|F:\\|C:\\|href\s*=\s*["'][^"']+\.txt(?:[#?][^"']*)?["']|待人工上架|待上架|data-local-file/i.test(html)) {
      issues.push({ level: 'warning', item: page.url, message: 'found local path, .txt href, or internal publishing marker' });
    }
  }
  const failedDocs = docResults.filter(d => !d.ok).length;
  const localDocs = docResults.filter(d => d.ok && d.local_path).length;
  const docBytes = docResults.reduce((sum, d) => sum + Number(d.bytes || 0), 0);
  if (liveNavigationHrefCount) issues.push({ level: 'error', item: 'local navigation', message: `${liveNavigationHrefCount} same-origin navigation hrefs still point to formal site` });
  if (liveDocumentHrefCount) issues.push({ level: 'warning', item: 'local documents', message: `${liveDocumentHrefCount} same-origin document hrefs still point to formal site` });
  if (failedDocs) issues.push({ level: 'warning', item: 'document links', message: `${failedDocs} document links failed status verification` });
  if (assetStats.failed) issues.push({ level: 'warning', item: 'assets', message: `${assetStats.failed} render assets failed to cache` });
  return {
    generated_at: new Date().toISOString(),
    summary: {
      pages_total: pages.length,
      missing_title_count: missingTitleCount,
      missing_h1_count: missingH1Count,
      live_navigation_href_count: liveNavigationHrefCount,
      live_document_href_count: liveDocumentHrefCount,
      skipped_links: skippedLinks.length,
      document_links: docResults.length,
      local_document_links: localDocs,
      document_bytes: docBytes,
      failed_document_links: failedDocs,
      assets_cached: assetStats.cached,
      assets_reused: assetStats.reused,
      assets_failed: assetStats.failed,
      assets_skipped_large: assetStats.skippedLarge
    },
    issues,
    document_links: docResults,
    skipped_links: skippedLinks,
    asset_failures: assetStats.failures,
    large_assets: assetStats.large
  };
}

function outputRelForFile(file) {
  return toPosix(path.relative(outputRoot, path.resolve(file)));
}

function sourceMapByLocalRel(assetStats, documentStats) {
  const out = new Map();
  for (const item of [...assetStats.items, ...documentStats.items]) {
    if (!item || !item.local_rel) continue;
    out.set(item.local_rel, item);
  }
  return out;
}

function shouldIgnoreResourceRef(raw) {
  const value = String(raw || '').trim();
  return !value
    || value.startsWith('#')
    || value.startsWith('/cdn-cgi/l/email-protection')
    || /^data:/i.test(value)
    || /^mailto:/i.test(value)
    || /^tel:/i.test(value)
    || /^javascript:/i.test(value);
}

function localTargetFromRef(raw, baseFile) {
  const value = String(raw || '').trim();
  if (shouldIgnoreResourceRef(value)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (value.startsWith(localFileUrl(outputRoot))) {
      const url = new URL(value);
      return path.resolve(decodeURIComponent(url.pathname.replace(/^\/([A-Za-z]:)/, '$1')));
    }
    return null;
  }
  const noFragment = value.split('#')[0].split('?')[0];
  if (!noFragment) return null;
  if (noFragment.startsWith('/')) return path.resolve(outputRoot, noFragment.replace(/^\/+/, ''));
  return path.resolve(path.dirname(baseFile), noFragment);
}

function addLocalUsage(usageMap, localPath, page, attr, raw) {
  const resolved = path.resolve(localPath);
  const localRel = outputRelForFile(resolved);
  if (!localRel || localRel.startsWith('..')) return;
  if (!usageMap.has(localRel)) {
    usageMap.set(localRel, {
      local_rel: localRel,
      local_path: toPosix(resolved),
      exists: fs.existsSync(resolved),
      bytes: fs.existsSync(resolved) ? fs.statSync(resolved).size : 0,
      usages: []
    });
  }
  usageMap.get(localRel).usages.push({
    page_url: page.url,
    page_source_path: page.source_path,
    page_preview_rel: page.preview_rel,
    attr,
    raw
  });
}

function collectHtmlResourceRefs(html) {
  const refs = [];
  for (const attr of ['href', 'src', 'data-src', 'data-original', 'data-lazy-src', 'data-bg', 'poster']) {
    for (const value of extractAttrs(html, attr)) refs.push({ attr, value });
  }
  const srcsetRe = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
  let m;
  while ((m = srcsetRe.exec(html))) {
    const parts = m[2].split(',').map(part => part.trim()).filter(Boolean);
    for (const part of parts) refs.push({ attr: 'srcset', value: part.split(/\s+/)[0] });
  }
  return refs;
}

function collectCssResourceRefs(css) {
  const refs = [];
  const re = /url\((['"]?)(.*?)\1\)/gi;
  let m;
  while ((m = re.exec(css))) refs.push({ attr: 'css-url', value: m[2].trim() });
  return refs;
}

function classifyLocalResource(localRel, sourceItem) {
  const ext = path.posix.extname(localRel).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext)) return 'image';
  if (['.pdf', '.zip', '.rar', '.7z', '.dwg', '.dxf', '.step', '.stp', '.iges', '.igs', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return 'document';
  if (['.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'render-asset';
  if (sourceItem && isDocumentUrl(new URL(sourceItem.url))) return 'document';
  return 'other';
}

function buildAssetUsageReports(pages, assetStats, documentStats) {
  const usageMap = new Map();
  const linkIssues = [];
  const formalSameOriginRefs = [];
  const sourceByLocalRel = sourceMapByLocalRel(assetStats, documentStats);

  for (const page of pages) {
    const pageFile = path.resolve(page.preview_path);
    if (!fs.existsSync(pageFile)) continue;
    const html = fs.readFileSync(pageFile, 'utf8');
    for (const ref of collectHtmlResourceRefs(html)) {
      const rawValue = String(ref.value || '').trim();
      if (shouldIgnoreResourceRef(rawValue)) continue;
      const normalized = normalizeUrl(rawValue, page.url);
      if ((rawValue.startsWith(baseOrigin) || rawValue.startsWith('/')) && normalized && isSameOrigin(normalized)) {
        formalSameOriginRefs.push({
          page_url: page.url,
          page_preview_rel: page.preview_rel,
          attr: ref.attr,
          url: normalized.href
        });
      }
      const localPath = localTargetFromRef(ref.value, pageFile);
      if (!localPath) continue;
      if (!fs.existsSync(localPath)) {
        linkIssues.push({
          level: 'error',
          type: 'missing-local-resource',
          page_url: page.url,
          page_preview_rel: page.preview_rel,
          attr: ref.attr,
          raw: ref.value,
          expected_local_path: toPosix(localPath)
        });
      }
      addLocalUsage(usageMap, localPath, page, ref.attr, ref.value);
    }
  }

  for (const resource of [...usageMap.values()]) {
    if (!resource.local_rel.endsWith('.css') || !resource.exists) continue;
    const css = fs.readFileSync(resource.local_path, 'utf8');
    const syntheticPage = {
      url: 'local-css:' + resource.local_rel,
      source_path: resource.local_rel,
      preview_rel: resource.local_rel
    };
    for (const ref of collectCssResourceRefs(css)) {
      const localPath = localTargetFromRef(ref.value, resource.local_path);
      if (!localPath) continue;
      if (!fs.existsSync(localPath)) {
        linkIssues.push({
          level: 'error',
          type: 'missing-css-resource',
          page_url: syntheticPage.url,
          page_preview_rel: resource.local_rel,
          attr: ref.attr,
          raw: ref.value,
          expected_local_path: toPosix(localPath)
        });
      }
      addLocalUsage(usageMap, localPath, syntheticPage, ref.attr, ref.value);
    }
  }

  const resources = [...usageMap.values()]
    .map(resource => {
      const sourceItem = sourceByLocalRel.get(resource.local_rel);
      const sourceUrl = sourceItem ? sourceItem.url : '';
      let futureServerPath = '';
      let safeToOverwrite = false;
      let deployMode = 'needs-review';
      if (sourceUrl && sourceUrl.startsWith(baseOrigin)) {
        const u = new URL(sourceUrl);
        futureServerPath = u.pathname.replace(/^\/{2,}/, '/');
        if (futureServerPath.startsWith('/uploads/')) {
          safeToOverwrite = true;
          deployMode = 'same-path-overwrite';
        } else if (futureServerPath.startsWith('/file/download/') || futureServerPath.startsWith('/file/output/')) {
          deployMode = 'backend-managed-download-route';
        } else if (futureServerPath.startsWith('/static/')) {
          deployMode = 'site-static-asset-review';
        } else {
          deployMode = 'needs-review';
        }
      }
      return {
        ...resource,
        category: classifyLocalResource(resource.local_rel, sourceItem),
        source_url: sourceUrl,
        content_type: sourceItem ? sourceItem.content_type || '' : '',
        future_server_path: futureServerPath,
        deploy_mode: deployMode,
        safe_to_overwrite: safeToOverwrite,
        usage_count: resource.usages.length,
        used_by_pages: [...new Set(resource.usages.map(u => u.page_source_path || u.page_preview_rel))].sort()
      };
    })
    .sort((a, b) => a.local_rel.localeCompare(b.local_rel));

  const deployFiles = resources
    .filter(resource => resource.category === 'image' || resource.category === 'document')
    .map(resource => ({
      local_rel: resource.local_rel,
      local_path: resource.local_path,
      source_url: resource.source_url,
      future_server_path: resource.future_server_path,
      deploy_mode: resource.deploy_mode,
      safe_to_overwrite: resource.safe_to_overwrite,
      category: resource.category,
      bytes: resource.bytes,
      usage_count: resource.usage_count,
      used_by_pages: resource.used_by_pages
    }));

  const summary = {
    resources_total: resources.length,
    images: resources.filter(r => r.category === 'image').length,
    documents: resources.filter(r => r.category === 'document').length,
    render_assets: resources.filter(r => r.category === 'render-asset').length,
    other: resources.filter(r => r.category === 'other').length,
    missing_local_resources: linkIssues.filter(i => i.type.includes('missing')).length,
    formal_same_origin_refs: formalSameOriginRefs.length,
    deploy_files: deployFiles.length,
    deploy_safe_to_overwrite: deployFiles.filter(r => r.safe_to_overwrite).length,
    deploy_needs_review: deployFiles.filter(r => !r.safe_to_overwrite).length
  };

  return {
    assetUsageReport: {
      generated_at: new Date().toISOString(),
      summary,
      resources,
      formal_same_origin_refs: formalSameOriginRefs,
      link_issues: linkIssues
    },
    deployManifest: {
      generated_at: new Date().toISOString(),
      policy: {
        purpose: 'Local preview resource inventory for future deployment packaging.',
        overwrite_rule: 'Only files under /uploads/... with safe_to_overwrite=true are candidates for same-path server overwrite. /file/download and /file/output are backend-managed routes and require backend/file-manager handling before deployment. Renamed SEO assets require page/backend link updates before deployment.',
        excluded_actions: ['no backend login', 'no server upload', 'no deletion']
      },
      summary,
      files: deployFiles
    },
    linkIntegrityReport: {
      generated_at: new Date().toISOString(),
      summary: {
        pages_checked: pages.length,
        missing_local_resources: summary.missing_local_resources,
        formal_same_origin_refs: summary.formal_same_origin_refs
      },
      issues: linkIssues,
      formal_same_origin_refs: formalSameOriginRefs
    }
  };
}

function renderSimpleResourceReport(title, summary, rows, columns) {
  const body = `<section class="card"><h2>Summary</h2><table><tbody>${Object.entries(summary).map(([k, v]) => `<tr><th>${htmlEscape(k)}</th><td>${htmlEscape(v)}</td></tr>`).join('')}</tbody></table></section>
<section class="card"><h2>Rows</h2><table><thead><tr>${columns.map(c => `<th>${htmlEscape(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${htmlEscape(c.value(row))}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
  return pageShell(title, body);
}

function writeDeployModePackages(deployManifest) {
  const packageRoot = path.join(outputRoot, 'deploy-packages');
  ensureDir(packageRoot);
  const modes = ['same-path-overwrite', 'backend-managed-download-route', 'site-static-asset-review', 'needs-review'];
  const outputs = [];
  for (const mode of modes) {
    const files = deployManifest.files.filter(file => file.deploy_mode === mode);
    const dir = path.join(packageRoot, mode);
    ensureDir(dir);
    const manifest = {
      generated_at: new Date().toISOString(),
      deploy_mode: mode,
      file_count: files.length,
      bytes: files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
      files
    };
    writeJson(path.join(dir, 'manifest.json'), manifest);
    writeText(path.join(dir, 'README.md'), [
      `# ${mode}`,
      '',
      `file_count: ${manifest.file_count}`,
      `bytes: ${manifest.bytes}`,
      '',
      mode === 'same-path-overwrite'
        ? 'These files are under /uploads/... and are candidates for same-path overwrite after local optimization and final review.'
        : mode === 'backend-managed-download-route'
          ? 'These files are reached through /file/download or /file/output routes. Treat them as backend/file-manager controlled, not raw server overwrite targets.'
          : mode === 'site-static-asset-review'
            ? 'These are site static assets such as logo or favicon. Review separately before replacing.'
            : 'These files need manual classification before deployment.',
      '',
      'See manifest.json for exact paths and usage.'
    ].join('\n'));
    outputs.push({
      deploy_mode: mode,
      file_count: manifest.file_count,
      bytes: manifest.bytes,
      manifest_rel: toPosix(path.relative(outputRoot, path.join(dir, 'manifest.json')))
    });
  }
  return {
    generated_at: new Date().toISOString(),
    package_root: toPosix(packageRoot),
    outputs
  };
}

function buildReadinessReport(manifest, validation, assetUsageReport, deployManifest, linkIntegrityReport, deployPackages) {
  const gates = [
    {
      name: 'local-pages-built',
      status: manifest.summary.pages_total >= 350 ? 'pass' : 'review',
      evidence: `${manifest.summary.pages_total} pages built`
    },
    {
      name: 'local-resource-links',
      status: linkIntegrityReport.summary.missing_local_resources === 0 ? 'pass' : 'fail',
      evidence: `${linkIntegrityReport.summary.missing_local_resources} missing local resources`
    },
    {
      name: 'formal-site-internal-residue',
      status: linkIntegrityReport.summary.formal_same_origin_refs === 0 ? 'pass' : 'review',
      evidence: `${linkIntegrityReport.summary.formal_same_origin_refs} same-origin formal refs remain`
    },
    {
      name: 'document-cache',
      status: validation.summary.failed_document_links === 0 && validation.summary.local_document_links === validation.summary.document_links ? 'pass' : 'review',
      evidence: `${validation.summary.local_document_links}/${validation.summary.document_links} documents local; ${validation.summary.failed_document_links} failed`
    },
    {
      name: 'render-asset-cache',
      status: validation.summary.assets_failed === 0 ? 'pass' : 'review',
      evidence: `${validation.summary.assets_failed} render assets failed; local placeholders used where applicable`
    },
    {
      name: 'deploy-manifest',
      status: deployManifest.summary.deploy_files > 0 ? 'pass' : 'fail',
      evidence: `${deployManifest.summary.deploy_files} deploy files; ${deployManifest.summary.deploy_safe_to_overwrite} same-path overwrite candidates`
    }
  ];
  return {
    generated_at: new Date().toISOString(),
    status: gates.every(g => g.status === 'pass') ? 'ready' : gates.some(g => g.status === 'fail') ? 'blocked' : 'ready-with-known-warnings',
    summary: {
      pages_total: manifest.summary.pages_total,
      local_resources: assetUsageReport.summary.resources_total,
      missing_local_resources: linkIntegrityReport.summary.missing_local_resources,
      formal_same_origin_refs: linkIntegrityReport.summary.formal_same_origin_refs,
      document_links: validation.summary.document_links,
      failed_document_links: validation.summary.failed_document_links,
      render_assets_failed: validation.summary.assets_failed,
      deploy_files: deployManifest.summary.deploy_files,
      same_path_overwrite_candidates: deployManifest.summary.deploy_safe_to_overwrite,
      deploy_needs_review: deployManifest.summary.deploy_needs_review
    },
    gates,
    deploy_packages: deployPackages,
    known_warnings: validation.asset_failures.map(item => ({
      type: 'formal-source-asset-404',
      url: item.url,
      status: item.status,
      note: 'Local preview uses a placeholder; fix source image during content optimization.'
    })),
    next_actions: [
      'Use the local preview as the editing baseline.',
      'For image compression without URL changes, work from deploy-packages/same-path-overwrite/manifest.json.',
      'For SEO renaming, create new target paths and update page/backend links before deployment.',
      'Handle backend-managed-download-route files through backend/file-manager workflows instead of raw server overwrite.'
    ]
  };
}

function renderReadinessHtml(report) {
  const gateRows = report.gates.map(gate => `<tr><td>${htmlEscape(gate.name)}</td><td class="${gate.status === 'pass' ? 'status-ok' : gate.status === 'fail' ? 'status-bad' : 'status-warn'}">${htmlEscape(gate.status)}</td><td>${htmlEscape(gate.evidence)}</td></tr>`).join('');
  const packageRows = report.deploy_packages.outputs.map(pkg => `<tr><td>${htmlEscape(pkg.deploy_mode)}</td><td>${htmlEscape(pkg.file_count)}</td><td>${htmlEscape(pkg.bytes)}</td><td><a href="../${attrEscape(pkg.manifest_rel)}">${htmlEscape(pkg.manifest_rel)}</a></td></tr>`).join('');
  const warningRows = report.known_warnings.map(w => `<tr><td>${htmlEscape(w.type)}</td><td>${htmlEscape(w.status)}</td><td>${htmlEscape(w.url)}</td><td>${htmlEscape(w.note)}</td></tr>`).join('');
  const body = `<section class="card"><h2>Status: ${htmlEscape(report.status)}</h2><table><tbody>${Object.entries(report.summary).map(([k, v]) => `<tr><th>${htmlEscape(k)}</th><td>${htmlEscape(v)}</td></tr>`).join('')}</tbody></table></section>
<section class="card"><h2>Readiness gates</h2><table><thead><tr><th>Gate</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${gateRows}</tbody></table></section>
<section class="card"><h2>Deploy packages</h2><table><thead><tr><th>Mode</th><th>Files</th><th>Bytes</th><th>Manifest</th></tr></thead><tbody>${packageRows}</tbody></table></section>
<section class="card"><h2>Known warnings</h2>${warningRows ? `<table><thead><tr><th>Type</th><th>Status</th><th>URL</th><th>Note</th></tr></thead><tbody>${warningRows}</tbody></table>` : '<p class="status-ok">No known warnings.</p>'}</section>`;
  return pageShell('Site mirror readiness report', body);
}

async function main() {
  ensureDir(outputRoot);
  ensureDir(rawRoot);
  ensureDir(previewRoot);
  ensureDir(assetRoot);
  ensureDir(documentRoot);
  ensureDir(reportRoot);

  const previous = readJson(previousProductManifestPath);
  const productPages = previous.pages.filter(p => p.source_site === 'formal');
  const categoryIds = extractCategoryIdsFromProducts(productPages);
  let categoryTree = buildCategoryTree(productPages);

  const queue = [];
  const queued = new Set();
  function enqueue(urlLike) {
    const url = normalizeUrl(urlLike, baseOrigin + '/');
    if (!url || !isIncludedPage(url) || isDocumentUrl(url) || isSkippedPage(url)) return;
    const key = canonicalUrl(url);
    if (queued.has(key) || queued.size >= maxPages) return;
    queued.add(key);
    queue.push(url);
  }

  enqueue('/');
  enqueue('/company');
  enqueue('/brands');
  enqueue('/products');
  enqueue('/services');
  for (const page of productPages) enqueue(page.url);
  for (const id of categoryIds) enqueue(`/products/category/${id}`);

  const fetched = new Map();
  const skipped = new Map();
  let cursor = 0;
  while (cursor < queue.length) {
    const url = queue[cursor++];
    const key = canonicalUrl(url);
    process.stdout.write(`[fetch ${cursor}/${queue.length}] ${url.pathname}${url.search}\n`);
    try {
      const res = await fetchWithTimeout(url.href);
      const buf = Buffer.from(await res.arrayBuffer());
      const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
      const rawPath = rawPathForUrl(url);
      writeText(rawPath, html);
      fetched.set(key, {
        url: key,
        final_url: res.url,
        source_path: url.pathname + url.search,
        type: pageType(url),
        status: res.status,
        ok: res.ok,
        content_type: res.headers.get('content-type') || '',
        bytes: buf.length,
        raw_path: toPosix(rawPath),
        preview_path: toPosix(previewPathForUrl(url)),
        title: extractTitle(html),
        h1: extractH1(html)
      });
      for (const link of extractLinks(html, url.href)) {
        if (!isSameOrigin(link)) continue;
        if (isDocumentUrl(link)) continue;
        if (isSkippedPage(link)) {
          skipped.set(canonicalUrl(link), { url: canonicalUrl(link), source: key, reason: 'excluded section' });
          continue;
        }
        if (isIncludedPage(link)) enqueue(link.href);
      }
    } catch (err) {
      fetched.set(key, {
        url: key,
        source_path: url.pathname + url.search,
        type: pageType(url),
        status: null,
        ok: false,
        error: String(err && err.message || err),
        raw_path: toPosix(rawPathForUrl(url)),
        preview_path: toPosix(previewPathForUrl(url)),
        title: '',
        h1: ''
      });
    }
  }

  const pageMap = new Map();
  for (const [key, page] of fetched) pageMap.set(key, path.resolve(page.preview_path));
  const firstProductDetail = [...fetched.values()].find(p => p.type === 'product-detail' && fs.existsSync(path.resolve(p.raw_path)));
  if (firstProductDetail) {
    const sideTree = extractProductSideCategoryTree(fs.readFileSync(path.resolve(firstProductDetail.raw_path), 'utf8'), productPages);
    if (sideTree.length) categoryTree = sideTree;
  }
  const stubMap = new Map();
  const documentLinks = new Set();
  const assetStats = { cached: 0, reused: 0, failed: 0, skippedLarge: 0, bytes: 0, items: [], failures: [], large: [], byUrl: new Map() };
  const documentStats = { downloaded: 0, reused: 0, failed: 0, skippedLarge: 0, bytes: 0, items: [], failures: [], large: [], byUrl: new Map() };

  const pages = [];
  let rewriteIndex = 0;
  for (const [key, page] of fetched) {
    rewriteIndex += 1;
    process.stdout.write(`[rewrite ${rewriteIndex}/${fetched.size}] ${page.source_path}\n`);
    const rawPath = path.resolve(page.raw_path);
    const previewPath = path.resolve(page.preview_path);
    if (!fs.existsSync(rawPath)) continue;
    const html = fs.readFileSync(rawPath, 'utf8');
    const rewritten = await rewriteHtml(html, page.url, previewPath, pageMap, stubMap, documentLinks, assetStats, documentStats);
    writeText(previewPath, rewritten);
    pages.push({
      ...page,
      preview_path: toPosix(previewPath),
      preview_rel: toPosix(path.relative(outputRoot, previewPath))
    });
  }

  const productOverlay = applyProductStandardizationOverlay();
  const productSpecModuleQa = validateProductSpecModules();
  const productSpecAgentReview = generateProductSpecAgentReview();

  const skippedLinks = [...skipped.values()].map(item => {
    const u = normalizeUrl(item.url);
    const stub = u ? createSkippedStub(u, stubMap) : '';
    return { ...item, stub_path: toPosix(stub), stub_rel: toPosix(path.relative(outputRoot, stub)) };
  });

  const docUrls = [...documentLinks].sort();
  const docResults = [];
  if (downloadDocuments) {
    for (const url of docUrls) {
      const result = documentStats.byUrl.get(url);
      if (result) docResults.push(result);
      else docResults.push(await checkDocumentLink(url));
    }
  } else {
    for (let i = 0; i < docUrls.length; i += 1) {
      if ((i + 1) % 25 === 0 || i === 0) process.stdout.write(`[doc-check ${i + 1}/${docUrls.length}]\n`);
      docResults.push(await checkDocumentLink(docUrls[i]));
    }
  }

  const resourceReports = buildAssetUsageReports(pages, assetStats, documentStats);

  const summary = {
    pages_total: pages.length,
    company_pages: pages.filter(p => p.type === 'company-profile' || p.type === 'company-other').length,
    brand_pages: pages.filter(p => p.type === 'brand-list' || p.type === 'brand-other').length,
    product_detail_pages: pages.filter(p => p.type === 'product-detail').length,
    product_listing_pages: pages.filter(p => p.type === 'product-list' || p.type === 'product-category' || p.type === 'product-other').length,
    service_pages: pages.filter(p => p.type.startsWith('service')).length,
    skipped_links: skippedLinks.length,
    document_links: docResults.length,
    documents_downloaded: documentStats.downloaded,
    documents_reused: documentStats.reused,
    documents_failed: documentStats.failed,
    document_bytes: documentStats.bytes,
    assets_cached: assetStats.cached,
    assets_failed: assetStats.failed,
    local_resources: resourceReports.assetUsageReport.summary.resources_total,
    local_resource_missing: resourceReports.linkIntegrityReport.summary.missing_local_resources,
    formal_same_origin_refs: resourceReports.linkIntegrityReport.summary.formal_same_origin_refs,
    deploy_files: resourceReports.deployManifest.summary.deploy_files,
    deploy_safe_to_overwrite: resourceReports.deployManifest.summary.deploy_safe_to_overwrite,
    deploy_needs_review: resourceReports.deployManifest.summary.deploy_needs_review,
    output_root: toPosix(outputRoot)
  };

  const manifest = {
    generated_at: new Date().toISOString(),
    source: baseOrigin,
    scope: {
      included: ['home', 'company profile', 'brands', 'products', 'product categories', 'product details', 'services'],
      excluded: ['download center', 'recruiting', 'technical articles', 'video links', 'contact', 'FAQ'],
      document_policy: downloadDocuments ? 'download same-origin PDF/CAD/ZIP/documents referenced by included pages; excluded sections remain skipped' : 'verify links only; do not download PDF/CAD/ZIP documents'
    },
    summary,
    product_category_tree: categoryTree,
    pages,
    skipped_links: skippedLinks,
    resource_summary: resourceReports.assetUsageReport.summary,
    asset_summary: assetStats,
    document_summary: {
      downloaded: documentStats.downloaded,
      reused: documentStats.reused,
      failed: documentStats.failed,
      skippedLarge: documentStats.skippedLarge,
      bytes: documentStats.bytes,
      items: documentStats.items,
      failures: documentStats.failures,
      large: documentStats.large
    }
  };

  writeJson(path.join(outputRoot, 'site-manifest.json'), manifest);
  writeJson(path.join(outputRoot, 'asset-usage-report.json'), resourceReports.assetUsageReport);
  writeJson(path.join(outputRoot, 'deploy-manifest.json'), resourceReports.deployManifest);
  writeJson(path.join(outputRoot, 'local-link-integrity-report.json'), resourceReports.linkIntegrityReport);
  writeJson(path.join(reportRoot, 'asset-usage-report.json'), resourceReports.assetUsageReport);
  writeJson(path.join(reportRoot, 'deploy-manifest.json'), resourceReports.deployManifest);
  writeJson(path.join(reportRoot, 'local-link-integrity-report.json'), resourceReports.linkIntegrityReport);
  writeText(path.join(reportRoot, 'asset-usage-report.html'), renderSimpleResourceReport(
    'Asset usage report',
    resourceReports.assetUsageReport.summary,
    resourceReports.assetUsageReport.resources,
    [
      { label: 'category', value: r => r.category },
      { label: 'local file', value: r => r.local_rel },
      { label: 'source url', value: r => r.source_url },
      { label: 'bytes', value: r => r.bytes },
      { label: 'usage', value: r => r.usage_count },
      { label: 'future server path', value: r => r.future_server_path },
      { label: 'safe overwrite', value: r => r.safe_to_overwrite }
    ]
  ));
  writeText(path.join(reportRoot, 'deploy-manifest.html'), renderSimpleResourceReport(
    'Deploy manifest',
    resourceReports.deployManifest.summary,
    resourceReports.deployManifest.files,
    [
      { label: 'category', value: r => r.category },
      { label: 'future server path', value: r => r.future_server_path },
      { label: 'local file', value: r => r.local_rel },
      { label: 'bytes', value: r => r.bytes },
      { label: 'usage', value: r => r.usage_count },
      { label: 'deploy mode', value: r => r.deploy_mode },
      { label: 'safe overwrite', value: r => r.safe_to_overwrite }
    ]
  ));
  writeText(path.join(reportRoot, 'local-link-integrity-report.html'), renderSimpleResourceReport(
    'Local link integrity report',
    resourceReports.linkIntegrityReport.summary,
    [...resourceReports.linkIntegrityReport.issues, ...resourceReports.linkIntegrityReport.formal_same_origin_refs.map(item => ({ ...item, type: 'formal-same-origin-ref' }))],
    [
      { label: 'type', value: r => r.type || '' },
      { label: 'page', value: r => r.page_preview_rel || r.page_url || '' },
      { label: 'attr', value: r => r.attr || '' },
      { label: 'raw/url', value: r => r.raw || r.url || '' },
      { label: 'expected local path', value: r => r.expected_local_path || '' }
    ]
  ));
  const backendMap = backendEditabilityMap();
  writeJson(path.join(outputRoot, 'backend-editability-map.json'), backendMap);
  writeText(path.join(reportRoot, 'backend-editability-map.html'), renderBackendMapHtml(backendMap));

  const validation = validatePreviewFiles(pages, docResults, skippedLinks, assetStats);
  writeJson(path.join(outputRoot, 'mirror-validation-report.json'), validation);
  writeJson(path.join(reportRoot, 'mirror-validation-report.json'), validation);
  writeText(path.join(reportRoot, 'mirror-validation-report.html'), renderValidationHtml(validation));
  const deployPackages = writeDeployModePackages(resourceReports.deployManifest);
  const readiness = buildReadinessReport(manifest, validation, resourceReports.assetUsageReport, resourceReports.deployManifest, resourceReports.linkIntegrityReport, deployPackages);
  writeJson(path.join(outputRoot, 'site-readiness-report.json'), readiness);
  writeJson(path.join(reportRoot, 'site-readiness-report.json'), readiness);
  writeText(path.join(reportRoot, 'site-readiness-report.html'), renderReadinessHtml(readiness));
  writeText(path.join(outputRoot, 'index.html'), renderIndex(manifest, categoryTree, validation));
  const serviceOverlay = applyServicePreviewOverlay();

  process.stdout.write(JSON.stringify({
    output_root: toPosix(outputRoot),
    index: toPosix(path.join(outputRoot, 'index.html')),
    index_file_url: localFileUrl(path.join(outputRoot, 'index.html')),
    summary,
    validation_summary: validation.summary,
    readiness_status: readiness.status,
    issue_count: validation.issues.length,
    product_overlay: productOverlay,
    product_spec_module_qa: productSpecModuleQa,
    product_spec_agent_review: productSpecAgentReview,
    service_overlay: serviceOverlay
  }, null, 2) + '\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
