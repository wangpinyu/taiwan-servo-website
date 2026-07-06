import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const dryRun = process.argv.includes('--dry-run');
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const pages = [
  {
    id: '102',
    title: 'JVL 整合型伺服馬達及步進馬達',
    intro: '此頁以既有星泰型錄文件作為公開文件入口，供整合型伺服馬達、步進馬達與周邊模組選型前查閱。',
    rows: [
      {
        item: 'JVL 整合型伺服與步進馬達',
        type: 'PDF 型錄',
        href: '../../../documents-cache/e9ee0dbc9035-JVL-E6-95-B4-E5-90-88-E5-9E-8B-E4-BC-BA-E6-9C-8D-E6-AD-A5-E9-80-B2-E9-A6-AC-E9-81-94.pdf',
        label: 'JVL 整合型伺服 / 步進馬達型錄',
      },
    ],
  },
  {
    id: '149',
    title: 'Thomson 減速機',
    intro: '此頁以既有 Thomson 減速機型錄文件作為公開文件入口，供減速機選型與應用確認前查閱。',
    rows: [
      {
        item: 'Thomson 減速機',
        type: 'PDF 型錄',
        href: '../../../documents-cache/8847506e2914-Thomson-E6-B8-9B-E9-80-9F-E6-A9-9F.pdf',
        label: 'Thomson 減速機型錄',
      },
    ],
  },
  {
    id: '194',
    title: '山洋電氣 SANUPS 電源系統',
    intro: '此頁提供 SANYO DENKI 官方公開型錄入口，供 SANUPS 電源系統產品選型與規格確認前查閱。',
    rows: [
      {
        item: 'SANUPS 電源系統',
        type: '官方 PDF 型錄',
        href: 'https://publish.sanyodenki.com/library/books/product_information_E/book/data/product_information_E.pdf',
        label: 'SANYO DENKI Product Information',
      },
    ],
  },
  {
    id: '195',
    title: '山洋電氣 SANMOTION 伺服系統',
    intro: '此頁提供 SANYO DENKI 官方公開型錄入口，供 SANMOTION 伺服系統產品選型與規格確認前查閱。',
    rows: [
      {
        item: 'SANMOTION 伺服系統',
        type: '官方 PDF 型錄',
        href: 'https://publish.sanyodenki.com/library/books/SANMOTION_R_3E_E/book/data/SANMOTION_R_3E_E.pdf',
        label: 'SANMOTION R 3E 型錄',
      },
    ],
  },
  {
    id: '270',
    title: '山洋電氣 SANYO DENKI 馬達相關',
    intro: '此頁提供 SANYO DENKI 官方公開型錄入口，供伺服馬達與驅動相關產品選型與規格確認前查閱。',
    rows: [
      {
        item: 'SANYO DENKI 馬達相關產品',
        type: '官方 PDF 型錄',
        href: 'https://publish.sanyodenki.com/library/books/SANMOTION_R_3E_E/book/data/SANMOTION_R_3E_E.pdf',
        label: 'SANMOTION R 3E 型錄',
      },
    ],
  },
];

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRows(page) {
  return page.rows.map((row) => `
            <tr>
              <th scope="row">${htmlEscape(row.item)}</th>
              <td>${htmlEscape(row.type)}</td>
              <td><a class="st-doc-link" href="${htmlEscape(row.href)}" target="_blank" rel="noopener" aria-label="開啟 ${htmlEscape(row.label)}">${htmlEscape(row.label)}</a></td>
              <td><a class="st-quote-link" href="${inquiryHref}" aria-label="詢問 ${htmlEscape(page.title)} ${htmlEscape(row.item)} 規格">詢問規格 / Quote</a></td>
            </tr>`).join('');
}

