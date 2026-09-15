/* ============================================================
   APP — perakitan Express (tanpa listen, supaya bisa di-import
   oleh test maupun dipakai sebagai serverless handler).
   ============================================================ */
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './routes.js';
import { getDb } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = resolve(here, '..', '..', 'client');

export function createApp({ serveClient = true } = {}) {
  const app = express();

  app.disable('x-powered-by');
  /* Angka ini harus sesuai jumlah proxy di depan server. Di Railway/Render
     (satu proxy) nilai 1 sudah tepat; bila diakses langsung tanpa proxy,
     set TRUST_PROXY=0 agar header X-Forwarded-For dari klien diabaikan. */
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

  /* CORS terbuka: konten ini publik dan aman dibaca siapa pun,
     termasuk dari GitHub Pages (zevilent.github.io). */
  app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'] }));
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  /* pastikan skema database siap sebelum request pertama */
  app.use((req, res, next) => {
    try {
      getDb();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', api);

  /* serve client statis — dipakai saat development lokal.
     Di GitHub Pages, file statis dilayani langsung oleh Pages. */
  if (serveClient && existsSync(CLIENT_DIR)) {
    app.use(express.static(CLIENT_DIR, { extensions: ['html'] }));
    app.get('/', (req, res) => res.sendFile(resolve(CLIENT_DIR, 'index.html')));
  }

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: `Rute ${req.method} ${req.originalUrl} tidak ditemukan.` });
  });

  /* eslint-disable-next-line no-unused-vars */
  app.use((error, req, res, next) => {
    console.error('[error]', error);
    res.status(500).json({ ok: false, error: 'Terjadi kesalahan di server.' });
  });

  return app;
}
