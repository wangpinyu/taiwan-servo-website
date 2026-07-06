import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const modules = [
  {
    productId: '194',
    code: 'SANUPS',
    title: 'SANUPS 電源系統',
    description:
      'SANYO DENKI SANUPS 涵蓋電源調節器、UPS、逆變器與電源管理產品，適用於設備備援、電力穩定與再生能源系統。',
    sourceNote:
      '資料來源：SANYO DENKI SANUPS 產品頁、SANUPS Download / Manual 頁與 SANYO DENKI Catalog Site。部分文件需依原廠網站登入或申請條件取得。',
    links: [
      ['SANUPS 產品頁', 'https://products.sanyodenki.com/en/sanups/'],
      ['SANUPS Download / Manual', 'https://products.sanyodenki.com/info/download/en/sanups/'],
      ['SANYO DENKI Catalog Site', 'https://publish.sanyodenki.com/library/site/en/book-lists/'],
    ],
    columns: ['產品類型', '系列 / 文件範圍', '原廠公開重點', '文件入口'],
    rows: [
      [
        'Power Conditioner',
        'Photovoltaic / Wind / Hydro / Renewable Energy Systems',
        '原廠分類列於 SANUPS Power Conditioner，用於再生能源與電力轉換應用。',
        'SANUPS 產品頁',
      ],
      [
        'UPS - Hybrid',
        'E11A / E11A-Li / E11B / E11B-Li',
        'Hybrid UPS 系列，依原廠頁面與手冊入口區分不同電池與容量版本。',
        'SANUPS Download / Manual',
      ],
      [
        'UPS - Double Conversion Online',
        'A11K / A11K-Li / A11M / A11M-Li / A13A / A13A-Li / A11N / A11N-Li / A11J / A23C / A23D / RMA',
        'Double Conversion Online UPS 系列，原廠依容量、輸入輸出條件與電池類型分列文件。',
        'SANUPS Download / Manual / Catalog Site',
      ],
      [
        'Power Management Products',
        'SANUPS SOFTWARE / STANDALONE / LAN Interface Card / IT Monitor',
        '原廠提供 UPS 監控、網路介面與管理軟體相關文件入口。',
        'SANUPS Download / Manual',
      ],
      [
        'Inverter',
        'SANUPS DA',
        '原廠 Download / Manual 頁列有 SANUPS DA inverter 文件入口。',
        'SANUPS Download / Manual',
      ],
    ],
  },
  {
    productId: '195',
    code: 'SANMOTION',
    title: 'SANMOTION 伺服與運動控制系統',
    description:
      'SANYO DENKI SANMOTION 包含 AC 伺服、DC 伺服、步進系統、運動控制器與相關軟體文件，適合精密運動控制與設備自動化應用。',
    sourceNote:
      '資料來源：SANYO DENKI SANMOTION 產品頁、SANMOTION Catalogs 與 SANMOTION Manuals。頁面保留原廠分類，不補寫未公開規格。',
    links: [
      ['SANMOTION 產品頁', 'https://products.sanyodenki.com/en/sanmotion/'],
      ['SANMOTION Catalogs', 'https://sanyodenki.com/america/products/sanmotion/catalogs.html'],
      ['SANMOTION Manuals', 'https://products.sanyodenki.com/info/download/en/sanmotion/manuals/'],
    ],
    columns: ['產品類型', '系列 / 型號範圍', '原廠公開重點', '文件入口'],
    rows: [
      [
        'AC Servo Systems',
        'SANMOTION G / R / S / Linear Servo Systems',
        '原廠 SANMOTION 產品頁列為 AC Servo Systems，搭配 catalog 與 manual 查核細部型號。',
        'SANMOTION 產品頁 / Catalogs',
      ],
      [
        'DC Servo Systems',
        'SANMOTION K / T',
        '原廠 SANMOTION 產品頁列為 DC Servo Systems。',
        'SANMOTION 產品頁',
      ],
      [
        'Stepping Systems',
        'SANMOTION F5 / F2 / F3 / Model No.PB',
        '原廠 SANMOTION 產品頁列為 Stepping Systems，型號與尺寸需依 catalog/manual 查核。',
        'SANMOTION 產品頁 / Catalogs',
      ],
      [
        'Motion Controller',
        'SANMOTION C / C S200 / C S300 / C S500 / Wireless Adapter 3A',
        '原廠 SANMOTION 產品頁列為 Motion Controller，控制週期與軸數等細節以個別 catalog 為準。',
        'SANMOTION 產品頁 / Catalogs',
      ],
      [
        'Related Information',
        'Software / Manual / Catalog Site',
        '原廠提供 software、manual、catalog 等相關文件入口。',
        'SANMOTION Manuals / Catalogs',
      ],
    ],
  },
  {
    productId: '270',
    code: 'SANYO DENKI Motors',
    title: 'SANYO DENKI 馬達相關型錄',
    description:
      '此頁整理 SANYO DENKI 與 SANMOTION 馬達、步進馬達與運動控制相關公開型錄，作為選型時的官方文件入口。',
    sourceNote:
      '資料來源：SANYO DENKI Catalog Site 與 SANMOTION 產品頁。表格列出原廠公開型錄資訊；頁數、日期與容量範圍以原廠 catalog list 為準。',
    links: [
      ['SANYO DENKI Catalog Site', 'https://publish.sanyodenki.com/library/site/en/book-lists/'],
      ['SANMOTION 產品頁', 'https://products.sanyodenki.com/en/sanmotion/'],
    ],
    columns: ['型錄 / 系列', '產品類型', '原廠型錄摘要', '容量 / 尺寸 / 控制範圍', '型錄頁數', '發行日期'],
    rows: [
      [
        'SANMOTION G',
        'AC Servo Systems',
        'SANMOTION G AC servo system catalog。',
        '原廠型錄未在列表摘要揭露容量範圍。',
        '116 pages',
        '2025-10-23',
      ],
      [
        'SANMOTION R 100/200VAC General Catalog',
        'AC Servo Systems',
        '100 VAC 30 W to 200 W；200 VAC 30 W to 30 kW。',
        '100 VAC 30 W to 200 W；200 VAC 30 W to 30 kW。',
        '192 pages',
        '2025-03-31',
      ],
      [
        'SANMOTION G 48 VDC',
        'AC Servo Systems',
        '48 VDC 30 W to 400 W。',
        '48 VDC 30 W to 400 W。',
        '52 pages',
        '2026-03-25',
      ],
      [
        'SANMOTION F5 Stepping Motors',
        'Stepping Systems',
        '5-Phase Stepping Motor；28 / 42 / 60 mm sq.。',
        '5-Phase Stepping Motor；28 / 42 / 60 mm sq.。',
        '4 pages',
        '2026-04-28',
      ],
      [
        'SANMOTION C S300',
        'Motion Controller',
        '1 ms cycle control of up to 32 axes；enhanced security features。',
        '1 ms cycle control of up to 32 axes。',
        '20 pages',
        '2026-01-30',
      ],
    ],
  },
];

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fileLink([label, url], code) {
  const safeLabel = htmlEscape(label);
  const safeUrl = htmlEscape(url);
  const safeCode = htmlEscape(code);
  return `<a class="st-sanyo-file" href="${safeUrl}" target="_blank" rel="noopener" aria-label="${safeCode} ${safeLabel}">${safeLabel}</a>`;
}