function buildBlock(page) {
  return `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-doc-specs{--st-green:#008f45;--st-deep:#234734;--st-soft:#f6fbf7;--st-line:#d9e8dd;--st-text:#122033;margin:48px 0 60px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-text);line-height:1.7}
.st-doc-specs *{box-sizing:border-box}
.st-doc-title{margin:0 0 18px;padding-left:14px;border-left:5px solid var(--st-green);font-size:28px;line-height:1.3;color:var(--st-deep);font-weight:800}
.st-doc-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:var(--st-soft);font-size:15px;color:#405361}
.st-doc-detail{border:1px solid var(--st-line);border-radius:10px;background:#fff;overflow:hidden}
.st-doc-detail summary{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;list-style:none;padding:16px 18px;border-bottom:1px solid var(--st-line);font-size:20px;font-weight:800;color:var(--st-deep)}
.st-doc-detail summary::-webkit-details-marker{display:none}
.st-doc-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:88px;padding:6px 12px;border-radius:999px;background:var(--st-green);color:#fff;font-size:14px;font-weight:700}
.st-doc-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.st-doc-table{width:100%;min-width:720px;border-collapse:collapse;font-size:15px}
.st-doc-table th,.st-doc-table td{padding:14px 12px;border-bottom:1px solid var(--st-line);vertical-align:middle;text-align:left}
.st-doc-table thead th{position:sticky;top:0;background:#eaf5ee;color:var(--st-deep);font-weight:800}
.st-doc-table tbody th{position:sticky;left:0;background:#fff;color:var(--st-deep);font-weight:800}
.st-doc-link,.st-quote-link{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 13px;border-radius:7px;text-decoration:none;font-weight:800}
.st-doc-link{background:#0f7faa;color:#fff}
.st-quote-link{background:var(--st-green);color:#fff}
.st-doc-note{margin:14px 18px 18px;color:#445765;font-size:14px}
@media(max-width:640px){.st-doc-title{font-size:24px}.st-doc-detail summary{align-items:flex-start;flex-direction:column}.st-doc-table{font-size:14px}}
</style>
<section class="st-doc-specs" aria-labelledby="st-doc-title-${htmlEscape(page.id)}">
  <h2 class="st-doc-title" id="st-doc-title-${htmlEscape(page.id)}">產品規格詳情</h2>
  <p class="st-doc-lead">${htmlEscape(page.intro)}</p>
  <details class="st-doc-detail" open>
    <summary>
      <span>官方文件入口</span>
      <span class="st-doc-toggle" aria-hidden="true">展開 / 收合</span>
    </summary>
    <div class="st-doc-table-wrap" role="region" aria-label="${htmlEscape(page.title)} 官方文件表格">
      <table class="st-doc-table">
        <thead>
          <tr>
            <th scope="col">資料項目</th>
            <th scope="col">文件類型</th>
            <th scope="col">文件連結</th>
            <th scope="col">詢問</th>
          </tr>
        </thead>
        <tbody>${buildRows(page)}
        </tbody>
      </table>
    </div>
    <p class="st-doc-note">若需確認可供應型號、交期或應用條件，請提供使用環境、安裝條件與控制需求，由星泰協助比對。</p>
  </details>
</section>
</div>
<!-- standardized-spec-module:end -->`;
}

function replaceStandardizedBlock(html, block) {
  const re = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
  if (!re.test(html)) throw new Error('standardized spec block not found');
  return html.replace(re, block);
}

const results = [];
for (const page of pages) {
  const file = path.join(root, 'preview', 'products', 'detail', `${page.id}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const next = replaceStandardizedBlock(html, buildBlock(page));
  if (!dryRun && next !== html) fs.writeFileSync(file, next, 'utf8');
  results.push({
    id: page.id,
    status: next === html ? 'unchanged' : dryRun ? 'would-update' : 'updated',
    rows: page.rows.length,
  });
}

console.log(JSON.stringify({
  status: 'ok',
  dryRun,
  updated: results.filter((result) => result.status === 'updated' || result.status === 'would-update').length,
  results,
}, null, 2));
