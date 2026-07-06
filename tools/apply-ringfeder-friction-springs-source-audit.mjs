import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'site/preview/products/detail/215.html');
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const sourceProduct = 'https://www.ringfeder.com/products/friction-springs/';
const sourcePaper = 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-damping-technology-en.pdf';

const modelColumns = [
  'Type',
  'Type old',
  'F (kN)',
  'se (mm)',
  'We (Joule)',
  'he (mm)',
  'D1 (mm)',
  'd1 (mm)',
  'Gwe (kg)',
  '官方資料',
];

const modelRows = [
  ['01800', '1201', '5', '0.4', '1.0', '2.2', '18.1', '14.4', '0.002', 'PDF'],
  ['02500', '1202', '9', '0.6', '2.7', '3.1', '25.0', '20.8', '0.004', 'PDF'],
  ['03200', '1203', '14', '0.8', '5.6', '4.0', '32.0', '27.0', '0.007', 'PDF'],
  ['03800', '1204', '20', '0.9', '9.0', '4.7', '38.0', '31.7', '0.012', 'PDF'],
  ['04200', '1205', '26', '1.0', '13.0', '5.2', '42.2', '34.6', '0.018', 'PDF'],
  ['04800', '1206', '34', '1.1', '18.7', '5.9', '48.2', '39.4', '0.026', 'PDF'],
  ['05500', '1207', '40', '1.3', '26.0', '6.8', '55.0', '46.0', '0.035', 'PDF'],
  ['06300', '1208', '54', '1.4', '37.8', '7.7', '63.0', '51.9', '0.056', 'PDF'],
  ['07000', '1209', '65', '1.6', '52.0', '8.6', '70.0', '58.2', '0.074', 'PDF'],
  ['08000', '1310', '83', '1.8', '75.0', '9.8', '80.0', '67.0', '0.105', 'PDF'],
  ['09000', '1311', '100', '2.0', '100.0', '11.0', '90.0', '75.5', '0.145', 'PDF'],
  ['10000', '1312', '125', '2.2', '138.0', '12.2', '100.0', '84.0', '0.203', 'PDF'],
  ['12400', '1314', '200', '2.6', '260.0', '15.0', '124.0', '102.0', '0.408', 'PDF'],
  ['13000', '1313', '160', '2.6', '208.0', '15.0', '130.0', '111.5', '0.376', 'PDF'],
  ['14000', '1315', '250', '3.0', '375.0', '17.0', '140.0', '116.0', '0.568', 'PDF'],
  ['16600', '1316', '350', '3.7', '648.0', '20.0', '166.0', '134.0', '0.869', 'PDF'],
  ['19600', '1318', '600', '4.4', '1320.0', '23.4', '194.0', '155.0', '1.676', 'PDF'],
  ['20000', '1317', '510', '3.9', '995.0', '22.4', '198.0', '162.0', '1.570', 'PDF'],
  ['22000', '1319', '720', '4.4', '1584.0', '26.4', '220.0', '174.0', '2.573', 'PDF'],
  ['26200', '1320', '860', '4.8', '2064.0', '25.8', '262.0', '208.0', '3.415', 'PDF'],
  ['30000', '1221', '1000', '5.8', '2900.0', '35.8', '300.0', '250.0', '5.510', 'PDF'],
  ['32000', '1222', '1200', '6.2', '3720.0', '38.2', '320.0', '263.0', '7.060', 'PDF'],
  ['35000', '1223', '1400', '6.6', '4620.0', '41.6', '350.0', '288.0', '9.180', 'PDF'],
  ['40000', '1224', '1800', '7.6', '6840.0', '47.6', '400.0', '330.0', '13.560', 'PDF'],
];