function moduleHtml(config) {
  const header = config.columns.map((column) => `<th scope="col">${htmlEscape(column)}</th>`).join('');
  const rows = config.rows
    .map((row) => `<tr>${row.map((cell, index) => `<td data-label="${htmlEscape(config.columns[index])}">${htmlEscape(cell)}</td>`).join('')}</tr>`)
    .join('\n');
  const links = config.links.map((item) => fileLink(item, config.code)).join('');

  return `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-sanyo-specs{--st-green:#009640;--st-dark:#0b1c2e;--st-soft:#f7fbf8;--st-line:#dfe9e3;--st-blue:#0b6ea8;margin:50px 0 60px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-dark);line-height:1.65}
.st-sanyo-specs *{box-sizing:border-box}
.st-sanyo-title{font-size:22px;color:var(--st-dark);margin:0 0 18px;border-left:5px solid var(--st-green);padding-left:15px;font-weight:800;line-height:1.35;letter-spacing:0}
.st-sanyo-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:linear-gradient(135deg,#fff 0%,var(--st-soft) 100%);font-size:14px;line-height:1.7;color:#4b5c6b}
.st-sanyo-detail{border:1px solid var(--st-line);border-radius:8px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(11,28,46,.04)}
.st-sanyo-detail summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:170px 1fr auto;gap:18px;align-items:center;padding:18px 20px;min-height:78px}
.st-sanyo-detail summary::-webkit-details-marker{display:none}
.st-sanyo-code{font-size:22px;line-height:1.1;font-weight:900;color:var(--st-green);letter-spacing:0}
.st-sanyo-summary strong{display:block;font-size:17px;line-height:1.35;color:var(--st-dark);font-weight:800}
.st-sanyo-summary em{display:block;margin-top:5px;font-style:normal;font-size:13px;line-height:1.55;color:#526372}
.st-sanyo-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:92px;min-height:34px;border-radius:999px;border:1px solid var(--st-line);color:var(--st-green);background:#fff;font-size:13px;font-weight:800;line-height:1}
.st-sanyo-toggle:before{content:"+";margin-right:5px;font-size:18px;line-height:1}
.st-sanyo-detail[open] .st-sanyo-toggle{background:var(--st-green);color:#fff;border-color:var(--st-green)}
.st-sanyo-detail[open] .st-sanyo-toggle:before{content:"-"}
.st-sanyo-panel{border-top:1px solid var(--st-line);padding:18px 20px 22px;background:#fff}
.st-sanyo-downloads{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.st-sanyo-file{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:5px;padding:7px 11px;font-size:12px;font-weight:800;line-height:1.25;text-align:center;white-space:nowrap;background:#eef6ff;color:#0b6ea8;border:1px solid #b9daf2;text-decoration:none}
.st-sanyo-file:hover,.st-sanyo-file:focus{background:#dff0ff;color:#074e78}
.st-sanyo-source-note{margin:0 0 14px;font-size:13px;line-height:1.65;color:#667685}
.st-sanyo-scroll-note{display:none;margin:0 0 8px;font-size:12px;color:#667685}
.st-sanyo-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--st-line);border-radius:8px;background:#fff;-webkit-overflow-scrolling:touch}
.st-sanyo-table{min-width:860px;width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
.st-sanyo-table th{position:sticky;top:0;background:#0b6ea8;color:#fff;text-align:left;padding:10px 10px;border-right:1px solid rgba(255,255,255,.24);font-weight:800;white-space:nowrap;z-index:2}
.st-sanyo-table td{padding:10px;border-top:1px solid #e8eef0;color:#102033;vertical-align:top}
.st-sanyo-table th:first-child,.st-sanyo-table td:first-child{position:sticky;left:0;z-index:3}
.st-sanyo-table th:first-child{background:#0b6ea8}
.st-sanyo-table td:first-child{font-weight:800;color:#091827;background:#fff;min-width:170px}
.st-sanyo-table tbody tr:nth-child(even) td{background:#fbfcfc}
.st-sanyo-table tbody tr:nth-child(even) td:first-child{background:#fbfcfc}
.st-spec-cta{margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033}
.st-spec-cta p{margin:8px 0 12px}
.st-spec-cta a{display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700}
@media (max-width:760px){.st-sanyo-specs{margin:36px 0 44px}.st-sanyo-title{font-size:20px}.st-sanyo-lead{font-size:13px}.st-sanyo-detail summary{grid-template-columns:98px 1fr auto;gap:10px;padding:15px 14px;min-height:72px}.st-sanyo-code{font-size:18px}.st-sanyo-summary strong{font-size:15px}.st-sanyo-summary em{font-size:12px}.st-sanyo-toggle{min-width:82px;min-height:32px;font-size:12px}.st-sanyo-panel{padding:14px}.st-sanyo-scroll-note{display:block}.st-sanyo-table{min-width:820px}.st-sanyo-file{white-space:normal}}
</style>
<section class="st-sanyo-specs" aria-labelledby="st-sanyo-title-${htmlEscape(config.productId)}">
<h3 class="st-sanyo-title" id="st-sanyo-title-${htmlEscape(config.productId)}">產品規格詳情</h3>
<p class="st-sanyo-lead">以下依 SANYO DENKI 官方產品頁、型錄與下載頁整理，保留原廠公開分類與文件入口；沒有公開的型號細節不另行推測。</p>
<details class="st-sanyo-detail" open>
<summary><span class="st-sanyo-code">${htmlEscape(config.code)}</span><span class="st-sanyo-summary"><strong>${htmlEscape(config.title)}</strong><em>${htmlEscape(config.description)}</em></span><span class="st-sanyo-toggle">展開 / 收合</span></summary>
<div class="st-sanyo-panel">
<div class="st-sanyo-downloads">${links}</div>
<p class="st-sanyo-source-note">${htmlEscape(config.sourceNote)}</p>
<p class="st-sanyo-scroll-note">表格可左右滑動查看完整欄位。</p>
<div class="st-sanyo-table-wrap" role="region" aria-label="${htmlEscape(config.code)} official source table">
<table class="st-sanyo-table">
<thead><tr>${header}</tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>
<div class="st-spec-cta">
  <strong>需要確認 SANYO DENKI 選型或文件版本？</strong>
  <p>請提供應用設備、電壓容量、馬達/控制器型號或備援需求，星泰可協助對照原廠型錄與可供應文件。</p>
  <a href="${inquiryHref}" aria-label="詢問 ${htmlEscape(config.code)} SANYO DENKI 產品">詢問星泰</a>
</div>
</div>
</details>
</section>
</div>
<!-- standardized-spec-module:end -->`;
}

for (const config of modules) {
  const file = path.join(root, `site/preview/products/detail/${config.productId}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const pattern = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
  if (!pattern.test(html)) throw new Error(`No standardized spec block found for ${config.productId}`);
  const next = html.replace(pattern, moduleHtml(config));
  if (next === html) {
    console.log(`unchanged ${config.productId}`);
    continue;
  }
  fs.writeFileSync(file, next, 'utf8');
  console.log(`updated ${config.productId}`);
}
