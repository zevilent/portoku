/* ============================================================
   SEED — mengisi database dengan konten portofolio.
   Jalankan: npm run db:seed        (aman, idempoten)
             npm run db:reset       (hapus lalu isi ulang)
   ============================================================ */
import { getDb, toJson, transaction, DB_PATH } from './db.js';
import * as seedData from './data.js';

const reset = process.argv.includes('--reset');

const db = getDb();

if (reset) {
  for (const table of ['projects', 'tech_groups', 'steps', 'services', 'faqs', 'stats', 'settings']) {
    db.exec(`DELETE FROM ${table};`);
    db.exec(`DELETE FROM sqlite_sequence WHERE name = '${table}';`);
  }
  console.log('↺ Tabel konten dibersihkan (--reset).');
}

const insertAll = transaction(() => {
  db.exec('DELETE FROM projects; DELETE FROM tech_groups; DELETE FROM steps; DELETE FROM services; DELETE FROM faqs; DELETE FROM stats;');

  const projectStmt = db.prepare(`
    INSERT INTO projects (slug, title, year, url, seed, tagline, stack, desc, points, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  seedData.projects.forEach((p, i) => {
    projectStmt.run(p.slug, p.title, p.year, p.url, p.seed, p.tagline, toJson(p.stack), p.desc, toJson(p.points), i);
  });

  const groupStmt = db.prepare('INSERT INTO tech_groups (code, name, items, sort_order) VALUES (?, ?, ?, ?)');
  seedData.techGroups.forEach((g, i) => groupStmt.run(g.code, g.name, toJson(g.items), i));

  const stepStmt = db.prepare('INSERT INTO steps (num, title, desc, tag, sort_order) VALUES (?, ?, ?, ?, ?)');
  seedData.steps.forEach((s, i) => stepStmt.run(s.num, s.title, s.desc, s.tag, i));

  const serviceStmt = db.prepare('INSERT INTO services (code, title, desc, sort_order) VALUES (?, ?, ?, ?)');
  seedData.services.forEach((s, i) => serviceStmt.run(s.code, s.title, s.desc, i));

  const faqStmt = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)');
  seedData.faqs.forEach((f, i) => faqStmt.run(f.q, f.a, i));

  const statStmt = db.prepare('INSERT INTO stats (value, suffix, label, sort_order) VALUES (?, ?, ?, ?)');
  seedData.stats.forEach((s, i) => statStmt.run(s.value, s.suffix, s.label, i));

  const settingStmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  settingStmt.run('profile', toJson(seedData.profile));
  settingStmt.run('contact', toJson(seedData.contact));
  settingStmt.run('marquees', toJson(seedData.marquees));
});

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log(`✓ Seed selesai → ${DB_PATH}`);
console.log(
  `  projects: ${count('projects')} · tech_groups: ${count('tech_groups')} · steps: ${count('steps')} · ` +
  `services: ${count('services')} · faqs: ${count('faqs')} · stats: ${count('stats')}`
);