const characteristicColumns = ['項目', '官方公開內容', '數值 / 條件', '資料來源'];
const characteristicRows = [
  ['阻尼能力', '標準阻尼為輸入能量的 66%，可依潤滑條件調整。', '33% - 66%', '官方頁面 / PDF'],
  ['負載速度影響', '彈簧功與阻尼效果不受負載速度影響。', '與 load speed 無關', '官方頁面 / PDF'],
  ['過載安全', '通常設計至 block position，避免超出允許應力。', 'Overload-safe in block position', '官方頁面 / PDF'],
  ['溫度範圍', '標準特性曲線在一般溫度範圍內保持穩定；特殊需求需洽原廠。', '-20 °C to +60 °C；改造可至 -73 °C to +200 °C', 'PDF'],
  ['預壓條件', '需預壓總行程，避免影響潤滑膜。', '最小 5%；建議 10%；通常不超過 50%', '官方頁面 / PDF'],
  ['排列方式', '可並聯提升力量，也可串聯增加彈簧行程。', 'Parallel: higher forces；Serial: more spring travel', '官方頁面 / PDF'],
];

const designColumns = ['選型 / 設計欄位', '官方符號或公式', '用途', '資料來源'];
const designRows = [
  ['Unstressed length', 'Lo = e x he', '以元件數 e 與單一元件長度 he 計算自由長度。', '官方頁面 / PDF'],
  ['Total spring stroke', 's = e x se', '以元件數 e 與單一元件行程 se 計算總行程。', '官方頁面 / PDF'],
  ['Spring work', 'W = e x We', '以元件數 e 與單一元件吸收能量 We 計算總彈簧功。', '官方頁面 / PDF'],
  ['Spring end force', 'End force does not change with number of elements', '端部力不隨元件數改變，選型時需分開確認力與行程。', '官方頁面'],
  ['Guiding', 'Guide on inner or outer diameter', '摩擦彈簧需提供內徑或外徑導引。', '官方頁面 / PDF'],
  ['Sealing', 'Protect against dirt and moisture', '需避免灰塵與濕氣破壞潤滑膜，重污染環境建議防護。', '官方頁面 / PDF'],
];

const documentColumns = ['文件類型', '文件 / 頁面', '適用內容', '連結'];
const documentRows = [
  ['原廠產品頁', 'RINGFEDER Friction Springs', '產品特性、選型與安裝注意事項、CAD 取得方式。', 'Official page'],
  ['Product Paper', 'RINGFEDER Damping Technology', '摩擦彈簧規格表、設計公式、工業緩衝器與應用範例。', 'PDF'],
];

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderRows(columns, rows, linkColumn = -1) {
  return rows
    .map((row) => `<tr>${row.map((cell, index) => {
      let value = htmlEscape(cell);
      if (linkColumn === index && cell === 'Official page') {
        value = `<a href="${sourceProduct}" target="_blank" rel="noopener" aria-label="開啟 RINGFEDER Friction Springs 原廠產品頁">Official page</a>`;
      } else if (linkColumn === index && cell === 'PDF') {
        value = `<a href="${sourcePaper}" target="_blank" rel="noopener" aria-label="開啟 RINGFEDER Damping Technology 原廠 PDF">PDF</a>`;
      }
      return `<td data-label="${htmlEscape(columns[index])}">${value}</td>`;
    }).join('')}</tr>`)
    .join('\n');
}

function renderTable(columns, rows, label, linkColumn = -1) {
  const headers = columns.map((column) => `<th scope="col">${htmlEscape(column)}</th>`).join('');
  return `<div class="st-rffs-table-wrap" role="region" aria-label="${htmlEscape(label)}">
<table class="st-rffs-table">
<thead><tr>${headers}</tr></thead>
<tbody>
${renderRows(columns, rows, linkColumn)}
</tbody>
</table>
</div>`;
}

