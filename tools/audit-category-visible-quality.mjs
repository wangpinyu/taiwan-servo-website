import fs from "node:fs";
import path from "node:path";

const [, , ...ids] = process.argv;
if (!ids.length) {
  console.error("Usage: node tools/audit-category-visible-quality.mjs <product-id>...");
  process.exit(1);
}

const root = process.cwd();
const detailDir = path.join(root, "site", "preview", "products", "detail");

function text(value = "") {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const rows = ids.map((id) => {
  const file = path.join(detailDir, `${id}.html`);
  const html = fs.readFileSync(file, "utf8");
  const title = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) =>
    text(match[1]),
  );
  return {
    id,
    title,
    h2,
    placehold: (html.match(/placehold\.co/g) || []).length,
    emptySpan: (html.match(/<span><\/span>/g) || []).length,
    emptyStatus: (html.match(/class="[^"]*empty[^"]*"[^>]*>\s*<\/div>/g) || [])
      .length,
    hashHref: (html.match(/href="#"/g) || []).length,
    localPath: /file:\/\/|[A-Z]:\\/.test(html),
    internalNotes: (
      html.match(
        /<!--[^>]*(Using a placeholder|placeholder related|pending|待人工|待確認)[\s\S]*?-->/gi,
      ) || []
    ).length,
    customerFacingInternalText: />[^<]*(pending|placeholder|待人工|待確認)[^<]*</i.test(
      html,
    ),
  };
});

console.log(JSON.stringify(rows, null, 2));
