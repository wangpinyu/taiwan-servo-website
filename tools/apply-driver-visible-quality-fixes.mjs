import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const detailDir = path.join(root, "site", "preview", "products", "detail");
const ids = ["359", "360", "361"];

function removePlaceholderComments(html) {
  return html.replace(
    /<!--\s*Using a placeholder related to [\s\S]*?-->/gi,
    "",
  );
}

const results = [];
for (const id of ids) {
  const file = path.join(detailDir, `${id}.html`);
  const before = fs.readFileSync(file, "utf8");
  const after = removePlaceholderComments(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
  }
  results.push({
    id,
    changed: after !== before,
  });
}

console.log(JSON.stringify(results, null, 2));
