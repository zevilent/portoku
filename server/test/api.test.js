/* ============================================================
   TEST API — node:test + fetch (tanpa dependensi tambahan).
   Jalankan: npm test
   ============================================================ */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/* database test terpisah supaya data lokal tidak tersentuh */
const tmp = mkdtempSync(join(tmpdir(), 'portoku-test-'));
process.env.DB_PATH = join(tmp, 'test.db');

const { createApp } = await import('../src/app.js');
const { getDb, closeDb, transaction } = await import('../src/db.js');
const seed = await import('../src/data.js');

let server;
let base;

before(async () => {
  /* isi database test */
  getDb();
  transaction(() => {
    const db = getDb();
    const p = db.prepare(
      'INSERT INTO projects (slug, title, year, url, seed, tagline, stack, desc, points, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    seed.projects.forEach((item, i) =>
      p.run(item.slug, item.title, item.year, item.url, item.seed, item.tagline, JSON.stringify(item.stack), item.desc, JSON.stringify(item.points), i)
    );
    const f = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?,?,?)');
    seed.faqs.forEach((item, i) => f.run(item.q, item.a, i));
    const s = db.prepare('INSERT INTO stats (value, suffix, label, sort_order) VALUES (?,?,?,?)');
    seed.stats.forEach((item, i) => s.run(item.value, item.suffix, item.label, i));
    const g = db.prepare('INSERT INTO tech_groups (code, name, items, sort_order) VALUES (?,?,?,?)');
    seed.techGroups.forEach((item, i) => g.run(item.code, item.name, JSON.stringify(item.items), i));
    const st = db.prepare('INSERT INTO steps (num, title, desc, tag, sort_order) VALUES (?,?,?,?,?)');
    seed.steps.forEach((item, i) => st.run(item.num, item.title, item.desc, item.tag, i));
    const sv = db.prepare('INSERT INTO services (code, title, desc, sort_order) VALUES (?,?,?,?)');
    seed.services.forEach((item, i) => sv.run(item.code, item.title, item.desc, i));
    const set = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    set.run('profile', JSON.stringify(seed.profile));
    set.run('contact', JSON.stringify(seed.contact));
    set.run('marquees', JSON.stringify(seed.marquees));
  });

  server = createApp({ serveClient: false }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

const getJson = async (path) => {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
};

/* pesan tersimpan hanya bisa dihitung lewat database (endpoint /api/messages
   sekarang tertutup tanpa ADMIN_KEY) */
const countMessages = async () => {
  const { getDb } = await import('../src/db.js');
  return getDb().prepare('SELECT COUNT(*) AS n FROM messages').get().n;
};

test('GET /api/health melaporkan layanan hidup', async () => {
  const { status, body } = await getJson('/api/health');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'up');
});

test('GET /api/bootstrap mengirim seluruh konten', async () => {
  const { status, body } = await getJson('/api/bootstrap');
  assert.equal(status, 200);
  assert.equal(body.data.projects.length, seed.projects.length);
  assert.equal(body.data.faqs.length, seed.faqs.length);
  assert.equal(body.data.profile.name, 'BIMA ABIYASA');
  assert.equal(body.data.contact.whatsappRaw, '+6285155402545');
  assert.ok(body.data.marquees.lime.includes('REACT'));
});

test('GET /api/projects/:slug mengembalikan detail proyek', async () => {
  const { status, body } = await getJson('/api/projects/niaga-one');
  assert.equal(status, 200);
  assert.equal(body.data.title, 'NIAGA ONE');
  assert.equal(body.data.stack.length, 3);
});

test('GET /api/projects/:slug yang tidak ada → 404', async () => {
  const { status, body } = await getJson('/api/projects/tidak-ada');
  assert.equal(status, 404);
  assert.equal(body.ok, false);
});

test('POST /api/contact menyimpan pesan valid', async () => {
  const res = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Klien Uji', email: 'klien@example.com', subject: 'Landing page', message: 'Saya butuh landing page untuk brand kopi.' })
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.ok, true);
  assert.ok(body.data.id > 0);
});

test('POST /api/contact menolak email tidak valid', async () => {
  const res = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'bukan-email', message: 'pesan cukup panjang' })
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.match(body.error, /email/i);
});

test('POST /api/contact menjebak bot honeypot tanpa menyimpan', async () => {
  const before = await countMessages();
  const res = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Bot', email: 'bot@example.com', message: 'spam spam spam', website: 'http://spam.example' })
  });
  assert.equal(res.status, 202);
  const after = await countMessages();
  assert.equal(after, before);
});

test('GET /api/messages tertutup saat ADMIN_KEY belum diatur (fail closed)', async () => {
  delete process.env.ADMIN_KEY;
  const res = await fetch(base + '/api/messages');
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.match(body.error, /ADMIN_KEY/);
});

test('GET /api/messages menolak kunci salah dan menerima kunci benar', async () => {
  process.env.ADMIN_KEY = 'kunci-uji-123';
  try {
    const wrong = await fetch(base + '/api/messages', { headers: { 'x-api-key': 'salah' } });
    assert.equal(wrong.status, 401);

    const right = await fetch(base + '/api/messages', { headers: { 'x-api-key': 'kunci-uji-123' } });
    assert.equal(right.status, 200);
    const body = await right.json();
    assert.ok(body.data.total >= 1);
  } finally {
    delete process.env.ADMIN_KEY;
  }
});

test('GET /api/messages membatasi parameter limit', async () => {
  process.env.ADMIN_KEY = 'kunci-uji-123';
  try {
    const res = await fetch(base + '/api/messages?limit=-1', { headers: { 'x-api-key': 'kunci-uji-123' } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.items.length <= 200);
  } finally {
    delete process.env.ADMIN_KEY;
  }
});

test('POST /api/contact dibatasi lajunya per klien', async () => {
  const payload = {
    name: 'Spam Uji',
    email: 'spam@example.com',
    subject: 'uji',
    message: 'pesan uji yang cukup panjang untuk lolos validasi'
  };
  const send = () =>
    fetch(base + '/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

  let limited = false;
  for (let i = 0; i < 12; i++) {
    const res = await send();
    if (res.status === 429) {
      limited = true;
      break;
    }
  }
  assert.equal(limited, true, 'rate limit seharusnya aktif setelah 8 pesan');
});

test('endpoint /api yang tidak ada → 404 JSON', async () => {
  const { status, body } = await getJson('/api/tidak-ada');
  assert.equal(status, 404);
  assert.equal(body.ok, false);
});
