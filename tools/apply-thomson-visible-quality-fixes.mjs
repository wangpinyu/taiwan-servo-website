import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const detailDir = path.join(root, "site", "preview", "products", "detail");
const ids = ["164", "170", "171", "191", "376", "377", "378", "379"];

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitle(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : "Thomson 產品";
}

function getProductImages(html) {
  const images = [];
  const re = /<img\b[^>]*\bsrc="([^"]*assets-cache\/[^"]+\.(?:jpg|jpeg|png|webp))"[^>]*>/gi;
  for (const match of html.matchAll(re)) {
    const src = match[1];
    if (/logo2\.svg|1538bb9a1a4b-/i.test(src)) continue;
    if (!images.includes(src)) images.push(src);
  }
  return images;
}

function replacePlaceholderImages(html, title) {
  const images = getProductImages(html);
  if (!images.length) return { html, count: 0 };

  let index = 0;
  let count = 0;
  const nextSrc = () => images[index++ % images.length];

  const updated = html.replace(/<img\b([^>]*?)\bsrc="https:\/\/placehold\.co\/[^"]*"([^>]*?)>/gi, (tag, before, after) => {
    count += 1;
    const src = nextSrc();
    let rebuilt = `<img${before}src="${src}"${after}>`;
    if (/\balt="/i.test(rebuilt)) {
      rebuilt = rebuilt.replace(/\balt="[^"]*"/i, `alt="${title} 產品圖片"`);
    } else {
      rebuilt = rebuilt.replace(/>$/, ` alt="${title} 產品圖片">`);
    }
    return rebuilt;
  });

  return { html: updated, count };
}

function fixMisnamedSeriesHeading(html) {
  return html.replace(
    /<h3 class="cat-title">產品規格詳情<\/h3>\s*\n\s*<div class="spec-grid">/g,
    `<h3 class="cat-title">產品系列</h3>\n\n<div class="spec-grid">`
  );
}

function fixEmptyDocumentStatus(html) {
  return html
    .replace(/<div class="st-thom-empty"><\/div>/g, '<div class="st-thom-empty">文件需依實際型號與語言版本確認，請由星泰協助提供。</div>')
    .replace(/<span><\/span>/g, "<span>請洽星泰</span>");
}

const results = [];
for (const id of ids) {
  const file = path.join(detailDir, `${id}.html`);
  const before = fs.readFileSync(file, "utf8");
  const title = getTitle(before);
  let html = before;
  html = fixMisnamedSeriesHeading(html);
  html = fixEmptyDocumentStatus(html);
  const placeholderResult = replacePlaceholderImages(html, title);
  html = placeholderResult.html;
  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
  }
  results.push({
    id,
    title,
    changed: html !== before,
    replacedPlaceholderImages: placeholderResult.count,
  });
}

console.log(JSON.stringify({ status: "ok", results }, null, 2));
