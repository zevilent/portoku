/* ============================================================
   DB — lapisan data (SQLite via node:sqlite, tanpa dependensi native)
   ------------------------------------------------------------
   Tabel menyimpan konten portofolio + pesan masuk dari form kontak.
   node:sqlite tersedia sejak Node 22.5 (stabil di Node 24+), jadi
   tidak perlu build tool sama sekali.
   ============================================================ */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Lokasi file database — bisa diarahkan ke volume persist saat deploy. */
export const DB_PATH = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : resolve(here, '..', 'data', 'portoku.db');

let db;

/** Buka (dan siapkan skema) database. Idempoten — aman dipanggil berkali-kali. */
export function getDb() {
  if (db) return db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slug       TEXT NOT NULL UNIQUE,
      title      TEXT NOT NULL,
      year       TEXT NOT NULL,
      url        TEXT NOT NULL,
      seed       TEXT NOT NULL,
      tagline    TEXT NOT NULL DEFAULT '',
      stack      TEXT NOT NULL DEFAULT '[]',
      desc       TEXT NOT NULL DEFAULT '',
      points     TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tech_groups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT NOT NULL,
      name       TEXT NOT NULL,
      items      TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS steps (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      num        TEXT NOT NULL,
      title      TEXT NOT NULL,
      desc       TEXT NOT NULL DEFAULT '',
      tag        TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS services (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT NOT NULL,
      title      TEXT NOT NULL,
      desc       TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      question   TEXT NOT NULL,
      answer     TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stats (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      value      INTEGER NOT NULL DEFAULT 0,
      suffix     TEXT NOT NULL DEFAULT '',
      label      TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT NOT NULL DEFAULT '',
      message    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      read       INTEGER NOT NULL DEFAULT 0,
      ip         TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
  `);
}

/** Jalankan `fn` di dalam satu transaksi; rollback bila melempar error. */
export function transaction(fn) {
  const conn = getDb();
  conn.exec('BEGIN');
  try {
    const result = fn(conn);
    conn.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      conn.exec('ROLLBACK');
    } catch {
      /* transaksi mungkin sudah batal — abaikan */
    }
    throw error;
  }
}

/** Helper: JSON aman untuk kolom bertipe teks-JSON. */
export const parseJson = (raw, fallback = []) => {
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const toJson = (value) => JSON.stringify(value ?? []);

/** Tutup koneksi database (dipakai saat graceful shutdown & di test). */
export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
