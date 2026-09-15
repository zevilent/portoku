/* ============================================================
   SERVE-CLIENT — server statis kecil (tanpa dependensi) untuk
   meninjau hasil build atau mengembangkan sisi client saja.

   Pakai:
     node scripts/serve-client.js                 → layani client/
     node scripts/serve-client.js --dir dist      → layani dist/
     node scripts/serve-client.js --port 5000
   ============================================================ */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const dir = resolve(root, argValue('--dir', 'client'));
const port = Number(argValue('--port', process.env.PORT ?? 4173));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = join(dir, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));

    /* cegah keluar dari folder yang dilayani */
    if (!filePath.startsWith(dir)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) filePath = join(filePath, 'index.html');

    const body = await readFile(filePath).catch(() => null);
    if (!body) {
      const notFound = await readFile(join(dir, '404.html')).catch(() => null);
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(notFound ?? '<h1>404</h1>');
      return;
    }

    res.writeHead(200, {
      'content-type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end('Internal error');
  }
});

server.listen(port, () => {
  console.log(`\n  Situs statis siap: http://localhost:${port}/`);
  console.log(`  Folder: ${dir}\n`);
});
