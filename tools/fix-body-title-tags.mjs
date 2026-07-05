import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_ROOT || 'site');
const reportPath = path.join(root, 'reports', 'product-standardization-report.json');
const dryRun = process.argv.includes('--dry-run');

function removeBodyTitleTags(html) {
  const bodyMatch = String(html || '').match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return { html, changed: false, removed: 0 };

  let removed = 0;
  const body = bodyMatch[1].replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, () => {
    removed += 1;
    return '';
  });

  if (!removed) return { html, changed: false, removed: 0 };

  return {
    html:
      html.slice(0, bodyMatch.index) +
      html.slice(bodyMatch.index, bodyMatch.index + bodyMatch[0].length).replace(bodyMatch[1], body) +
      html.slice(bodyMatch.index + bodyMatch[0].length),
    changed: true,
    removed,
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
  const result = removeBodyTitleTags(original);
  if (!result.changed) continue;
  if (!dryRun) fs.writeFileSync(file, result.html, 'utf8');
  results.push({
    product_id: page.product_id,
    title: page.title,
    preview_rel: page.preview_rel,
    removed_body_title_tags: result.removed,
  });
}

console.log(JSON.stringify({
  dry_run: dryRun,
  changed_pages: results.length,
  removed_body_title_tags: results.reduce((sum, item) => sum + item.removed_body_title_tags, 0),
  pages: results,
}, null, 2));