const moduleHtml = `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-rffs-specs{--st-green:#009640;--st-blue:#0b6ea8;--st-dark:#0b1c2e;--st-muted:#5d6b77;--st-line:#dfe8e3;--st-soft:#f7fbf8;margin:48px 0 58px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-dark);line-height:1.65}
.st-rffs-specs *{box-sizing:border-box}
.st-rffs-title{font-size:22px;color:var(--st-dark);margin:0 0 18px;border-left:5px solid var(--st-green);padding-left:15px;font-weight:800;line-height:1.35;letter-spacing:0}
.st-rffs-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:linear-gradient(135deg,#fff 0%,var(--st-soft) 100%);font-size:14px;color:#4d5b66}
.st-rffs-detail{border:1px solid var(--st-line);border-radius:9px;background:#fff;overflow:hidden;margin:14px 0;box-shadow:0 4px 14px rgba(11,28,46,.04)}
.st-rffs-detail summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:150px 1fr auto;gap:18px;align-items:center;padding:18px 20px;min-height:76px}
.st-rffs-detail summary::-webkit-details-marker{display:none}
.st-rffs-code{font-size:22px;font-weight:900;color:var(--st-green);line-height:1}
.st-rffs-summary strong{display:block;font-size:17px;line-height:1.35;color:var(--st-dark);font-weight:800}
.st-rffs-summary em{display:block;margin-top:5px;font-style:normal;font-size:13px;line-height:1.55;color:var(--st-muted)}
.st-rffs-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:92px;min-height:34px;border-radius:999px;border:1px solid var(--st-line);color:var(--st-green);background:#fff;font-size:13px;font-weight:800;line-height:1}
.st-rffs-toggle:before{content:"+";margin-right:5px;font-size:18px;line-height:1}
.st-rffs-detail[open] .st-rffs-toggle{background:var(--st-green);color:#fff;border-color:var(--st-green)}
.st-rffs-detail[open] .st-rffs-toggle:before{content:"-"}
.st-rffs-panel{border-top:1px solid var(--st-line);padding:18px 20px 22px;background:#fff}
.st-rffs-source{margin:0 0 12px;color:var(--st-muted);font-size:13px;line-height:1.65}
.st-rffs-source a{color:var(--st-blue);font-weight:800;text-decoration:underline}
.st-rffs-links{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.st-rffs-link{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:5px;padding:7px 11px;font-size:12px;font-weight:800;line-height:1.25;text-align:center;background:#eef6ff;color:#0b6ea8;border:1px solid #b9daf2;text-decoration:none}
.st-rffs-scroll-note{display:none;margin:0 0 8px;font-size:12px;color:var(--st-muted)}
.st-rffs-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--st-line);border-radius:8px;background:#fff;-webkit-overflow-scrolling:touch;margin:12px 0 16px}
.st-rffs-table{min-width:920px;width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
.st-rffs-table th{position:sticky;top:0;background:var(--st-blue);color:#fff;text-align:left;padding:10px;border-right:1px solid rgba(255,255,255,.24);font-weight:800;white-space:nowrap;z-index:2}
.st-rffs-table td{padding:10px;border-top:1px solid #e8eef0;color:#102033;vertical-align:top}
.st-rffs-table th:first-child,.st-rffs-table td:first-child{position:sticky;left:0;z-index:3}
.st-rffs-table th:first-child{background:var(--st-blue)}
.st-rffs-table td:first-child{font-weight:800;color:#091827;background:#fff;min-width:130px}
.st-rffs-table tbody tr:nth-child(even) td{background:#fbfcfc}
.st-rffs-table tbody tr:nth-child(even) td:first-child{background:#fbfcfc}
.st-rffs-table a{color:var(--st-blue);font-weight:800;text-decoration:underline}
.st-rffs-note{margin:0 0 12px;color:#4f5d68;font-size:13px;line-height:1.65}
.st-spec-cta{margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033}
.st-spec-cta p{margin:8px 0 12px}
.st-spec-cta a{display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700}
@media (max-width:760px){.st-rffs-specs{margin:34px 0 42px}.st-rffs-title{font-size:20px}.st-rffs-lead{font-size:13px}.st-rffs-detail summary{grid-template-columns:110px 1fr auto;gap:10px;padding:15px 14px}.st-rffs-code{font-size:18px}.st-rffs-summary strong{font-size:15px}.st-rffs-summary em{font-size:12px}.st-rffs-toggle{min-width:82px;min-height:32px;font-size:12px}.st-rffs-panel{padding:14px}.st-rffs-scroll-note{display:block}.st-rffs-table{min-width:760px}.st-rffs-link{white-space:normal}}
</style>
<section class="st-rffs-specs" aria-labelledby="st-rffs-title-215">
<h3 class="st-rffs-title" id="st-rffs-title-215">產品規格詳情</h3>
<p class="st-rffs-lead">本區依 RINGFEDER 原廠 Friction Springs 產品頁與 Damping Technology Product Paper 整理。原廠公開資料包含摩擦彈簧型號表、設計公式、阻尼特性與安裝條件；若需完整 CAD 或特殊工況確認，請由星泰協助向原廠確認。</p>
<details class="st-rffs-detail" open>
<summary><span class="st-rffs-code">Friction Springs</span><span class="st-rffs-summary"><strong>RINGFEDER 摩擦彈簧</strong><em>高阻尼、免維護的安全元件，用於吸收突然衝擊與動能，適合在有限空間中處理高負載阻尼需求。</em></span><span class="st-rffs-toggle">展開 / 收合</span></summary>
<div class="st-rffs-panel">
<div class="st-rffs-links"><a class="st-rffs-link" href="${sourceProduct}" target="_blank" rel="noopener" aria-label="開啟 RINGFEDER Friction Springs 原廠產品頁">Official Product Page</a><a class="st-rffs-link" href="${sourcePaper}" target="_blank" rel="noopener" aria-label="開啟 RINGFEDER Damping Technology 原廠 PDF">Damping Technology PDF</a></div>
<p class="st-rffs-source">資料來源：<a href="${sourceProduct}" target="_blank" rel="noopener">RINGFEDER Friction Springs official product page</a>、<a href="${sourcePaper}" target="_blank" rel="noopener">Product Paper RINGFEDER Damping Technology</a>。</p>
<p class="st-rffs-scroll-note">表格可左右滑動查看完整欄位。</p>
<p class="st-rffs-note">型號表欄位依原廠 PDF「Type / Type old / F / se / We / he / D1 / d1 / Gwe」呈現；F 為 Spring end force，se 為單一元件行程，We 為單一元件能量吸收，he 為單一元件長度，D1 / d1 為外徑與內徑，Gwe 為單一元件重量。</p>
${renderTable(modelColumns, modelRows, 'RINGFEDER Friction Springs model technical data table', 9)}
${renderTable(characteristicColumns, characteristicRows, 'RINGFEDER Friction Springs characteristics table')}
${renderTable(designColumns, designRows, 'RINGFEDER Friction Springs selection and design table')}
${renderTable(documentColumns, documentRows, 'RINGFEDER Friction Springs official document table', 3)}
</div>
</details>
<div class="st-spec-cta">
  <strong>需要確認 RINGFEDER 摩擦彈簧選型？</strong>
  <p>請提供需求能量、行程、端部力、安裝空間、環境溫度與污染條件；星泰可協助確認適用型號、CAD 取得方式與特殊工況可行性。</p>
  <a href="${inquiryHref}" aria-label="詢問 RINGFEDER 摩擦彈簧產品規格">詢問產品規格</a>
</div>
</section>
</div>
<!-- standardized-spec-module:end -->`;

const html = fs.readFileSync(file, 'utf8');
const pattern = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
if (!pattern.test(html)) {
  throw new Error('No standardized spec block found for 215');
}

const next = html.replace(pattern, moduleHtml);
if (next === html) {
  console.log('unchanged 215');
} else {
  fs.writeFileSync(file, next, 'utf8');
  console.log('updated 215');
}
