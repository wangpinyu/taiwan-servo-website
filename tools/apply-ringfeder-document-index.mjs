import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const dryRun = process.argv.includes('--dry-run');

const targetIds = ['208', '209', '210', '211', '212', '213', '215', '335', '336'];
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function attr(attrs, name) {
  const re = new RegExp(`\\s${name}=([\"'])(.*?)\\1`, 'i');
  return attrs.match(re)?.[2] || '';
}

function anchors(html) {
  return [...String(html || '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[1] || '', 'href'),
    text: stripTags(match[2] || ''),
    tag: match[0],
  }));
}

function h1Text(html) {
  return stripTags(String(html || '').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
}

function seriesFromUrl(href) {
  try {
    const url = new URL(href);
    const parts = url.pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || parts[parts.length - 2] || '';
    return slug
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  } catch {
    return '';
  }
}

function collectRingfederLinks(html) {
  const seen = new Set();
  return anchors(html)
    .filter((anchor) => /^https:\/\/www\.ringfeder\.com\/products\//i.test(anchor.href))
    .map((anchor) => ({
      href: anchor.href,
      series: seriesFromUrl(anchor.href),
    }))
    .filter((row) => row.href && row.series && !seen.has(row.href) && seen.add(row.href));
}

function buildBlock({ id, title, rows }) {
  const rowHtml = rows.map((row) => `
              <tr>
                <th scope="row">${htmlEscape(row.series)}</th>
                <td>PDF / CAD / 技術資料</td>
                <td><a class="st-ring-doc-link" href="${htmlEscape(row.href)}" target="_blank" rel="noopener" aria-label="開啟 RINGFEDER ${htmlEscape(row.series)} 原廠下載頁">原廠 PDF / CAD 下載</a></td>
                <td><a class="st-ring-quote-link" href="${inquiryHref}" aria-label="詢問 ${htmlEscape(title)} ${htmlEscape(row.series)} 選型">請洽星泰</a></td>
              </tr>`).join('');

  return `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-ring-specs{--st-green:#008f45;--st-deep:#234734;--st-soft:#f6fbf7;--st-line:#d9e8dd;--st-text:#122033;margin:48px 0 60px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-text);line-height:1.7}
.st-ring-specs *{box-sizing:border-box}
.st-ring-title{margin:0 0 18px;padding-left:14px;border-left:5px solid var(--st-green);font-size:28px;line-height:1.3;color:var(--st-deep);font-weight:800}
.st-ring-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:var(--st-soft);font-size:15px;color:#405361}
.st-ring-detail{border:1px solid var(--st-line);border-radius:10px;background:#fff;overflow:hidden}
.st-ring-detail summary{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;list-style:none;padding:16px 18px;border-bottom:1px solid var(--st-line);font-size:20px;font-weight:800;color:var(--st-deep)}
.st-ring-detail summary::-webkit-details-marker{display:none}
.st-ring-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:86px;padding:6px 12px;border-radius:999px;background:var(--st-green);color:#fff;font-size:14px;font-weight:700}
.st-ring-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.st-ring-table{width:100%;min-width:760px;border-collapse:collapse;font-size:15px}
.st-ring-table th,.st-ring-table td{padding:14px 12px;border-bottom:1px solid var(--st-line);vertical-align:middle;text-align:left}
.st-ring-table thead th{position:sticky;top:0;background:#eaf5ee;color:var(--st-deep);font-weight:800}
.st-ring-table tbody th{position:sticky;left:0;background:#fff;color:var(--st-deep);font-weight:800}
.st-ring-doc-link,.st-ring-quote-link{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 13px;border-radius:7px;text-decoration:none;font-weight:800}
.st-ring-doc-link{background:#0f7faa;color:#fff}
.st-ring-quote-link{background:var(--st-green);color:#fff}
.st-ring-note{margin:14px 18px 18px;color:#445765;font-size:14px}
@media(max-width:640px){.st-ring-title{font-size:24px}.st-ring-detail summary{align-items:flex-start;flex-direction:column}.st-ring-table{font-size:14px}}
</style>
<section class="st-ring-specs" aria-labelledby="st-ring-title-${id}">
  <h3 class="st-ring-title" id="st-ring-title-${id}">產品規格詳情</h3>
  <p class="st-ring-lead">本區彙整頁面中各 RINGFEDER 系列的官方技術資料入口，方便快速開啟原廠 PDF、CAD 與選型文件。實際選型請提供安裝尺寸、扭矩、轉速與使用環境，由星泰協助確認。</p>
  <details class="st-ring-detail" open>
    <summary>
      <span>官方文件索引</span>
      <span class="st-ring-toggle" aria-hidden="true">展開 / 收合</span>
    </summary>
    <div class="st-ring-table-wrap" role="region" aria-label="${htmlEscape(title)} 官方文件索引表">
      <table class="st-ring-table">
        <thead>
          <tr>
            <th scope="col">系列</th>
            <th scope="col">文件類型</th>
            <th scope="col">原廠資料入口</th>
            <th scope="col">詢問</th>
          </tr>
        </thead>
        <tbody>${rowHtml}
        </tbody>
      </table>
    </div>
    <p class="st-ring-note">表格入口連至 RINGFEDER 官方產品下載區；若需要台灣供應、替代型號或安裝條件判斷，請直接詢問星泰。</p>
  </details>
</section>
</div>
<!-- standardized-spec-module:end -->`;
}

function replaceOrInsert(html, block) {
  const re = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
  if (re.test(html)) return html.replace(re, block);
  const appHeading = html.search(/<h[23]\b[^>]*>\s*應用領域\s*<\/h[23]>/i);
  if (appHeading >= 0) return `${html.slice(0, appHeading)}${block}\n${html.slice(appHeading)}`;
  return html.replace(/<\/main>/i, `${block}\n</main>`);
}

const results = [];
for (const id of targetIds) {
  const file = path.join(root, 'preview', 'products', 'detail', `${id}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const rows = collectRingfederLinks(html);
  const title = h1Text(html) || `RINGFEDER ${id}`;
  if (!rows.length) {
    results.push({ id, status: 'skipped-no-official-links' });
    continue;
  }
  const next = replaceOrInsert(html, buildBlock({ id, title, rows }));
  if (!dryRun && next !== html) fs.writeFileSync(file, next, 'utf8');
  results.push({ id, status: next === html ? 'unchanged' : dryRun ? 'would-update' : 'updated', links: rows.length });
}

console.log(JSON.stringify({
  status: 'ok',
  dryRun,
  updated: results.filter((r) => r.status === 'updated' || r.status === 'would-update').length,
  results,
}, null, 2));
