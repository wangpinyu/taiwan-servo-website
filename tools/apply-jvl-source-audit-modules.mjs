import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const file = path.join(root, 'site/preview/products/detail/102.html');

const sections = [
  {
    code: 'MAC',
    title: 'MAC 整合型伺服馬達',
    summary:
      'JVL MAC motor 為整合控制器的無刷伺服馬達，原廠公開 MAC050-141、MAC400、MAC800、MAC1500-3000 等系列與選型表。',
    source: 'JVL Integrated Servomotors MAC motor series',
    sourceUrl: 'https://www.jvl.dk/202/integrated-servomotors',
    columns: ['系列 / 型號範圍', '功率範圍 (W)', '扭矩範圍 (Nm)', '防護等級', '煞車 / 電源配置', '官方資料'],
    rows: [
      ['MAC050-141', '50-141 W', '0.11-0.48 / 0.32-1.59', 'IP42；部分型號可選 IP65 或 IP67', '依型號外接或選配', 'JVL MAC product page'],
      ['MAC400 / MAC402', '400 W', '1.3 / 3.8', 'IP55', 'D2 無內建煞車；D5 內建煞車', 'JVL MAC selection chart'],
      ['MAC800', '560-746 W', '1.78-2.38 / 6.8', 'IP55 或 IP66', 'D2/D3 無內建煞車；D5/D6 內建煞車', 'JVL MAC selection chart'],
      ['MAC1200', '1140 W', '3.8 / 11.4', 'IP55；部分型號可選 IP66', '依 D2/D5/D3/D6 配置', 'JVL MAC selection chart'],
      ['MAC1500-3000', '1500-3000 W', '5.0-9.55 / 15.0-28.7', 'IP55；部分型號可選 IP66', '煞車選配', 'JVL MAC selection chart'],
      ['MAC4500', '4500 W', '14.3 / 52', 'IP55；部分型號可選 IP66', '煞車選配', 'JVL MAC selection chart'],
    ],
  },
  {
    code: 'MIS',
    title: 'MIS / ServoStep 整合型步進馬達',
    summary:
      'JVL ServoStep 整合步進馬達將馬達、編碼器、驅動與控制電子整合在同一單元，官方頁列出 NEMA17 到 NEMA43 的扭矩範圍。',
    source: 'JVL ServoStep Integrated Stepper Motors',
    sourceUrl: 'https://www.jvl.dk/758/mis-motor-integrated-stepper-motors',
    columns: ['框號 / 尺寸', '系列 / 型號範圍', '保持 / 運轉扭矩 (Nm)', '防護等級', '整合控制', '官方資料'],
    rows: [
      ['NEMA17 / 42x42 mm', 'MIS171Q/S / MIS173Q/S / MIS176Q/S', '0.18 / 0.18；0.40 / 0.40；0.78 / 0.78', 'IP42；可選 IP65', 'Integrated w/ SMC66', 'JVL MIS product page'],
      ['NEMA23 / 57x57 mm', 'MIS231 / MIS232 / MIS234 variants', '0.97-3.08；部分版本 1.16-2.53 或 1.3-3.0', 'IP42；可選 IP65', 'Integrated w/ SMC66', 'JVL MIS product page'],
      ['NEMA34 / 86x86 mm', 'MIS340C / MIS341C / MIS342C / MIS343C', '3.0 / 3.0；6.1 / 6.1；9.0 / 7.5；12.0 / 10.0', 'IP42；可選 IP65', 'Integrated', 'JVL MIS product page'],
      ['NEMA43 / 110x110 mm', 'MIS430C / MIS431C / MIS432C', '10.0 / 10.0；18.7 / 18.7；25.0 / 25.0', 'IP42', 'Integrated', 'JVL MIS product page'],
    ],
  },
  {
    code: 'SMC',
    title: 'SMC 步進馬達控制器',
    summary:
      'JVL MIS 官方頁同時列出 SMC75、SMC66、SMC85 控制器，依最大電流與外殼型式區分。',
    source: 'JVL ServoStep Integrated Stepper Motors',
    sourceUrl: 'https://www.jvl.dk/758/mis-motor-integrated-stepper-motors',
    columns: ['控制器系列', '最大電流 (A)', '防護等級', '外殼 / 版本', '適用說明', '官方資料'],
    rows: [
      ['SMC75', '3 A', 'IP42', 'With housing / open board', 'Stepper motor controller with PLC options', 'JVL MIS product page'],
      ['SMC66', '6 A', 'IP42；部分版本可選 IP65', 'With housing / open board', 'Stepper motor controller with PLC, CANopen and I/O options', 'JVL MIS product page'],
      ['SMC85', '9 A', 'IP42；部分版本可選 IP65', 'With housing / open board', 'Higher current stepper motor controller family', 'JVL MIS product page'],
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

function renderRows(section) {
  return section.rows
    .map((row) => `<tr>${row.map((cell, index) => `<td data-label="${htmlEscape(section.columns[index])}">${htmlEscape(cell)}</td>`).join('')}</tr>`)
    .join('\n');
}

function renderSection(section) {
  const headers = section.columns.map((column) => `<th scope="col">${htmlEscape(column)}</th>`).join('');
  return `<details class="st-jvl-detail" open>
<summary><span class="st-jvl-code">${htmlEscape(section.code)}</span><span class="st-jvl-summary"><strong>${htmlEscape(section.title)}</strong><em>${htmlEscape(section.summary)}</em></span><span class="st-jvl-toggle">展開 / 收合</span></summary>
<div class="st-jvl-panel">
<p class="st-jvl-source">資料來源：<a href="${htmlEscape(section.sourceUrl)}" target="_blank" rel="noopener">${htmlEscape(section.source)}</a>。表格僅整理原廠公開欄位，未公開細節不另行推測。</p>
<p class="st-jvl-scroll-note">表格可左右滑動查看完整欄位。</p>
<div class="st-jvl-table-wrap" role="region" aria-label="${htmlEscape(section.code)} official source table">
<table class="st-jvl-table">
<thead><tr>${headers}</tr></thead>
<tbody>
${renderRows(section)}
</tbody>
</table>
</div>
</div>
</details>`;
}

const moduleHtml = `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-jvl-specs{--st-green:#009640;--st-blue:#0b6ea8;--st-dark:#0b1c2e;--st-muted:#5e6c78;--st-line:#dfe8e3;--st-soft:#f7fbf8;margin:48px 0 58px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-dark);line-height:1.65}
.st-jvl-specs *{box-sizing:border-box}
.st-jvl-title{font-size:22px;color:var(--st-dark);margin:0 0 18px;border-left:5px solid var(--st-green);padding-left:15px;font-weight:800;line-height:1.35;letter-spacing:0}
.st-jvl-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:linear-gradient(135deg,#fff 0%,var(--st-soft) 100%);font-size:14px;color:#4d5b66}
.st-jvl-detail{border:1px solid var(--st-line);border-radius:9px;background:#fff;overflow:hidden;margin:14px 0;box-shadow:0 4px 14px rgba(11,28,46,.04)}
.st-jvl-detail summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:110px 1fr auto;gap:18px;align-items:center;padding:18px 20px;min-height:76px}
.st-jvl-detail summary::-webkit-details-marker{display:none}
.st-jvl-code{font-size:24px;font-weight:900;color:var(--st-green);line-height:1}
.st-jvl-summary strong{display:block;font-size:17px;line-height:1.35;color:var(--st-dark);font-weight:800}
.st-jvl-summary em{display:block;margin-top:5px;font-style:normal;font-size:13px;line-height:1.55;color:var(--st-muted)}
.st-jvl-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:92px;min-height:34px;border-radius:999px;border:1px solid var(--st-line);color:var(--st-green);background:#fff;font-size:13px;font-weight:800;line-height:1}
.st-jvl-toggle:before{content:"+";margin-right:5px;font-size:18px;line-height:1}
.st-jvl-detail[open] .st-jvl-toggle{background:var(--st-green);color:#fff;border-color:var(--st-green)}
.st-jvl-detail[open] .st-jvl-toggle:before{content:"-"}
.st-jvl-panel{border-top:1px solid var(--st-line);padding:18px 20px 22px;background:#fff}
.st-jvl-source{margin:0 0 12px;color:var(--st-muted);font-size:13px;line-height:1.65}
.st-jvl-source a{color:var(--st-blue);font-weight:800;text-decoration:underline}
.st-jvl-scroll-note{display:none;margin:0 0 8px;font-size:12px;color:var(--st-muted)}
.st-jvl-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--st-line);border-radius:8px;background:#fff;-webkit-overflow-scrolling:touch}
.st-jvl-table{min-width:980px;width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
.st-jvl-table th{position:sticky;top:0;background:var(--st-blue);color:#fff;text-align:left;padding:10px;border-right:1px solid rgba(255,255,255,.24);font-weight:800;white-space:nowrap;z-index:2}
.st-jvl-table td{padding:10px;border-top:1px solid #e8eef0;color:#102033;vertical-align:top}
.st-jvl-table th:first-child,.st-jvl-table td:first-child{position:sticky;left:0;z-index:3}
.st-jvl-table th:first-child{background:var(--st-blue)}
.st-jvl-table td:first-child{font-weight:800;color:#091827;background:#fff;min-width:160px}
.st-jvl-table tbody tr:nth-child(even) td{background:#fbfcfc}
.st-jvl-table tbody tr:nth-child(even) td:first-child{background:#fbfcfc}
.st-spec-cta{margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033}
.st-spec-cta p{margin:8px 0 12px}
.st-spec-cta a{display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700}
@media (max-width:760px){.st-jvl-specs{margin:34px 0 42px}.st-jvl-title{font-size:20px}.st-jvl-lead{font-size:13px}.st-jvl-detail summary{grid-template-columns:72px 1fr auto;gap:10px;padding:15px 14px}.st-jvl-code{font-size:20px}.st-jvl-summary strong{font-size:15px}.st-jvl-summary em{font-size:12px}.st-jvl-toggle{min-width:82px;min-height:32px;font-size:12px}.st-jvl-panel{padding:14px}.st-jvl-scroll-note{display:block}.st-jvl-table{min-width:860px}}
</style>
<section class="st-jvl-specs" aria-labelledby="st-jvl-title-102">
<h3 class="st-jvl-title" id="st-jvl-title-102">產品規格詳情</h3>
<p class="st-jvl-lead">以下依 JVL 官方 MAC 與 MIS / ServoStep 頁面整理，重點放在整合伺服、整合步進與步進控制器的選型辨識。未列於官方公開頁面的欄位不另行推測。</p>
${sections.map(renderSection).join('\n')}
<div class="st-spec-cta">
  <strong>需要確認 JVL 整合馬達選型？</strong>
  <p>請提供應用軸數、負載、速度、扭矩、通訊介面與防護等級需求，星泰可協助比對 MAC、MIS 或 SMC 系列。</p>
  <a href="${inquiryHref}" aria-label="詢問 JVL 整合型伺服馬達及步進馬達規格">詢問星泰</a>
</div>
</section>
</div>
<!-- standardized-spec-module:end -->`;

const html = fs.readFileSync(file, 'utf8');
const pattern = /<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i;
if (!pattern.test(html)) throw new Error('No standardized spec block found for 102');
const next = html.replace(pattern, moduleHtml);
fs.writeFileSync(file, next, 'utf8');
console.log('updated 102');
