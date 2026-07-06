import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportDir = path.join(root, 'reports');
const reviewPath = path.join(reportDir, 'product-spec-agent-review.json');
const port = Number(process.env.PORT || 8891);
const cdpPort = Number(process.env.CDP_PORT || 9333);
const timeoutMs = 30000;
const profileDir = path.resolve(process.env.VISUAL_QA_PROFILE_DIR || '.tmp/edge-visual-qa-profile');

const defaultSampleIds = ['244', '373', '374', '375', '376', '100', '167', '79', '241'];
const argvIds = process.argv
  .find((arg) => arg.startsWith('--ids='))
  ?.slice('--ids='.length)
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const sampleIds = argvIds?.length ? argvIds : defaultSampleIds;

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child, ms = 2000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function terminateTree(child) {
  if (!child?.pid) return Promise.resolve();
  if (process.platform !== 'win32') {
    child.kill();
    return waitForExit(child);
  }
  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    killer.once('exit', resolve);
    killer.once('error', resolve);
  });
}

async function waitForUrl(url, label) {
  const start = Date.now();
  let lastError = '';
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = `${res.status} ${res.statusText}`;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}: ${lastError}`);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message || 'CDP error'} ${msg.error.data || ''}`.trim()));
        else resolve(msg.result || {});
        return;
      }
      this.events.push(msg);
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, timeoutMs);
    });
  }

  close() {
    this.ws.close();
  }
}

