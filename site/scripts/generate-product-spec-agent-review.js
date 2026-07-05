const fs = require('fs');
const path = require('path');

const workspace = process.cwd();
const outputRoot = path.join(workspace, '.codex_tmp', 'site-mirror-current');
const reportRoot = path.join(outputRoot, 'reports');
const standardizationReportPath = path.join(reportRoot, 'product-standardization-report.json');
const qaReportPath = path.join(reportRoot, 'product-spec-module-qa.json');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeUtf8(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, 'utf8');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

function priorityBucket(categoryPath) {
  const pathText = (categoryPath || []).join(' › ');
  if (/電動缸|SMAC|線性馬達/i.test(pathText)) return '電動缸';
  if (/驅動器/i.test(pathText)) return '驅動器';
  if (/各類馬達|伺服馬達|步進馬達|Harmonic 馬達/i.test(pathText)) return '各類馬達';
  if (/ACS 控制器|ACS/i.test(pathText)) return 'ACS 控制器 / 驅動器';
  if (/Harmonic Drive|減速機/i.test(pathText)) return 'Harmonic Drive 減速機';
  if (/Renishaw|回授|光學尺|磁性編碼器|雷射編碼器/i.test(pathText)) return 'Renishaw 回授元件';
  if (/定位平台|滑台|平台/i.test(pathText)) return '定位平台';
  if (/空氣軸承|滾珠|滾柱|軸承/i.test(pathText)) return '空氣軸承 / 滾珠・滾柱軸承';
  return '其他';
}

function classifyAgentReview(page, standardizationPage) {
  const warnings = page.warnings || [];
  const critical = page.critical || [];
  const overlayStatus = page.overlay_status || '';
  const hasCtaWarning = warnings.some((w) => /spec_cta_missing_or_outside_block/.test(w));
  const hasUnitWarning = warnings.some((w) => /headers_may_need_units/.test(w));
  const hasDownloadWarning = warnings.some((w) => /download_label_needs_review/.test(w));
  const hasToggleWarning = warnings.some((w) => /details_toggle_text_needs_review/.test(w));
  const unknownHeadings = standardizationPage?.validation?.unknownHeadings || [];

  if (critical.length) {
    return {
      status: 'agent-blocked-critical',
      decision: '不得上架',
      reason: '規格模組仍有阻塞級問題，需先修復假連結、本機路徑、內部屬性或內部註解。',
      next_action: '由 AI agent 修正清理規則或個別頁內容後重新 QA。',
      human_exception: false,
    };
  }
  if (page.qa_status === 'no-spec-module' || overlayStatus === 'no-spec-module') {
    return {
      status: 'agent-source-needed',
      decision: '暫不補寫',
      reason: '沒有既有規格模組候選；AI agent 需先找官方來源，無來源不得自行撰寫。',
      next_action: '由 AI agent 建立來源查核任務；找不到來源才列為人工例外。',
      human_exception: false,
    };
  }
  if (unknownHeadings.length || overlayStatus === 'needs-review-unknown-module') {
    return {
      status: 'agent-structure-review',
      decision: '需 AI 結構審核',
      reason: `存在未能安全歸類的模組標題：${unknownHeadings.join(' / ') || overlayStatus}`,
      next_action: '由 AI agent 判定是否屬產品系列、應用領域、技術資料下載或保留原標題。',
      human_exception: false,
    };
  }
  if (hasUnitWarning || hasDownloadWarning) {
    return {
      status: 'agent-source-audit-needed',
      decision: '需 AI 來源審核',
      reason: '表格單位或下載按鈕可辨識性仍需比對來源；不得用推測補欄位。',
      next_action: '由 AI agent 逐頁比對原廠表格與下載連結，確認後修正。',
      human_exception: false,
    };
  }
  if (hasCtaWarning || hasToggleWarning) {
    return {
      status: 'agent-fix-required',
      decision: '需 AI 修版',
      reason: '規格模組可讀性或詢問 CTA 尚未達標，但不需要人工先決。',
      next_action: '由 AI agent 補一致的詢問 CTA、展開提示或可及性文案。',
      human_exception: false,
    };
  }
  if (page.qa_status === 'pass') {
    return {
      status: 'agent-approved-clean',
      decision: '可進入批次套用候選',
      reason: '程式化 QA 未發現阻塞或警告。',
      next_action: '抽樣視覺檢查後可作為同類頁模板。',
      human_exception: false,
    };
  }
  return {
    status: 'agent-content-review',
    decision: '需 AI 內容審核',
    reason: 'QA 顯示仍有非阻塞警告，需要 AI agent 判定修正方式。',
    next_action: '由 AI agent 逐項消除警告或記錄來源限制。',
    human_exception: false,
  };
}

