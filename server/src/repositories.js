/* ============================================================
   REPOSITORY — semua query database berkumpul di sini,
   supaya route hanya mengurus HTTP.
   ============================================================ */
import { getDb, parseJson } from './db.js';
import * as seedData from './data.js';

const mapProject = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  year: row.year,
  url: row.url,
  seed: row.seed,
  tagline: row.tagline,
  stack: parseJson(row.stack),
  desc: row.desc,
  points: parseJson(row.points)
});

export const listProjects = () =>
  getDb().prepare('SELECT * FROM projects ORDER BY sort_order, id').all().map(mapProject);

export const getProjectBySlug = (slug) => {
  const row = getDb().prepare('SELECT * FROM projects WHERE slug = ?').get(slug);
  return row ? mapProject(row) : null;
};

export const listTechGroups = () =>
  getDb()
    .prepare('SELECT * FROM tech_groups ORDER BY sort_order, id')
    .all()
    .map((r) => ({ code: r.code, name: r.name, items: parseJson(r.items) }));

export const listSteps = () =>
  getDb()
    .prepare('SELECT num, title, desc, tag FROM steps ORDER BY sort_order, id')
    .all();

export const listServices = () =>
  getDb()
    .prepare('SELECT code, title, desc FROM services ORDER BY sort_order, id')
    .all();

export const listFaqs = () =>
  getDb()
    .prepare('SELECT question AS q, answer AS a FROM faqs ORDER BY sort_order, id')
    .all();

export const listStats = () =>
  getDb()
    .prepare('SELECT value, suffix, label FROM stats ORDER BY sort_order, id')
    .all();

const readSetting = (key, fallback) => {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? parseJson(row.value, fallback) : fallback;
};

/** Profil + kontak + marquee — dibaca dari tabel settings (fallback ke seed). */
export const getProfile = () => readSetting('profile', seedData.profile);
export const getContact = () => readSetting('contact', seedData.contact);
export const getMarquees = () => readSetting('marquees', seedData.marquees);

/** Semua konten publik dalam satu payload — dipakai endpoint /api/bootstrap. */
export const getBootstrap = () => ({
  profile: getProfile(),
  contact: getContact(),
  marquees: getMarquees(),
  stats: listStats(),
  projects: listProjects(),
  techGroups: listTechGroups(),
  steps: listSteps(),
  services: listServices(),
  faqs: listFaqs()
});

/** Simpan pesan dari form kontak. */
export const createMessage = ({ name, email, subject, message, ip }) => {
  const info = getDb()
    .prepare('INSERT INTO messages (name, email, subject, message, ip) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, subject ?? '', message, ip ?? '');
  return getDb().prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
};

export const listMessages = (limit = 50) =>
  getDb()
    .prepare('SELECT id, name, email, subject, message, created_at, read FROM messages ORDER BY id DESC LIMIT ?')
    .all(Number(limit) || 50);

export const countMessages = () => getDb().prepare('SELECT COUNT(*) AS n FROM messages').get().n;