function findEdge() {
  const candidates = [
    process.env.EDGE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function loadReviewPages() {
  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
  const pageMap = new Map(review.pages.map((page) => [String(page.product_id), page]));
  return sampleIds
    .map((id) => pageMap.get(String(id)))
    .filter(Boolean)
    .map((page) => ({
      product_id: String(page.product_id),
      title: page.title,
      category_path: page.category_path || [],
      preview_rel: page.preview_rel,
      agent_status: page.agent_review?.status || '',
      expected_spec: page.agent_review?.status === 'agent-approved-clean',
    }));
}

const evaluateExpression = `(() => {
  const text = document.body ? document.body.innerText : '';
  const doc = document.documentElement;
  const body = document.body;
  const scrollWidth = Math.max(doc?.scrollWidth || 0, body?.scrollWidth || 0);
  const clientWidth = doc?.clientWidth || window.innerWidth;
  const images = [...document.images];
  const visibleImages = images.filter((img) => {
    const rect = img.getBoundingClientRect();
    const style = getComputedStyle(img);
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0
      && rect.bottom >= -80
      && rect.right >= -80
      && rect.top <= window.innerHeight + 160
      && rect.left <= window.innerWidth + 160;
  });
  const brokenImages = visibleImages
    .filter((img) => !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0)
    .map((img) => ({
      src: img.currentSrc || img.src || '',
      alt: img.alt || '',
      className: img.className || '',
    }))
    .slice(0, 20);
  const h1 = [...document.querySelectorAll('h1')].map((el) => el.textContent.trim()).filter(Boolean);
  const specHeadings = [...document.querySelectorAll('h2,h3,h4')]
    .filter((el) => /產品規格詳情/.test(el.textContent || ''))
    .map((el) => el.textContent.trim());
  const tables = [...document.querySelectorAll('table')];
  const specDetails = [...document.querySelectorAll('details')].filter((el) => (el.textContent || '').includes('產品規格詳情') || (el.closest('[class*="spec"]')?.textContent || '').includes('產品規格詳情'));
  const disclosureButtons = [...document.querySelectorAll('button[aria-expanded], details > summary, .st-spec-toggle, .spec-toggle')]
    .map((el) => (el.textContent || el.getAttribute('aria-label') || '').trim())
    .filter(Boolean);
  const productSeriesHeadings = [...document.querySelectorAll('h2,h3,h4')]
    .filter((el) => /產品系列/.test(el.textContent || ''))
    .map((el) => el.textContent.trim());
  const applicationHeadings = [...document.querySelectorAll('h2,h3,h4')]
    .filter((el) => /應用領域/.test(el.textContent || ''))
    .map((el) => el.textContent.trim());
  return {
    url: location.href,
    title: document.title,
    h1,
    scrollWidth,
    clientWidth,
    horizontalOverflow: scrollWidth > clientWidth + 2,
    imageCount: images.length,
    visibleImageCount: visibleImages.length,
    brokenImages,
    tableCount: tables.length,
    hasProductSpecTitle: specHeadings.length > 0 || text.includes('產品規格詳情'),
    specHeadings,
    productSeriesHeadings,
    applicationHeadings,
    disclosureIndicatorCount: disclosureButtons.length,
    disclosureSamples: disclosureButtons.slice(0, 8),
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
})()`;

async function runPage(client, browserUrl, page, viewport) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
  try {
    await client.send('Page.enable', {}, sessionId);
    await client.send('Runtime.enable', {}, sessionId);
    await client.send(
      'Emulation.setDeviceMetricsOverride',
      {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      },
      sessionId,
    );
    await client.send('Page.navigate', { url: `${browserUrl}/${page.preview_rel}` }, sessionId);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = await client.send(
        'Runtime.evaluate',
        { expression: 'document.readyState', returnByValue: true },
        sessionId,
      );
      if (state.result?.value === 'complete') break;
      await sleep(250);
    }
    await client.send(
      'Runtime.evaluate',
      {
        expression: `new Promise((resolve) => {
          const visibleImages = [...document.images].filter((img) => {
            const rect = img.getBoundingClientRect();
            const style = getComputedStyle(img);
            return style.display !== 'none'
              && style.visibility !== 'hidden'
              && rect.width > 0
              && rect.height > 0
              && rect.bottom >= -80
              && rect.right >= -80
              && rect.top <= window.innerHeight + 160
              && rect.left <= window.innerWidth + 160;
          });
          const pending = visibleImages.filter((img) => !img.complete);
          if (!pending.length) {
            resolve(true);
            return;
          }
          let remaining = pending.length;
          const done = () => {
            remaining -= 1;
            if (remaining <= 0) resolve(true);
          };
          pending.forEach((img) => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
          setTimeout(() => resolve(false), 3000);
        })`,
        awaitPromise: true,
        returnByValue: true,
      },
      sessionId,
    );
    const result = await client.send(
      'Runtime.evaluate',
      { expression: evaluateExpression, returnByValue: true, awaitPromise: false },
      sessionId,
    );
    const value = result.result?.value || {};
    const critical = [];
    const warnings = [];
    if (value.horizontalOverflow) critical.push(`whole-page horizontal overflow ${value.scrollWidth}/${value.clientWidth}`);
    if (value.brokenImages?.length) critical.push(`broken images ${value.brokenImages.length}`);
    if (value.h1?.length !== 1) critical.push(`expected one H1, got ${value.h1?.length || 0}`);
    if (page.expected_spec && !value.hasProductSpecTitle) critical.push('missing 產品規格詳情');
    if (page.expected_spec && value.disclosureIndicatorCount === 0) warnings.push('no visible accordion/disclosure indicator detected');
    return {
      ...page,
      viewport_name: viewport.name,
      viewport: { width: viewport.width, height: viewport.height, mobile: viewport.mobile },
      observed: value,
      status: critical.length ? 'fail' : warnings.length ? 'warn' : 'pass',
      critical,
      warnings,
    };
  } finally {
    await client.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

function renderReport(report) {
  const rows = report.results
    .map((row) => {
      const link = `../${row.preview_rel}`.replaceAll('\\', '/');
      return `<tr class="${row.status}"><td>${htmlEscape(row.status)}</td><td><a href="${htmlEscape(link)}">${htmlEscape(row.product_id)}</a></td><td>${htmlEscape(row.title)}</td><td>${htmlEscape(row.viewport_name)}</td><td>${htmlEscape(row.category_path.join(' / '))}</td><td>${htmlEscape(row.observed.h1?.join(' | ') || '')}</td><td>${htmlEscape(row.observed.scrollWidth)}/${htmlEscape(row.observed.clientWidth)}</td><td>${htmlEscape(row.observed.imageCount)}</td><td>${htmlEscape(row.observed.brokenImages?.length || 0)}</td><td>${htmlEscape(row.observed.tableCount)}</td><td>${htmlEscape(row.observed.disclosureIndicatorCount)}</td><td>${htmlEscape([...row.critical, ...row.warnings].join('；'))}</td></tr>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Visual Sample QA</title>
  <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:24px;color:#10251b;background:#f8faf8}
    h1{margin:0 0 8px}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
    .card{background:#fff;border:1px solid #dce7df;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:700}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce7df}
    th,td{padding:9px 10px;border-bottom:1px solid #e6eee8;text-align:left;vertical-align:top}
    th{background:#eaf4ee}
    tr.fail{background:#fff0f0}
    tr.warn{background:#fffbea}
    tr.pass{background:#fff}
    code{background:#edf4ef;padding:2px 4px;border-radius:4px}
  </style>
</head>
<body>
  <h1>Visual Sample QA</h1>
  <p>Generated at <code>${htmlEscape(report.generated_at)}</code>. This uses isolated headless Edge, not the user's visible Edge tabs.</p>
  <div class="cards">
    <div class="card"><div>Samples</div><div class="num">${report.summary.total_checks}</div></div>
    <div class="card"><div>Pass</div><div class="num">${report.summary.pass}</div></div>
    <div class="card"><div>Warn</div><div class="num">${report.summary.warn}</div></div>
    <div class="card"><div>Fail</div><div class="num">${report.summary.fail}</div></div>
  </div>
  <table>
    <thead><tr><th>Status</th><th>ID</th><th>Title</th><th>Viewport</th><th>Category</th><th>H1</th><th>Scroll/client</th><th>Images</th><th>Broken</th><th>Tables</th><th>Disclosure</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });
  const edgePath = findEdge();
  if (!edgePath) throw new Error('Microsoft Edge executable was not found. Set EDGE_PATH to run visual sample QA.');
  const pages = loadReviewPages();
  if (!pages.length) throw new Error('No visual QA sample pages were found.');

  const server = spawn(process.execPath, ['tools/serve-site.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, SITE_ROOT: root, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  fs.mkdirSync(profileDir, { recursive: true });
  const edge = spawn(
    edgePath,
    [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${profileDir}`,
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const cleanup = async () => {
    await Promise.allSettled([terminateTree(server), terminateTree(edge)]);
  };

  try {
    await waitForUrl(`http://127.0.0.1:${port}/`, 'local static server');
    await waitForUrl(`http://127.0.0.1:${cdpPort}/json/version`, 'headless Edge CDP');
    const version = await requestJson(`http://127.0.0.1:${cdpPort}/json/version`);
    const client = new CdpClient(version.webSocketDebuggerUrl);
    await client.open();
    const viewports = [
      { name: 'desktop-1366x900', width: 1366, height: 900, mobile: false },
      { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
    ];
    const results = [];
    for (const page of pages) {
      for (const viewport of viewports) {
        results.push(await runPage(client, `http://127.0.0.1:${port}`, page, viewport));
      }
    }
    client.close();
    const summary = {
      total_checks: results.length,
      pass: results.filter((row) => row.status === 'pass').length,
      warn: results.filter((row) => row.status === 'warn').length,
      fail: results.filter((row) => row.status === 'fail').length,
    };
    const report = {
      generated_at: new Date().toISOString(),
      scope: {
        sample_ids: pages.map((page) => page.product_id),
        viewports,
        note: 'Uses isolated headless Edge and the local static preview server.',
      },
      summary,
      results,
    };
    fs.writeFileSync(path.join(reportDir, 'visual-sample-qa.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(reportDir, 'visual-sample-qa.html'), renderReport(report), 'utf8');
    console.log(
      `Visual sample QA complete: checks=${summary.total_checks}, pass=${summary.pass}, warn=${summary.warn}, fail=${summary.fail}`,
    );
    if (summary.fail > 0) process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