function renderHtml(report) {
  const cards = Object.entries(report.summary.agent_status_counts)
    .map(([key, value]) => `<div class="card"><div>${htmlEscape(key)}</div><strong>${value}</strong></div>`)
    .join('\n');
  const priorityRows = Object.entries(report.summary.priority_category_status)
    .map(([key, value]) => `<tr><td>${htmlEscape(key)}</td><td>${value.total}</td><td>${htmlEscape(JSON.stringify(value.agent_status_counts))}</td></tr>`)
    .join('\n');
  const rows = report.pages.map((page) => `<tr class="status-${htmlEscape(page.agent_review.status)}">
<td>${htmlEscape(page.product_id)}</td>
<td><a href="../${htmlEscape(page.preview_rel)}">${htmlEscape(page.title)}</a></td>
<td>${htmlEscape((page.category_path || []).join(' › '))}</td>
<td><span class="badge">${htmlEscape(page.agent_review.status)}</span></td>
<td>${htmlEscape(page.agent_review.decision)}</td>
<td>${htmlEscape(page.qa_status)}</td>
<td>${htmlEscape(page.overlay_status)}</td>
<td>${htmlEscape(page.agent_review.reason)}</td>
<td>${htmlEscape(page.agent_review.next_action)}</td>
</tr>`).join('\n');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Agent 規格模組審核報告</title>
<style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px;background:#fbfdfb;color:#17251d}.summary{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.card{border:1px solid #d9e6dc;background:#fff;border-radius:8px;padding:12px 16px;min-width:190px}.card strong{font-size:24px;color:#00843d}table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d9e6dc;margin:14px 0}th,td{border-bottom:1px solid #e6eee8;padding:8px 9px;text-align:left;vertical-align:top;font-size:13px}th{background:#edf6f0}.badge{border-radius:999px;padding:3px 8px;background:#e8f3ec}.status-agent-approved-clean .badge{background:#dff2e6;color:#00682c}.status-agent-fix-required .badge,.status-agent-source-audit-needed .badge,.status-agent-structure-review .badge,.status-agent-content-review .badge{background:#fff3cd;color:#735c00}.status-agent-source-needed .badge{background:#f4eee2;color:#77520c}.status-agent-blocked-critical .badge{background:#fde8e8;color:#9f1d1d}</style></head><body>
<h1>AI Agent 規格模組審核報告</h1>
<p>本報告把程式化 QA 結果轉為 AI agent 的後續審核決策。預設由 AI agent 完成審核；只有來源無法取得、後台限制衝突或風險超出內容審核時才升級為人工例外。</p>
<div class="summary">${cards}</div>
<p><a href="product-spec-agent-review.json">查看 JSON</a></p>
<h2>第一優先類別</h2>
<table><thead><tr><th>類別</th><th>頁數</th><th>AI 審核狀態</th></tr></thead><tbody>${priorityRows}</tbody></table>
<h2>逐頁 AI Agent 審核</h2>
<table><thead><tr><th>ID</th><th>產品</th><th>分類</th><th>AI 狀態</th><th>決策</th><th>QA</th><th>Overlay</th><th>原因</th><th>下一步</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function main() {
  if (!fs.existsSync(qaReportPath)) throw new Error(`Missing ${qaReportPath}`);
  if (!fs.existsSync(standardizationReportPath)) throw new Error(`Missing ${standardizationReportPath}`);
  const qa = readJson(qaReportPath);
  const standardization = readJson(standardizationReportPath);
  const standardizationById = new Map(standardization.pages.map((page) => [String(page.product_id), page]));
  const pages = qa.pages.map((page) => ({
    ...page,
    priority_category: priorityBucket(page.category_path),
    agent_review: classifyAgentReview(page, standardizationById.get(String(page.product_id))),
  }));
  const agentStatusCounts = {};
  const priorityCategoryStatus = {};
  for (const page of pages) {
    const status = page.agent_review.status;
    agentStatusCounts[status] = (agentStatusCounts[status] || 0) + 1;
    const bucket = page.priority_category;
    priorityCategoryStatus[bucket] = priorityCategoryStatus[bucket] || { total: 0, agent_status_counts: {} };
    priorityCategoryStatus[bucket].total += 1;
    priorityCategoryStatus[bucket].agent_status_counts[status] = (priorityCategoryStatus[bucket].agent_status_counts[status] || 0) + 1;
  }
  const report = {
    generated_at: new Date().toISOString(),
    scope: 'AI agent review decisions for standardized product spec modules',
    output_root: toPosix(outputRoot),
    source_reports: {
      standardization: toPosix(standardizationReportPath),
      qa: toPosix(qaReportPath),
    },
    policy: {
      default_reviewer: 'AI agent',
      human_exception_only_for: [
        'official source inaccessible after AI review',
        'backend/template limitation cannot be resolved locally',
        'conflicting source data',
        'business decision such as whether to omit a category',
      ],
    },
    summary: {
      total_pages: pages.length,
      agent_status_counts: agentStatusCounts,
      priority_category_status: priorityCategoryStatus,
    },
    pages,
  };
  writeUtf8(path.join(reportRoot, 'product-spec-agent-review.json'), JSON.stringify(report, null, 2));
  writeUtf8(path.join(reportRoot, 'product-spec-agent-review.html'), renderHtml(report));
  process.stdout.write(JSON.stringify({
    status: 'completed',
    pages: pages.length,
    summary: report.summary,
    report: 'reports/product-spec-agent-review.html',
    json: 'reports/product-spec-agent-review.json',
  }, null, 2));
}

main();
