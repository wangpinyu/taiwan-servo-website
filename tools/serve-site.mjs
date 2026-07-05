import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.env.SITE_ROOT || 'site');
const port = Number(process.env.PORT || 8789);

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.pdf', 'application/pdf'],
  ['.zip', 'application/zip'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const full = resolve(root, normalize(rel));
  if (!full.startsWith(root)) return null;
  if (existsSync(full) && statSync(full).isDirectory()) return join(full, 'index.html');
  return full;
}

createServer((req, res) => {
  const file = safePath(req.url || '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types.get(extname(file).toLowerCase()) || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Taiwan Servo preview: http://127.0.0.1:${port}/`);
});

