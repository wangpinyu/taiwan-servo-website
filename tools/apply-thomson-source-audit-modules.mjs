import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';
const file = path.join(root, 'site/preview/products/detail/149.html');

const sourcePdf = 'https://www.thomsonlinear.com/downloads/gearheads/AquaTRUE_True_Planetary_Gearheads_bren.pdf';
const sourceProduct = 'https://www.bostongear.com/products/micron-true-planetary-gearheads/in-line-planetary-gearheads/aquatrue';

const columns = [
  'Part Number',
  'Stages',
  'Backlash (arc-min)',
  'Efficiency (%)',
  'Weight (kg / lbs)',
  'Ratio Availability',
  '官方資料',
];

const rows = [
  ['AQT060', '1', '13', '93%', '2.4 / 5.4', '3:1, 4:1, 5:1, 7:1, 10:1', 'AquaTRUE PDF'],
  ['AQT080', '1', '13', '93%', '5.7 / 12.7', '3:1, 4:1, 5:1, 7:1, 8:1, 10:1', 'AquaTRUE PDF'],
  ['AQT120', '1', '13', '93%', '12.0 / 26.5', '3:1, 4:1, 5:1, 7:1, 10:1', 'AquaTRUE PDF'],
  ['AQT160', '1', '13', '93%', '24.8 / 53.8', '3:1, 4:1, 5:1, 7:1, 10:1', 'AquaTRUE PDF'],
];

const featureRows = [
  ['Frame Sizes (mm)', '60 / 80 / 120 / 160', 'Thomson AquaTRUE PDF'],
  ['Precision', '13 arc-min max', 'Thomson AquaTRUE PDF'],
  ['Torque Capacity', 'up to 876 Nm', 'Thomson AquaTRUE PDF / Boston Gear product page'],
  ['Ratio Range', '3:1 through 100:1', 'Boston Gear product page'],
  ['Protection', 'IP66 / IP67 / IP69K on input and output', 'Thomson AquaTRUE PDF / Boston Gear product page'],
  ['Housing / Certification', '300 Series stainless steel; NSF/ANSI 169 certification', 'Thomson AquaTRUE PDF / Boston Gear product page'],
  ['Typical Applications', 'Food handling, food packaging, beverage dispensing, medical hygienic equipment, pharmaceutical and washdown environments', 'Thomson AquaTRUE PDF'],
];

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderRows(tableColumns, tableRows) {
  return tableRows
    .map((row) => `<tr>${row.map((cell, index) => `<td data-label="${htmlEscape(tableColumns[index])}">${htmlEscape(cell)}</td>`).join('')}</tr>`)
    .join('\n');
}

function renderTable(tableColumns, tableRows, label) {
  const headers = tableColumns.map((column) => `<th scope="col">${htmlEscape(column)}</th>`).join('');
  return `<div class="st-thom-table-wrap" role="region" aria-label="${htmlEscape(label)}">
<table class="st-thom-table">
<thead><tr>${headers}</tr></thead>
<tbody>
${renderRows(tableColumns, tableRows)}
</tbody>
</table>
</div>`;
}

