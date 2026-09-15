/* ============================================================
   ROUTES — REST API portofolio.
   Semua respons berbentuk { ok, data } agar mudah dikonsumsi
   dan aman dari error mentah.
   ============================================================ */
import { Router } from 'express';
import * as repo from './repositories.js';

export const api = Router();

/* ---------- helper ---------- */
const ok = (res, data) => res.json({ ok: true, data });
const bad = (res, message, status = 400) => res.status(status).json({ ok: false, error: message });

const asString = (value, max = 2000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

/* ---------- pembatas sederhana untuk form kontak ---------- */
const hits = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;

function rateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  if (hits.size > 1000) {
    for (const [key, value] of hits) {
      if (!value.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return timestamps.length > RATE_MAX;
}

/* ============================================================
   GET /api/health — status layanan
   ============================================================ */
api.get('/health', (req, res) => {
  ok(res, {
    status: 'up',
    uptime: Math.round(process.uptime()),
    runtime: `node ${process.version}`,
    time: new Date().toISOString()
  });
});

/* ============================================================
   GET /api/bootstrap — semua konten sekaligus (1 request)
   ============================================================ */
api.get('/bootstrap', (req, res) => {
  ok(res, repo.getBootstrap());
});

/* ---------- profil & kontak ---------- */
api.get('/profile', (req, res) => ok(res, repo.getProfile()));
api.get('/contact', (req, res) => ok(res, repo.getContact()));
api.get('/stats', (req, res) => ok(res, repo.listStats()));
api.get('/marquees', (req, res) => ok(res, repo.getMarquees()));

/* ---------- proyek ---------- */
api.get('/projects', (req, res) => ok(res, repo.listProjects()));

api.get('/projects/:slug', (req, res) => {
  const project = repo.getProjectBySlug(req.params.slug);
  if (!project) return bad(res, `Proyek "${req.params.slug}" tidak ditemukan.`, 404);
  ok(res, project);
});

/* ---------- konten pendukung ---------- */
api.get('/tech', (req, res) => ok(res, repo.listTechGroups()));
api.get('/steps', (req, res) => ok(res, repo.listSteps()));
api.get('/services', (req, res) => ok(res, repo.listServices()));
api.get('/faqs', (req, res) => ok(res, repo.listFaqs()));

/* ============================================================
   POST /api/contact — kirim pesan dari form kontak
   ============================================================ */
api.post('/contact', (req, res) => {
  const body = req.body ?? {};
  const name = asString(body.name, 120);
  const email = asString(body.email, 160);
  const subject = asString(body.subject, 160);
  const message = asString(body.message, 4000);
  const honeypot = asString(body.website, 200);

  /* jebakan bot: field tersembunyi terisi → pura-pura sukses */
  if (honeypot) return res.status(202).json({ ok: true, data: { accepted: true } });

  if (name.length < 2) return bad(res, 'Nama minimal 2 karakter.');
  if (!isEmail(email)) return bad(res, 'Alamat email tidak valid.');
  if (message.length < 10) return bad(res, 'Pesan minimal 10 karakter.');

  /* req.ip sudah memperhitungkan trust proxy, jadi tidak bisa dipalsukan
     dengan mengubah header X-Forwarded-For sendiri. */
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return bad(res, 'Terlalu banyak pesan dikirim. Coba lagi beberapa menit lagi.', 429);
  }

  const saved = repo.createMessage({ name, email, subject, message, ip });
  res.status(201).json({
    ok: true,
    data: { id: saved.id, createdAt: saved.created_at, message: 'Pesan tersimpan. Terima kasih!' }
  });
});

/* ============================================================
   GET /api/messages — daftar pesan masuk
   WAJIB memakai header X-API-Key = ADMIN_KEY.
   Bila ADMIN_KEY belum diatur, endpoint ditutup (fail closed)
   supaya data pribadi pengirim tidak pernah terbuka.
   ============================================================ */
api.get('/messages', (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return bad(res, 'Endpoint pesan dinonaktifkan. Set ADMIN_KEY di server untuk mengaktifkan.', 403);
  }
  if (req.get('x-api-key') !== adminKey) {
    return bad(res, 'Tidak diizinkan.', 401);
  }
  const limit = clamp(Number.parseInt(req.query.limit, 10) || 50, 1, 200);
  ok(res, { total: repo.countMessages(), items: repo.listMessages(limit) });
});

/* ---------- 404 khusus area /api ---------- */
api.use((req, res) => bad(res, `Endpoint ${req.method} ${req.originalUrl} tidak ada.`, 404));
