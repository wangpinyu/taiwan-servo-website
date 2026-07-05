import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportPath = path.join(root, 'reports', 'product-standardization-report.json');
const dryRun = process.argv.includes('--dry-run');

function normalizeProductH1(html) {
  const bodyMatch = String(html || '').match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return { html, changed: false, converted: 0 };

  let seen = 0;
  let converted = 0;
  const body = bodyMatch[1].replace(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi, (tag, attrs, inner) => {
    seen += 1;
    if (seen === 1) return tag;
    converted += 1;
    return `<h2${attrs}>${inner}</h2>`;
  });

  if (!converted) return { html, changed: false, converted: 0 };
  return {
    html: html.slice(0, bodyMatch.index) + html.slice(bodyMatch.index, bodyMatch.index + bodyMatch[0].length).replace(bodyMatch[1], body) + html.slice(bodyMatch.index + bodyMatch[0].length),
    changed: true,
    converted,
  };
}

if (!fs.existsSync(reportPath)) {
  console.error(`Missing ${reportPath}. Run npm run validate first.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const results = [];

for (const page of report.pages || []) {
  const file = path.join(root, page.preview_rel);
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  const result = normalizeProductH1(original);
  if (!result.changed) continue;
  if (!dryRun) fs.writeFileSync(file, result.html, 'utf8');
  results.push({
    product_id: page.product_id,
    title: page.title,
    preview_rel: page.preview_rel,
    converted_h1_to_h2: result.converted,
  });
}

console.log(JSON.stringify({
  dry_run: dryRun,
  changed_pages: results.length,
  converted_h1_to_h2: results.reduce((sum, item) => sum + item.converted_h1_to_h2, 0),
  pages: results,
}, null, 2));
