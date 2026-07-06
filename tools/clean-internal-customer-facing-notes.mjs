import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('site/preview/products/detail');

const replacements = [
  [/供後連結/g, '提供文件連結'],
  [/先保留請洽星泰/g, '請洽星泰確認可提供資料'],
  [/供人工選型與頁面 CTA 使用/g, '作為選型與詢問參考'],
  [/正式下載連結需於檔案至星泰後台後，再替換按鈕 URL。/g, '下載文件請洽星泰確認可提供版本。'],
  [/檔案。上傳後由人工站內 URL。/g, '文件請洽星泰確認可提供版本。'],
  [/供後台人工插入產品頁規格區塊/g, '供產品規格比對與選型參考'],
  [/以下按鈕為後台前的佔位介面；目前連結不會導向公開檔案，需由後網址。/g, '若需完整文件與下載連結，請洽星泰確認可提供版本。'],
  [/依原廠公開頁面與官方 PDF 連結核對，供後續與 CKEditor 插入使用。/g, '依原廠公開頁面與官方 PDF 連結整理。'],
  [/其他原廠 PDF 需人工下載後上架。/g, '其他原廠文件請洽星泰確認可提供版本。'],
  [/需人工從 ACS resource 取得或登入後下載。/g, '請洽星泰確認可提供版本。'],
  [/需會員註冊，先保留/g, '需會員註冊，請洽星泰確認可提供資料'],
  [/official-member-required \/ HDS 官方頁標示需會員註冊，請洽星泰確認可提供資料/g, 'HDS 官方頁標示需會員註冊，請洽星泰確認可提供資料'],
  [/star-catalog \/。後 URL/g, 'star-catalog / 站內文件'],
  [/star-datasheet \/。後 URL/g, 'star-datasheet / 站內文件'],
  [/official- \/ ：HDS 官方目錄頁需會員登入或人工取得/g, 'official / HDS 官方目錄頁需會員登入；請洽星泰確認可提供資料'],
  [/上傳到星泰後台並 URL/g, '請洽星泰確認可提供下載版本'],
  [/官方目錄頁需會員登入或人工取得/g, '官方目錄頁需會員登入；請洽星泰確認可提供資料'],
  [/待原廠或人工補齊/g, '請洽星泰確認可提供版本'],
  [/\/。後 URL/g, '/ 站內文件'],
  [/。後 URL/g, '站內文件'],
  [/目前產品頁既有檔案，。供後台人工比對。/g, '星泰既有文件。'],
  [/實際上架時，請將按鈕 href 由 # 改為星泰後台上傳後的正式檔案 URL。/g, '下載文件請洽星泰確認可提供版本。'],
  [/上架提醒：/g, '資料來源：'],
  [/Codex 已把可取得的 PDF 下載到本機；請洽星泰確認可提供下載版本。/g, '可取得文件已整理為下載入口；請洽星泰確認可提供版本。'],
  [/HDS 官方頁標示需會員註冊，先保留/g, 'HDS 官方頁標示需會員註冊，請洽星泰確認可提供資料'],
  [/需會員註冊，先保留/g, '需會員註冊，請洽星泰確認可提供資料'],
  [/<!--\s*Using[\s\S]*?-->/g, ''],
];

let changed = 0;
let replacementsApplied = 0;

for (const name of fs.readdirSync(root)) {
  if (!name.endsWith('.html')) continue;
  const file = path.join(root, name);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  for (const [pattern, replacement] of replacements) {
    const matches = html.match(pattern);
    if (matches) replacementsApplied += matches.length;
    html = html.replace(pattern, replacement);
  }

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, replacementsApplied }, null, 2));
