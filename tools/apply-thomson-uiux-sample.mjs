import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'site', 'preview', 'products', 'detail', '100.html');
const html = readFileSync(target, 'utf8');

const start = html.indexOf('<div class="main-content"');
const endMarker = '\n                            <div class="model st2 mt3 lt4">';
const end = html.indexOf(endMarker, start);

if (start < 0 || end < 0) {
  throw new Error('Could not locate Thomson detail/100 main content block.');
}

const imgMain = '../../../assets-cache/94f420e7fb12-5a78dfc9920d30a7f8165a17e05bb558.jpg';
const imgElectrakHd = '../../../assets-cache/76559437ed79-Thomson-20-E9-9B-BB-E5-8B-95-E6-8E-A8-E6-A1-BF-20HD-E7-B3-BB-E5-88-97.jpg';
const imgMaxJac = '../../../assets-cache/e587ba9945fa-Thomson-20-E9-9B-BB-E5-8B-95-E6-8E-A8-E6-A1-BF-20MAX-20JAC-E7-B3-BB-E5-88-97-1-.jpg';
const imgStainless = '../../../assets-cache/64554acee1e3-Thomson-20SA-20_Stainless_Steel_Actuator_bren.jpg';
const docActuator = '../../../documents-cache/480fae40e035-Thomson-E9-9B-BB-E5-8B-95-E7-BC-B8.pdf';
const docElectrak = '../../../documents-cache/a23a1315ab21-Thosmon-Electrak.pdf';
const docStainless = '../../../documents-cache/19eead59f8c6-Thomson-SA-20_Stainless_Steel_Actuator_bren.pdf';
const inquiry = '../../skipped/96da16962be2-inquiry.html';