const moduleHtml = `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-thom-specs{--st-green:#009640;--st-blue:#0b6ea8;--st-dark:#0b1c2e;--st-muted:#5d6b77;--st-line:#dfe8e3;--st-soft:#f7fbf8;margin:48px 0 58px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-dark);line-height:1.65}
.st-thom-specs *{box-sizing:border-box}
.st-thom-title{font-size:22px;color:var(--st-dark);margin:0 0 18px;border-left:5px solid var(--st-green);padding-left:15px;font-weight:800;line-height:1.35;letter-spacing:0}
.st-thom-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:linear-gradient(135deg,#fff 0%,var(--st-soft) 100%);font-size:14px;color:#4d5b66}
.st-thom-detail{border:1px solid var(--st-line);border-radius:9px;background:#fff;overflow:hidden;margin:14px 0;box-shadow:0 4px 14px rgba(11,28,46,.04)}
.st-thom-detail summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:140px 1fr auto;gap:18px;align-items:center;padding:18px 20px;min-height:76px}
.st-thom-detail summary::-webkit-details-marker{display:none}
.st-thom-code{font-size:23px;font-weight:900;color:var(--st-green);line-height:1}
.st-thom-summary strong{display:block;font-size:17px;line-height:1.35;color:var(--st-dark);font-weight:800}
.st-thom-summary em{display:block;margin-top:5px;font-style:normal;font-size:13px;line-height:1.55;color:var(--st-muted)}
.st-thom-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:92px;min-height:34px;border-radius:999px;border:1px solid var(--st-line);color:var(--st-green);background:#fff;font-size:13px;font-weight:800;line-height:1}
.st-thom-toggle:before{content:"+";margin-right:5px;font-size:18px;line-height:1}
.st-thom-detail[open] .st-thom-toggle{background:var(--st-green);color:#fff;border-color:var(--st-green)}
.st-thom-detail[open] .st-thom-toggle:before{content:"-"}
.st-thom-panel{border-top:1px solid var(--st-line);padding:18px 20px 22px;background:#fff}
.st-thom-source{margin:0 0 12px;color:var(--st-muted);font-size:13px;line-height:1.65}
.st-thom-source a{color:var(--st-blue);font-weight:800;text-decoration:underline}
.st-thom-links{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.st-thom-link{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:5px;padding:7px 11px;font-size:12px;font-weight:800;line-height:1.25;text-align:center;background:#eef6ff;color:#0b6ea8;border:1px solid #b9daf2;text-decoration:none}
.st-thom-scroll-note{display:none;margin:0 0 8px;font-size:12px;color:var(--st-muted)}
.st-thom-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--st-line);border-radius:8px;background:#fff;-webkit-overflow-scrolling:touch;margin-top:12px}
.st-thom-table{min-width:880px;width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
.st-thom-table th{position:sticky;top:0;background:var(--st-blue);color:#fff;text-align:left;padding:10px;border-right:1px solid rgba(255,255,255,.24);font-weight:800;white-space:nowrap;z-index:2}
.st-thom-table td{padding:10px;border-top:1px solid #e8eef0;color:#102033;vertical-align:top}
.st-thom-table th:first-child,.st-thom-table td:first-child{position:sticky;left:0;z-index:3}
.st-thom-table th:first-child{background:var(--st-blue)}
.st-thom-table td:first-child{font-weight:800;color:#091827;background:#fff;min-width:150px}
.st-thom-table tbody tr:nth-child(even) td{background:#fbfcfc}
.st-thom-table tbody tr:nth-child(even) td:first-child{background:#fbfcfc}
.st-spec-cta{margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033}
.st-spec-cta p{margin:8px 0 12px}
.st-spec-cta a{display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700}
@media (max-width:760px){.st-thom-specs{margin:34px 0 42px}.st-thom-title{font-size:20px}.st-thom-lead{font-size:13px}.st-thom-detail summary{grid-template-columns:100px 1fr auto;gap:10px;padding:15px 14px}.st-thom-code{font-size:19px}.st-thom-summary strong{font-size:15px}.st-thom-summary em{font-size:12px}.st-thom-toggle{min-width:82px;min-height:32px;font-size:12px}.st-thom-panel{padding:14px}.st-thom-scroll-note{display:block}.st-thom-table{min-width:760px}.st-thom-link{white-space:normal}}
</style>
<section class="st-thom-specs" aria-labelledby="st-thom-title-149">
<h3 class="st-thom-title" id="st-thom-title-149">產品規格詳情</h3>
<p class="st-thom-lead">AquaTRUE 為 Thomson / Micron True Planetary 系列中的不鏽鋼防水行星減速機，適用於食品、飲料、醫療、製藥與需高壓沖洗的環境。以下保留原廠公開的核心規格欄位與官方文件入口。</p>
<details class="st-thom-detail" open>
<summary><span class="st-thom-code">AquaTRUE</span><span class="st-thom-summary"><strong>AquaTRUE True Planetary Gearheads</strong><em>圓形 300 系列不鏽鋼外殼、IP66 / IP67 / IP69K 防護，面向嚴苛衛生與沖洗場域。</em></span><span class="st-thom-toggle">展開 / 收合</span></summary>
<div class="st-thom-panel">
<div class="st-thom-links"><a class="st-thom-link" href="${sourcePdf}" target="_blank" rel="noopener" aria-label="開啟 AquaTRUE 官方 PDF 規格表">AquaTRUE PDF</a><a class="st-thom-link" href="${sourceProduct}" target="_blank" rel="noopener" aria-label="開啟 AquaTRUE 官方產品頁">AquaTRUE Product Page</a></div>
<p class="st-thom-source">資料來源：<a href="${sourcePdf}" target="_blank" rel="noopener">Thomson Linear AquaTRUE True Planetary Gearheads PDF</a>、<a href="${sourceProduct}" target="_blank" rel="noopener">Boston Gear / Micron AquaTRUE product page</a>。</p>
<p class="st-thom-scroll-note">表格可左右滑動查看完整欄位。</p>
${renderTable(columns, rows, 'AquaTRUE official specification table')}
${renderTable(['項目', '原廠公開規格', '資料來源'], featureRows, 'AquaTRUE official feature table')}
</div>
</details>
<div class="st-spec-cta">
  <strong>需要協助確認 AquaTRUE 減速機規格？</strong>
  <p>請提供預計應用、安裝方向、清洗環境、減速比、輸入轉速與扭矩需求，星泰可協助比對適合的 AQT 尺寸與技術文件。</p>
  <a href="${inquiryHref}" aria-label="聯絡星泰確認 Thomson AquaTRUE 減速機規格">請洽星泰確認規格</a>
</div>
</section>
</div>
<!-- standardized-spec-module:end -->`;

const html = fs.readFileSync(file, 'utf8');
const pattern = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
if (!pattern.test(html)) {
  throw new Error('No standardized spec block found for 149');
}

const next = html.replace(pattern, moduleHtml);
if (next === html) {
  console.log('unchanged 149');
} else {
  fs.writeFileSync(file, next, 'utf8');
  console.log('updated 149');
}
