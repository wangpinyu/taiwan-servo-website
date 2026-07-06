import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inquiryHref = '../../skipped/96da16962be2-inquiry.html';

const moduleConfigs = [
  {
    productId: '208',
    code: 'GWB AKN',
    summary: 'Metal Bellows Couplings GWB AKN',
    description: '適用於需要高扭轉剛性、低背隙與精密同步的軸連接場合。',
    sourceNote: '依 RINGFEDER 官方 GWB AKN 產品頁與技術文件整理；逗號小數格式依原廠資料呈現。',
    downloads: [
      ['Product Paper (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-metal-bellows-couplings-gwb-en.pdf'],
      ['Tech Paper GWB AKN (PDF)', 'https://www.ringfeder.com/globalassets/downloads/tech-paper/couplings/metal-bellows-couplings-gwb/tech-paper-ringfeder-metal-bellows-couplings-gwb-akn-en.pdf'],
      ['Manual (PDF)', 'https://www.ringfeder.com/globalassets/downloads/instructions/metal-bellows-couplings-gwb/installation-and-operations-manual-ringfeder-metal-bellows-couplings-gwb-en.pdf'],
    ],
    columns: ['Size', 'L (mm)', 'd1 min (mm)', 'd1 max (mm)', 'H (mm)', 'Torque T (Nm)', 'n max (1/min)', 'Delta Ka (mm)', 'Delta Kw (degree)', 'Delta Kr (mm)', 'DG1 (mm)', 'TA1 (Nm)'],
    rows: [
      ['18', '63', '8', '26', '48', '22', '12700', '0,5', '1,5', '0,2', '5', '6'],
      ['30', '65', '10', '30', '56', '36', '10200', '0,4', '1,0', '0,1', '6', '12'],
      ['60', '78', '12', '35', '67', '75', '8600', '0,4', '1,0', '0,1', '8', '30'],
      ['80', '90', '14', '42', '84', '95', '6800', '0,4', '1,0', '0,2', '10', '60'],
      ['150', '90', '14', '42', '84', '180', '6800', '0,4', '1,0', '0,2', '10', '85'],
      ['200', '99', '22', '46', '93', '240', '6300', '0,4', '1,0', '0,2', '12', '100'],
      ['300', '104', '24', '60', '110', '360', '5900', '0,4', '1,0', '0,2', '12', '120'],
      ['500', '111', '35', '64', '122', '600', '4900', '0,5', '1,0', '0,2', '14', '190'],
    ],
  },
  {
    productId: '209',
    code: 'TND',
    summary: 'Steel Disc Couplings TND',
    description: '鋼片式聯軸器系列，涵蓋無間隔套、長間隔套、垂直型與快拆型配置。',
    sourceNote: '依 RINGFEDER 官方 Steel Disc Couplings TND 產品頁與 Product Paper 摘要整理。',
    downloads: [
      ['Product Paper TND (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-steel-disc-couplings-tnd-en.pdf'],
      ['Official Product Page', 'https://www.ringfeder.com/products/steel-disc-couplings/'],
    ],
    columns: ['Type', 'Sizes', 'Bore d (mm)', 'OD D1 (mm)', 'Hub distance E (mm)', 'Overall length L (mm)', 'n max (1/min)', 'Torque TKN (Nm)'],
    rows: [
      ['TND HSH', '11', '32-215', '70.5-510', '7.5-47', '86.5-527', '1,700-12,200', '170-130,000'],
      ['TND HDH', '11', '32-215', '70.5-510', '60-350', '139-830', '1,700-12,200', '170-130,000'],
      ['TND HDV', '9', '25-175', '70.5-345', '60-300', '105-526', '2,500-12,200', '170-44,000'],
      ['TND VDV', '9', '25-120', '70.5-345', '60-300', '70-352', '2,500-12,200', '170-44,000'],
      ['TND OCO', '4', '32-65', '70.5-140.5', '31.2-55', '110-175', '4,600-8,400', '170-1,750'],
      ['TND XSX', '7', '38-160', '116-345', '10.5-32.5', '120.5-432.5', '2,100-3,600', '750-44,000'],
      ['TND XDX', '7', '38-160', '116-345', '100-300', '210-700', '2,100-3,600', '750-44,000'],
      ['TND QCQ', '2', '38-70', '116-145', '46.5-55', '156.5-175', '3,600', '750-1,750'],
    ],
  },
  {
    productId: '210',
    code: 'TNZ',
    summary: 'Gear Couplings TNZ ZCA / ZCB',
    description: '齒式聯軸器，適合高扭矩傳動與需要補償偏差的重載應用。',
    sourceNote: '依 RINGFEDER 官方 TNZ ZCA/ZCB 產品頁與 Product Paper 摘錄主要技術表。',
    downloads: [
      ['Product Paper TNZ (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-gear-couplings-tnz-en.pdf'],
      ['Official Product Page', 'https://www.ringfeder.com/products/gear-couplings/tnz-zcaz-zcbz/'],
    ],
    columns: ['Size', 'Identifier ZCA', 'TKN (Nm)', 'TKmax (Nm)', 'd1k min (mm)', 'd1k max (mm)', 'D1 (mm)', 'D6 (mm)', 'L min (mm)'],
    rows: [
      ['69', 'XC4106', '1,750', '3,500', '12', '50', '111', '81.5', '153'],
      ['85', 'XC4108', '2,750', '5,500', '18', '60', '152', '103.5', '193'],
      ['107', 'XC4110', '5,500', '11,000', '28', '75', '178', '127.5', '239'],
      ['133', 'XC4113', '8,500', '17,000', '40', '95', '213', '156', '281'],
      ['152', 'XC4115', '13,500', '27,000', '50', '110', '240', '181', '333'],
      ['179', 'XC4117', '22,000', '44,000', '60', '130', '280', '209', '388'],
      ['209', 'XC4120', '35,000', '70,000', '70', '155', '318', '245.5', '428'],
      ['234', 'XC4123', '43,000', '86,000', '85', '170', '346', '274', '466'],
      ['254', 'XC4125', '68,000', '136,000', '95', '190', '389', '307', '552'],
      ['279', 'XC4127', '82,000', '164,000', '110', '210', '425', '334.5', '608'],
      ['305', 'XC4130', '150,000', '300,000', '120', '230', '457', '366', '648'],
      ['355', 'XC4135', '195,000', '390,000', '130', '270', '527', '423', '734'],
    ],
  },
  {
    productId: '211',
    code: 'TNK TKVO',
    summary: 'Barrel Couplings TNK TKVO',
    description: '桶形聯軸器，常用於起重設備與重載捲筒傳動。',
    sourceNote: '依 RINGFEDER 官方 Barrel Couplings TNK 產品頁與 TNK TKVO 技術文件摘要整理。',
    downloads: [
      ['Product Paper TNK (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-barrel-couplings-tnk-en.pdf'],
      ['Tech Paper TNK TKVO (PDF)', 'https://www.ringfeder.com/globalassets/downloads/tech-paper/couplings/barrel-couplings-tnk/tech-paper-ringfeder-barrel-couplings-tnk-tkvo-en.pdf'],
    ],
    columns: ['Type', 'Sizes', 'Standard', 'Bore d1 (mm)', 'Outer diameter D (mm)', 'Overall length L (mm)', 'Torque TKmax (Nm)', 'Radial load Frad (N)'],
    rows: [
      ['TNK TKVO', '18', 'SEB 666212', '20-440', '250-850', '95-450', 'up to 815,000', 'up to 490,000'],
    ],
  },
  {
    productId: '212',
    code: 'TNF 5571',
    summary: 'Flange Couplings TNF 5571',
    description: '法蘭式聯軸器，透過摩擦鎖固建立無背隙軸連接。',
    sourceNote: '依 RINGFEDER 官方 Flange Couplings TNF / TNF 5571 產品頁與技術文件摘要整理。',
    downloads: [
      ['Product Paper TNF (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-flange-couplings-tnf-en.pdf'],
      ['Tech Paper TNF 5571 (PDF)', 'https://www.ringfeder.com/globalassets/downloads/tech-paper/couplings/flange-couplings-tnf/tech-paper-ringfeder-flange-couplings-tnf-5571-en.pdf'],
      ['Manual TNF 5571 (PDF)', 'https://www.ringfeder.com/globalassets/downloads/instructions/flange-couplings-tnf/installation-and-operations-manual-ringfeder-flange-couplings-tnf-5571-en.pdf'],
    ],
    columns: ['Type', 'Sizes', 'Clamping', 'Shaft diameter dw (mm)', 'Outer diameter A (mm)', 'Total length Ltotal (mm)', 'Torque T (Nm)'],
    rows: [
      ['TNF 5571', '20', 'External or internal clamping', '70-540', '240-1,200', '150-750', '6,900-2.2 million'],
    ],
  },
  {
    productId: '213',
    code: 'TNR 2424.1',
    summary: 'Torsional Highflex Couplings TNR',
    description: '高彈性聯軸器，適合需要扭振隔離與彈性補償的傳動系統。',
    sourceNote: '依 RINGFEDER 官方 TNR 2424.1 產品頁與 Product Paper 技術表摘錄整理。',
    downloads: [
      ['Product Paper TNR (PDF)', 'https://www.ringfeder.com/globalassets/downloads/product-paper/product-paper-tech-paper-ringfeder-torsional-highflex-couplings-tnr-en.pdf'],
      ['Official Product Page', 'https://www.ringfeder.com/products/torsional-highflex-couplings/tnr-2424.1/'],
    ],
    columns: ['Size', 'd1f max (mm)', 'SAE size', 'A (mm)', 'DPC7 (mm)', 'd7 (mm)', 'D (mm)', 'C1 (mm)', 'L (mm)', 'FK (mm)', 'X1 (mm)', 'Weight Gwub (kg)'],
    rows: [
      ['120.1-06.5', '50', '6.5', '215.9', '200.0', '9.5', '120', '65', '84', '13', '28', '4.1'],
      ['120.1-07.5', '50', '7.5', '241.3', '222.3', '9.5', '120', '65', '84', '13', '28', '4.4'],
      ['120.1-08.0', '50', '8.0', '263.5', '244.5', '11.0', '120', '65', '84', '13', '28', '4.7'],
      ['160.1-06.5', '70', '6.5', '215.9', '200.0', '9.5', '160', '90', '111', '15', '23', '8.6'],
      ['160.1-07.5', '70', '7.5', '241.3', '222.3', '9.5', '160', '90', '111', '15', '23', '8.9'],
      ['200.1-07.5', '90', '7.5', '241.3', '222.3', '9.5', '200', '115', '140', '18', '28', '16.9'],
      ['200.1-10.0', '90', '10.0', '314.3', '295.3', '11.0', '200', '115', '140', '18', '28', '18.4'],
      ['260.1-10.0', '115', '10.0', '314.3', '295.3', '11.0', '260', '140', '172', '24', '40', '35.0'],
      ['260.1-14.0', '115', '14.0', '466.7', '438.2', '14.5', '260', '140', '172', '24', '40', '40.4'],
      ['320.1-14.0', '145', '14.0', '466.7', '438.2', '14.5', '320', '175', '212', '26', '45', '73.5'],
      ['400.1-16.0', '185', '16.0', '517.5', '489.0', '14.5', '400', '230', '271', '31', '46', '142.0'],
    ],
  },
  {
    productId: '335',
    code: 'RLP / RLB',
    summary: 'Pin & Bush Couplings',
    description: '彈性銷套式聯軸器，適用於一般動力傳動與彈性補償需求。',
    sourceNote: '依 RINGFEDER 官方 RLP 產品頁與 RLB 安裝操作手冊整理；RLB 型式完整選型表需依實際需求向星泰確認。',
    downloads: [
      ['RLB Manual (PDF)', 'https://www.ringfeder.com/globalassets/downloads/instructions/pin--bush-couplings-rlp--rlb/installation-and-operations-manual-ringfeder-pin-and-bush-couplings-rlb-en.pdf'],
      ['Official RLP Product Page', 'https://www.ringfeder.com/products/pin-and-bush-couplings/rlp/'],
    ],
    columns: ['Type', 'Sizes', 'Bore d1/d2 (mm)', 'Outer diameter D1 (mm)', 'Total length L1 (mm)', 'Torque TKN (Nm)', 'Document status'],
    rows: [
      ['RLP', '10', '16-180', '90-380', '83-368', '325-37,500', 'Official product page'],
      ['RLB', '請洽星泰', '請洽星泰', '請洽星泰', '請洽星泰', '請洽星泰', 'Official manual available'],
    ],
  },
  {
    productId: '336',
    code: 'RLT / RLU',
    summary: 'Tyre Couplings',
    description: '輪胎式彈性聯軸器，適合需要吸收振動、補償偏差與降低衝擊的傳動場合。',
    sourceNote: '依 RINGFEDER 官方 Tyre Couplings、RLT 與 RLU 產品頁摘要整理。',
    downloads: [
      ['Official Tyre Couplings Page', 'https://www.ringfeder.com/products/tyre-couplings/'],
      ['RLT Product Page', 'https://www.ringfeder.com/products/tyre-couplings/rlt/'],
      ['RLU Product Page', 'https://www.ringfeder.com/products/tyre-couplings/rlu/'],
    ],
    columns: ['Type', 'Sizes', 'Bore diameter (mm)', 'Outer diameter D1 (mm)', 'Total length (mm)', 'Torque TKN (Nm)'],
    rows: [
      ['RLT', '15', '10-190', '104-628', '68-294', '24-14,675'],
      ['RLU', '13', '28-171', '90-533', '84-375', '22-9,600'],
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

function buildLink([label, url], code) {
  return `<a class="st-ring-file" href="${htmlEscape(url)}" target="_blank" rel="noopener" aria-label="${htmlEscape(`${code} ${label}`)}">${htmlEscape(label)}</a>`;
}

function buildModule(config) {
  const headers = config.columns.map((label) => `<th scope="col">${htmlEscape(label)}</th>`).join('');
  const body = config.rows.map((row) => {
    return `<tr>${row.map((cell, index) => `<td data-label="${htmlEscape(config.columns[index])}">${htmlEscape(cell)}</td>`).join('')}</tr>`;
  }).join('\n');
  const downloads = config.downloads.map((item) => buildLink(item, config.code)).join('');
  const tableLabel = `${config.code} official technical data`;

  return `<!-- standardized-spec-module:start -->
<div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
<style type="text/css">
.st-ring-specs{--st-green:#009640;--st-dark:#0b1c2e;--st-soft:#f7fbf8;--st-line:#dfe9e3;--st-blue:#0b6ea8;margin:50px 0 60px;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;color:var(--st-dark);line-height:1.65}
.st-ring-specs *{box-sizing:border-box}
.st-ring-title{font-size:22px;color:var(--st-dark);margin:0 0 18px;border-left:5px solid var(--st-green);padding-left:15px;font-weight:800;line-height:1.35;letter-spacing:0}
.st-ring-lead{margin:0 0 18px;padding:14px 16px;border:1px solid var(--st-line);border-radius:8px;background:linear-gradient(135deg,#fff 0%,var(--st-soft) 100%);font-size:14px;line-height:1.7;color:#4b5c6b}
.st-ring-list{display:grid;gap:12px}
.st-ring-detail{border:1px solid var(--st-line);border-radius:8px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(11,28,46,.04)}
.st-ring-detail summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:150px 1fr auto;gap:18px;align-items:center;padding:18px 20px;min-height:78px}
.st-ring-detail summary::-webkit-details-marker{display:none}
.st-ring-code{font-size:24px;line-height:1.05;font-weight:900;color:var(--st-green);letter-spacing:0}
.st-ring-summary strong{display:block;font-size:17px;line-height:1.35;color:var(--st-dark);font-weight:800}
.st-ring-summary em{display:block;margin-top:5px;font-style:normal;font-size:13px;line-height:1.55;color:#526372}
.st-ring-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:92px;min-height:34px;border-radius:999px;border:1px solid var(--st-line);color:var(--st-green);background:#fff;font-size:13px;font-weight:800;line-height:1}
.st-ring-toggle:before{content:"+";margin-right:5px;font-size:18px;line-height:1}
.st-ring-detail[open] .st-ring-toggle{background:var(--st-green);color:#fff;border-color:var(--st-green)}
.st-ring-detail[open] .st-ring-toggle:before{content:"-"}
.st-ring-panel{border-top:1px solid var(--st-line);padding:18px 20px 22px;background:#fff}
.st-ring-downloads{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.st-ring-file{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:5px;padding:7px 11px;font-size:12px;font-weight:800;line-height:1.25;text-align:center;white-space:nowrap;background:#eef6ff;color:#0b6ea8;border:1px solid #b9daf2;text-decoration:none}
.st-ring-file:hover,.st-ring-file:focus{background:#dff0ff;color:#074e78}
.st-ring-source-note{margin:0 0 14px;font-size:13px;line-height:1.65;color:#667685}
.st-ring-scroll-note{display:none;margin:0 0 8px;font-size:12px;color:#667685}
.st-ring-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--st-line);border-radius:8px;background:#fff;-webkit-overflow-scrolling:touch}
.st-ring-table{min-width:960px;width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
.st-ring-table th{position:sticky;top:0;background:#0b6ea8;color:#fff;text-align:center;padding:10px 8px;border-right:1px solid rgba(255,255,255,.24);font-weight:800;white-space:nowrap;z-index:2}
.st-ring-table td{padding:10px 8px;text-align:center;border-top:1px solid #e8eef0;color:#102033;vertical-align:middle;white-space:nowrap}
.st-ring-table th:first-child,.st-ring-table td:first-child{position:sticky;left:0;z-index:3}
.st-ring-table th:first-child{background:#0b6ea8}
.st-ring-table td:first-child{text-align:left;font-weight:800;color:#091827;background:#fff}
.st-ring-table tbody tr:nth-child(even) td{background:#fbfcfc}
.st-ring-table tbody tr:nth-child(even) td:first-child{background:#fbfcfc}
.st-spec-cta{margin-top:18px;padding:16px 18px;border:1px solid #dbe8e2;border-radius:8px;background:#f7fbf8;color:#102033}
.st-spec-cta p{margin:8px 0 12px}
.st-spec-cta a{display:inline-block;padding:9px 16px;border-radius:6px;background:#079b4b;color:#fff;text-decoration:none;font-weight:700}
@media (max-width:760px){.st-ring-specs{margin:36px 0 44px}.st-ring-title{font-size:20px}.st-ring-lead{font-size:13px}.st-ring-detail summary{grid-template-columns:88px 1fr auto;gap:10px;padding:15px 14px;min-height:72px}.st-ring-code{font-size:20px}.st-ring-summary strong{font-size:15px}.st-ring-summary em{font-size:12px}.st-ring-toggle{min-width:82px;min-height:32px;font-size:12px}.st-ring-panel{padding:14px}.st-ring-scroll-note{display:block}.st-ring-table{min-width:860px}.st-ring-file{white-space:normal}}
</style>
<section class="st-ring-specs" aria-labelledby="st-ring-title-${htmlEscape(config.productId)}">
<h3 class="st-ring-title" id="st-ring-title-${htmlEscape(config.productId)}">產品規格詳情</h3>
<p class="st-ring-lead">本區依 RINGFEDER 官方公開資料整理，保留原廠欄位與單位，協助快速比對系列規格與文件入口。</p>
<div class="st-ring-list">
<details class="st-ring-detail" open>
<summary><span class="st-ring-code">${htmlEscape(config.code)}</span><span class="st-ring-summary"><strong>${htmlEscape(config.summary)}</strong><em>${htmlEscape(config.description)}</em></span><span class="st-ring-toggle">展開 / 收合</span></summary>
<div class="st-ring-panel">
<div class="st-ring-downloads">${downloads}</div>
<p class="st-ring-source-note">${htmlEscape(config.sourceNote)}</p>
<p class="st-ring-scroll-note">表格可左右滑動檢視完整欄位。</p>
<div class="st-ring-table-wrap" role="region" aria-label="${htmlEscape(tableLabel)}">
<table class="st-ring-table">
<thead><tr>${headers}</tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>
<div class="st-spec-cta">
  <strong>需要協助確認 RINGFEDER 選型或替代規格？</strong>
  <p>可提供扭矩、轉速、軸徑、安裝空間與使用環境，由星泰協助確認適合的系列與尺寸。</p>
  <a href="${inquiryHref}" aria-label="詢問 ${htmlEscape(config.code)} RINGFEDER 規格">詢問此系列規格</a>
</div>
</div>
</details>
</div>
</section>
</div>
<!-- standardized-spec-module:end -->`;
}

for (const config of moduleConfigs) {
  const relPath = `site/preview/products/detail/${config.productId}.html`;
  const abs = path.join(root, relPath);
  const html = fs.readFileSync(abs, 'utf8');
  const moduleHtml = buildModule(config);
  const next = html.replace(/<!-- standardized-spec-module:start -->[\s\S]*?<!-- standardized-spec-module:end -->/i, moduleHtml);
  if (html === next) {
    throw new Error(`No standardized spec block replaced in ${relPath}`);
  }
  fs.writeFileSync(abs, next, 'utf8');
  console.log(`updated ${relPath}`);
}