const replacement = String.raw`<div class="main-content" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
<style>
  .thomson-page { --tm-green:#009640; --tm-green-2:#4fa96b; --tm-dark:#0f2437; --tm-muted:#56636f; --tm-line:#dde8e1; --tm-soft:#f4faf7; font-family: Arial, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; color: var(--tm-dark); line-height: 1.7; }
  .thomson-page * { box-sizing: border-box; }
  .thomson-hero { background: linear-gradient(135deg,#f7fbf8 0%,#eef7f1 100%); border: 1px solid var(--tm-line); border-radius: 8px; padding: 44px 34px; margin-bottom: 42px; display: grid; grid-template-columns: 1.25fr .75fr; gap: 30px; align-items: center; }
  .thomson-kicker { color: var(--tm-green); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-size: 13px; margin-bottom: 12px; }
  .thomson-hero h2 { margin: 0 0 16px; font-size: 34px; line-height: 1.25; font-weight: 900; color: var(--tm-dark); }
  .thomson-hero p { margin: 0; font-size: 16px; color: #485764; max-width: 760px; }
  .thomson-hero img { width: 100%; max-height: 280px; object-fit: contain; background: #fff; border-radius: 8px; border: 1px solid var(--tm-line); padding: 18px; }
  .thomson-section-title { font-size: 24px; color: var(--tm-dark); margin: 42px 0 20px; border-left: 5px solid var(--tm-green); padding-left: 14px; font-weight: 900; }
  .thomson-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 42px; }
  .thomson-feature { border: 1px solid var(--tm-line); border-top: 4px solid var(--tm-green); border-radius: 8px; padding: 22px; background: #fff; min-height: 190px; }
  .thomson-feature strong { display:block; font-size: 18px; margin-bottom: 10px; color: var(--tm-dark); }
  .thomson-feature p { margin: 0; color: var(--tm-muted); font-size: 14px; }
  .thomson-series-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-bottom: 38px; }
  .thomson-series-card { border: 1px solid var(--tm-line); border-radius: 8px; overflow: hidden; background: #fff; display:flex; flex-direction:column; box-shadow: 0 4px 12px rgba(15,36,55,.04); }
  .thomson-series-head { background: linear-gradient(90deg, var(--tm-green), var(--tm-green-2)); color: #fff; padding: 14px 18px; font-weight: 900; font-size: 18px; text-align:center; }
  .thomson-series-img { height: 190px; display:flex; align-items:center; justify-content:center; border-bottom: 1px solid var(--tm-line); background:#fff; }
  .thomson-series-img img { width: 100%; height: 100%; object-fit: contain; padding: 18px; }
  .thomson-series-body { padding: 18px; display:flex; flex-direction:column; gap:12px; flex:1; }
  .thomson-series-body p { margin:0; color:var(--tm-muted); font-size:14px; }
  .thomson-mini-spec { width:100%; border-collapse:collapse; font-size:13px; }
  .thomson-mini-spec th, .thomson-mini-spec td { border-bottom:1px solid #edf2ef; padding:7px 0; text-align:left; vertical-align:top; }
  .thomson-mini-spec th { width:42%; color:var(--tm-green); font-weight:800; }
  .thomson-card-link { margin-top:auto; color:var(--tm-green); text-decoration:none; font-weight:800; }
  .thomson-specs { margin: 36px 0 42px; color: var(--tm-dark); }
  .thomson-specs-head { border-left:5px solid var(--tm-green); padding-left:14px; margin-bottom:18px; }
  .thomson-specs-head h2 { margin:0; font-size:28px; font-weight:900; }
  .thomson-detail { border:1px solid var(--tm-line); border-radius:8px; background:#fff; overflow:hidden; }
  .thomson-detail summary { list-style:none; cursor:pointer; display:flex; align-items:center; gap:16px; padding:16px 18px; min-height:70px; }
  .thomson-detail summary::-webkit-details-marker { display:none; }
  .thomson-code { color:var(--tm-green); font-size:26px; font-weight:900; min-width:78px; }
  .thomson-summary { flex:1; display:flex; flex-direction:column; gap:2px; }
  .thomson-summary strong { font-size:18px; }
  .thomson-summary span { color:var(--tm-muted); font-size:14px; }
  .thomson-toggle { border:1px solid var(--tm-line); color:var(--tm-green); border-radius:999px; padding:7px 13px; font-weight:800; white-space:nowrap; }
  .thomson-detail[open] .thomson-toggle { background:var(--tm-green); color:#fff; border-color:var(--tm-green); }
  .thomson-panel { border-top:1px solid var(--tm-line); padding:18px; }
  .thomson-table-wrap { overflow-x:auto; border:1px solid var(--tm-line); border-radius:8px; background:#fff; margin-bottom:16px; }
  .thomson-table { width:100%; min-width:760px; border-collapse:collapse; }
  .thomson-table th { background:var(--tm-green); color:#fff; border:1px solid #0b8640; padding:10px; text-align:center; font-weight:900; }
  .thomson-table td { border:1px solid #e7eee9; padding:10px; text-align:center; }
  .thomson-table tbody th { position:sticky; left:0; z-index:1; background:#f4faf7; color:var(--tm-dark); text-align:left; min-width:190px; }
  .thomson-downloads { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:10px; }
  .thomson-download { border:1px solid var(--tm-line); border-radius:8px; background:#fff; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .thomson-download strong { font-size:14px; line-height:1.35; }
  .thomson-download span { color:var(--tm-muted); font-size:13px; }
  .thomson-download a { align-self:flex-start; padding:7px 12px; border-radius:6px; background:var(--tm-green); color:#fff; text-decoration:none; font-weight:800; }
  .thomson-cta { margin-top:18px; padding:16px 18px; border:1px solid var(--tm-line); border-radius:8px; background:var(--tm-soft); }
  .thomson-cta p { margin:8px 0 12px; color:var(--tm-muted); }
  .thomson-cta a, .thomson-primary-link { display:inline-block; padding:9px 16px; border-radius:6px; background:var(--tm-green); color:#fff; text-decoration:none; font-weight:800; }
  .thomson-app-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-bottom:42px; }
  .thomson-app { border:1px solid var(--tm-line); border-top:4px solid var(--tm-green); border-radius:8px; background:#fff; padding:22px; }
  .thomson-app strong { display:block; font-size:17px; margin-bottom:8px; }
  .thomson-app p { margin:0; color:var(--tm-muted); font-size:14px; }
  .thomson-resource { background:var(--tm-soft); padding:28px 22px; border:1px solid var(--tm-line); border-radius:8px; margin-top:36px; }
  .thomson-resource-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; }
  .thomson-resource-item { background:#fff; border:1px solid var(--tm-line); border-left:5px solid var(--tm-green); border-radius:8px; padding:14px; display:flex; justify-content:space-between; gap:12px; align-items:center; }
  .thomson-resource-item strong { display:block; margin-bottom:4px; }
  .thomson-resource-item span { color:var(--tm-muted); font-size:13px; }
  .thomson-resource-item a { color:var(--tm-green); font-weight:900; text-decoration:none; white-space:nowrap; }
  @media (max-width: 900px) { .thomson-hero, .thomson-feature-grid, .thomson-series-grid, .thomson-app-grid { grid-template-columns:1fr; } .thomson-hero h2 { font-size:28px; } }
  @media (max-width: 640px) { .thomson-page { font-size:15px; } .thomson-detail summary { align-items:flex-start; gap:10px; } .thomson-code { min-width:54px; font-size:22px; } .thomson-toggle { font-size:13px; padding:6px 10px; } }
</style>

<div class="thomson-page">
  <section class="thomson-hero">
    <div>
      <div class="thomson-kicker">Thomson Precision Linear Actuators</div>
      <h2>高精度線性運動，適合設備自動化整合</h2>
      <p>Thomson 電動缸可用於需要可控制推力、速度與行程的位置控制應用。本頁整理產品系列、規格詳情、應用領域與技術資料下載，方便工程人員快速比較與詢問。</p>
    </div>
    <img src="${imgMain}" alt="Thomson 電動缸產品圖片" loading="lazy" />
  </section>

  <section>
    <h3 class="thomson-section-title">主內容區</h3>
    <div class="thomson-feature-grid">
      <div class="thomson-feature"><strong>可取代氣壓缸的精密控制</strong><p>適合需要重複定位、速度控制與推力控制的設備，用電動缸提高可控性與製程一致性。</p></div>
      <div class="thomson-feature"><strong>系列選型清楚</strong><p>依照推力、行程、速度、防護等條件比較不同 Thomson 電動缸系列，降低初步選型時間。</p></div>
      <div class="thomson-feature"><strong>文件與詢問流程銜接</strong><p>技術資料集中於下載區，規格模組提供可比較表格與詢問入口，便於後續確認型號與供貨狀態。</p></div>
    </div>
  </section>

  <section>
    <h3 class="thomson-section-title">產品系列</h3>
    <div class="thomson-series-grid">
      <article class="thomson-series-card">
        <div class="thomson-series-head">PC Series 精密電動缸</div>
        <div class="thomson-series-img"><img src="${imgMain}" alt="Thomson PC Series 精密電動缸" loading="lazy" /></div>
        <div class="thomson-series-body">
          <p>以精密線性運動與設備整合為主，適合需要穩定推力與定位控制的自動化機構。</p>
          <table class="thomson-mini-spec"><tbody><tr><th>規格重點</th><td>ball screw / IP65</td></tr><tr><th>最大行程</th><td>依 PC 25 / PC 32 / PC 40 比較</td></tr><tr><th>用途</th><td>精密推進、定位與設備改造</td></tr></tbody></table>
          <a class="thomson-card-link" href="#thomson-specs">查看產品規格詳情</a>
        </div>
      </article>
      <article class="thomson-series-card">
        <div class="thomson-series-head">Electrak 系列電動推桿</div>
        <div class="thomson-series-img"><img src="${imgElectrakHd}" alt="Thomson Electrak 系列電動推桿" loading="lazy" /></div>
        <div class="thomson-series-body">
          <p>適合一般工業自動化與重載推桿應用；詳細選型需依型錄與現場條件確認。</p>
          <table class="thomson-mini-spec"><tbody><tr><th>資料類型</th><td>系列型錄</td></tr><tr><th>適用</th><td>工業推桿、設備開合、線性推進</td></tr><tr><th>備註</th><td>規格依官方文件與實際需求確認</td></tr></tbody></table>
          <a class="thomson-card-link" href="#downloads">查看技術資料</a>
        </div>
      </article>
      <article class="thomson-series-card">
        <div class="thomson-series-head">特殊環境與不鏽鋼系列</div>
        <div class="thomson-series-img"><img src="${imgStainless}" alt="Thomson 不鏽鋼食品級線性致動器" loading="lazy" /></div>
        <div class="thomson-series-body">
          <p>用於食品級、不鏽鋼或特殊環境需求時，應優先確認材質、防護與清潔條件。</p>
          <table class="thomson-mini-spec"><tbody><tr><th>資料類型</th><td>系列資料</td></tr><tr><th>適用</th><td>食品級設備、特殊環境、清潔需求</td></tr><tr><th>備註</th><td>依應用環境確認型號</td></tr></tbody></table>
          <a class="thomson-card-link" href="#downloads">查看技術資料</a>
        </div>
      </article>
    </div>
  </section>

  <!-- standardized-spec-module:start -->
  <div class="st-standardized-spec-module" data-standard-module="產品規格詳情">
  <section class="thomson-specs" id="thomson-specs">
    <div class="thomson-specs-head"><h2>產品規格詳情</h2></div>
    <details class="thomson-detail" open>
      <summary>
        <span class="thomson-code">PC</span>
        <span class="thomson-summary"><strong>PC Series 精密電動缸</strong><span>保留原廠表格欄位與單位，供 PC 25 / PC 32 / PC 40 初步比較。</span></span>
        <span class="thomson-toggle">展開 / 收合</span>
      </summary>
      <div class="thomson-panel">
        <div class="thomson-table-wrap" aria-label="PC Series 規格表，可左右捲動">
          <table class="thomson-table">
            <thead><tr><th>Specifications</th><th>PC 25</th><th>PC 32</th><th>PC 40</th></tr></thead>
            <tbody>
              <tr><th>Screw Type</th><td>ball screw</td><td>ball screw</td><td>ball screw</td></tr>
              <tr><th>Max. Load (Fx): N (lbf)</th><td>1250 (281)</td><td>3200 (719)</td><td>6000 (1349)</td></tr>
              <tr><th>Max. Stroke: mm (in)</th><td>600 (23.6)</td><td>1200 (47.2)</td><td>1200 (47.2)</td></tr>
              <tr><th>Max. Speed: m/s (ft/s)</th><td>1.33 (4.5)</td><td>1.00 (3.3)</td><td>1.66 (5.5)</td></tr>
              <tr><th>Profile size (w x h): mm (in)</th><td>34 x 34 (1.3 x 1.3)</td><td>45 x 45 (1.8 x 1.8)</td><td>55 x 55 (2.2 x 2.2)</td></tr>
              <tr><th>Screw Diameter: mm (in)</th><td>10 (0.39)</td><td>12 (0.47)</td><td>20 (0.79)</td></tr>
              <tr><th>Screw Lead: mm (in)</th><td>3, 10 (0.118, 0.39)</td><td>4, 10 (0.157, 0.39)</td><td>5, 10, 20 (0.197, 0.39, 0.79)</td></tr>
              <tr><th>Protection class</th><td>IP65</td><td>IP65</td><td>IP65</td></tr>
            </tbody>
          </table>
        </div>
        <div class="thomson-downloads">
          <div class="thomson-download"><strong>Thomson 電動缸型錄</strong><span>系列級 PDF，供初步選型使用。</span><a href="${docActuator}" target="_blank" rel="noopener" aria-label="下載 Thomson 電動缸型錄 PDF">PDF</a></div>
          <div class="thomson-download"><strong>PC Series 多語文件</strong><span>PC Series 文件需依實際型號與語言版本確認，請由星泰協助提供。</span><a href="${inquiry}" aria-label="詢問 PC Series 文件與規格">詢問規格</a></div>
        </div>
      </div>
    </details>
    <div class="thomson-cta">
      <strong>需要確認 Thomson 電動缸型號？</strong>
      <p>請提供推力、行程、速度、安裝空間、使用環境與控制器需求，星泰可協助比對系列與文件。</p>
      <a href="${inquiry}" aria-label="開啟 Thomson 電動缸詢問單">加入詢問單</a>
    </div>
  </section>
  </div>
  <!-- standardized-spec-module:end -->

  <section>
    <h3 class="thomson-section-title">應用領域</h3>
    <div class="thomson-app-grid">
      <div class="thomson-app"><strong>自動化設備推進與定位</strong><p>適合需要穩定線性推進、定位與重複動作的機構。</p></div>
      <div class="thomson-app"><strong>氣壓缸替代與節能改造</strong><p>當設備需要更高可控性、降低空壓系統依賴時，可評估電動缸方案。</p></div>
      <div class="thomson-app"><strong>特殊環境與食品級設備</strong><p>不鏽鋼、清潔或特殊環境需求，需依材質、防護與應用條件選型。</p></div>
    </div>
  </section>

  <section class="thomson-resource" id="downloads">
    <h3 class="thomson-section-title" style="margin-top:0;">技術資料下載</h3>
    <div class="thomson-resource-list">
      <div class="thomson-resource-item"><div><strong>Thomson 電動缸型錄</strong><span>PDF / 系列級資料</span></div><a href="${docActuator}" target="_blank" rel="noopener" aria-label="下載 Thomson 電動缸型錄 PDF">PDF</a></div>
      <div class="thomson-resource-item"><div><strong>Thomson Electrak 資料</strong><span>PDF / 系列級資料</span></div><a href="${docElectrak}" target="_blank" rel="noopener" aria-label="下載 Thomson Electrak PDF">PDF</a></div>
      <div class="thomson-resource-item"><div><strong>Thomson 不鏽鋼線性致動器</strong><span>PDF / 特殊環境資料</span></div><a href="${docStainless}" target="_blank" rel="noopener" aria-label="下載 Thomson 不鏽鋼線性致動器 PDF">PDF</a></div>
    </div>
  </section>
</div>
</div>`;

const next = `${html.slice(0, start)}${replacement}${html.slice(end)}`;
writeFileSync(target, next, 'utf8');

console.log(JSON.stringify({ status: 'updated', target: 'site/preview/products/detail/100.html' }, null, 2));
