/* ============================================================
   BUILD PAGES — menyalin isi client/ ke dist/ untuk GitHub Pages.
   Jalankan: npm run build
   ============================================================ */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'client');
const out = resolve(root, 'dist');

if (!existsSync(src)) {
  console.error('✗ Folder client/ tidak ditemukan.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(src, out, { recursive: true });

/* .nojekyll: cegah GitHub Pages memproses file lewat Jekyll
   (folder yang diawali garis bawah & file tanpa ekstensi tetap disajikan). */
writeFileSync(resolve(out, '.nojekyll'), '');

/* 404 khusus: alihkan ke index.html agar tautan dalam tetap bekerja. */
writeFileSync(
  resolve(out, '404.html'),
  `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>404 — Halaman tidak ditemukan</title>
<meta http-equiv="refresh" content="0; url=./"/>
<style>
  html,body{height:100%;margin:0;background:#0a0a09;color:#eceee4;
    font-family:'JetBrains Mono',ui-monospace,monospace;display:grid;place-items:center;text-align:center}
  h1{font-size:clamp(3rem,12vw,8rem);margin:0;color:#c9ff2e;letter-spacing:-.03em}
  p{color:#9aa08f;letter-spacing:.18em;font-size:.72rem}
  a{color:#c9ff2e}
</style>
</head>
<body>
  <div>
    <h1>404</h1>
    <p>HALAMAN TIDAK DITEMUKAN — MENGALIHKAN KE BERANDA…</p>
    <p><a href="./">KE BERANDA</a></p>
  </div>
</body>
</html>
`
);

console.log('✓ Build selesai → dist/');
console.log('  isi: index.html, css/, js/, config.js, .nojekyll, 404.html');
