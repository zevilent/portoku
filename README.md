# PORTOKU — Portofolio Full Stack

Portofolio interaktif **Bima Abiyasa — Full Stack Web Developer** (Bogor, Indonesia).

Repo ini sengaja dibuat **full stack sungguhan**, bukan sekadar satu file HTML:

| Bagian | Isi | Jalan di mana |
|---|---|---|
| `client/` | Situs portofolio (HTML + CSS + JS, Three.js, GSAP, Lenis, terminal interaktif) | **GitHub Pages** |
| `server/` | REST API Node.js + Express 5 + SQLite (`node:sqlite`) | Lokal / VPS / Railway / Render |
| `scripts/` | Build ke `dist/` dan server statis untuk pratinjau | Lokal |
| `.github/workflows/` | Deploy otomatis ke GitHub Pages | GitHub Actions |

**Kunci desainnya:** klien mengambil konten dari REST API (`/api/bootstrap`). Kalau API tidak ada — seperti saat dibuka dari GitHub Pages — klien otomatis jatuh ke `client/js/data.fallback.js` sehingga situs **tetap utuh 100%**. Jadi GitHub Pages tetap hidup meski backend mati.

🔗 **Live:** https://zevilent.github.io/portoku/

---

## 1. Menjalankan lokal

Butuh **Node.js ≥ 22.5** (untuk modul bawaan `node:sqlite`). Tanpa Docker, tanpa build tool, tanpa dependensi native.

```bash
git clone https://github.com/zevilent/portoku.git
cd portoku
npm install          # memasang express + cors (workspace server ikut terpasang)
npm run db:seed      # bikin & isi server/data/portoku.db
npm run dev          # http://localhost:3000
```

Buka <http://localhost:3000>. Backend dan situs dilayani dari origin yang sama, jadi `/api/*` langsung hidup dan badge kiri-bawah akan menampilkan **SUMBER DATA: REST API**.

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server API + situs (port 3000) |
| `npm run dev:client` | Layani hanya `client/` di port 4173 (backend tidak aktif → mode statis) |
| `npm run db:seed` | Isi database dari `server/src/data.js` (idempoten) |
| `npm run db:reset` | Kosongkan lalu isi ulang tabel konten |
| `npm test` | Jalankan test API (`node --test`) |
| `npm run build` | Hasilkan `dist/` untuk GitHub Pages |
| `npm run preview` | Build lalu pratinjau `dist/` di port 4173 |
| `npm run check:clipping` | Periksa teks terpotong di 11 ukuran layar (butuh Playwright) |

### Memeriksa tampilan di berbagai ukuran layar

```bash
npm install --no-save playwright-core   # hanya untuk pemeriksaan ini
npm run preview                         # jalankan di terminal terpisah
npm run check:clipping http://localhost:4173/
```

Skrip memakai Chrome untuk membuka halaman di 11 ukuran viewport (320px–1920px) dan melaporkan
teks yang meluber keluar kotaknya. Keluar dengan kode `1` bila ada masalah, jadi cocok dipakai
di CI. Elemen yang memang dirancang meluber (marquee berjalan, teks melingkar SVG) diabaikan.

---

## 2. REST API

Basis: `http://localhost:3000/api` — semua respons berformat `{ ok, data }`.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Status layanan, uptime, versi Node |
| `GET` | `/api/bootstrap` | **Semua konten sekaligus** — dipakai klien (1 request) |
| `GET` | `/api/profile` | Profil + teks "tentang" |
| `GET` | `/api/contact` | Info kontak & tautan sosial |
| `GET` | `/api/stats` | Angka statistik |
| `GET` | `/api/marquees` | Teks marquee (lime, ghost, footer) |
| `GET` | `/api/projects` | Daftar proyek |
| `GET` | `/api/projects/:slug` | Detail satu proyek (mis. `/api/projects/niaga-one`) |
| `GET` | `/api/tech` | Kelompok teknologi |
| `GET` | `/api/steps` | Tahapan proses kerja |
| `GET` | `/api/services` | Layanan |
| `GET` | `/api/faqs` | Pertanyaan umum |
| `POST` | `/api/contact` | Simpan pesan dari form kontak |
| `GET` | `/api/messages` | Pesan masuk (dilindungi `ADMIN_KEY`) |

Contoh:

```bash
curl http://localhost:3000/api/bootstrap
curl http://localhost:3000/api/projects/niaga-one
curl -X POST http://localhost:3000/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Andi","email":"andi@example.com","subject":"Landing page","message":"Butuh landing page untuk brand kopi."}'
```

`POST /api/contact` sudah dilengkapi:

- validasi nama / email / panjang pesan,
- **honeypot** (`website`) untuk menjebak bot,
- pembatas laju 8 pesan / 10 menit per IP.

---

## 3. Mengubah isi konten

Isi situs bersumber dari satu tempat: **`server/src/data.js`**, lalu disalin ke **`client/js/data.fallback.js`** (versi cadangan untuk GitHub Pages).

```bash
# 1. sunting server/src/data.js  (proyek, layanan, FAQ, kontak, ...)
# 2. samakan client/js/data.fallback.js dengan nilai yang sama
# 3. muat ulang database
npm run db:seed
```

> Aturan praktisnya: `server/src/data.js` adalah sumber utama; `client/js/data.fallback.js` harus berisi nilai yang sama supaya tampilan di GitHub Pages tidak berbeda dengan yang dilayani API.

---

## 4. Deploy

### a. GitHub Pages (situs) — sudah otomatis

Workflow `.github/workflows/pages.yml` berjalan setiap push ke `main` yang menyentuh `client/`:

1. jalankan `node scripts/build-pages.js` → menghasilkan `dist/`,
2. unggah `dist/` sebagai artefak Pages.

Aktifkan sekali di repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Situs akan tersedia di `https://<user>.github.io/portoku/`.

### b. Backend (opsional)

GitHub Pages tidak bisa menjalankan server. Kalau ingin API ikut online:

1. Deploy folder `server/` ke Railway / Render / VPS. Environment yang didukung:
   - `PORT` — port server (default `3000`),
   - `DB_PATH` — lokasi file SQLite (arahkan ke volume persist agar data pesan tidak hilang),
   - `ADMIN_KEY` — kunci untuk endpoint `/api/messages` (tanpa ini endpoint **ditutup**, 403),
   - `TRUST_PROXY` — jumlah proxy di depan server (default `1`, cocok untuk Railway/Render; set `0` bila diakses langsung),
   - `SERVE_CLIENT=false` — matikan penyajian file statis bila frontend sudah di Pages.
2. Setelah backend punya URL publik, isi `API_BASE` di `client/config.js`:

```js
window.PORTOKU_CONFIG = {
  API_BASE: 'https://portoku-api.up.railway.app', // ← URL backend
  API_TIMEOUT: 5000,
  FORCE_OFFLINE: false
};
```

3. Commit & push. GitHub Pages akan memuat konten dari API, dan tetap punya fallback statis bila API sedang mati.

Selama `API_BASE` masih `''`, situs memakai data statis dan form kontak menyarankan WhatsApp — **tidak akan pernah tampil rusak**.

---

## 5. Struktur

```
portoku/
├─ client/                     # situs (dilayani GitHub Pages)
│  ├─ index.html
│  ├─ config.js                # ← atur API_BASE di sini
│  ├─ css/style.css
│  └─ js/
│     ├─ data.fallback.js      # konten cadangan (identik dengan seed server)
│     ├─ api.js                # jembatan fetch + fallback
│     └─ app.js                # animasi, terminal, modal, form
├─ server/
│  ├─ src/
│  │  ├─ data.js               # SUMBER KONTEN
│  │  ├─ db.js                 # skema SQLite + helper transaksi
│  │  ├─ seed.js               # pengisi database
│  │  ├─ repositories.js       # seluruh query
│  │  ├─ routes.js             # endpoint REST
│  │  ├─ app.js                # perakitan Express
│  │  └─ index.js              # titik masuk (listen)
│  └─ test/api.test.js         # 8 test API
├─ scripts/
│  ├─ build-pages.js           # client/ → dist/ (+ .nojekyll, 404.html)
│  └─ serve-client.js          # server statis untuk pratinjau
└─ .github/workflows/pages.yml # deploy Pages
```

## 6. Test

```bash
npm test
```

Meliputi health, bootstrap, detail proyek, 404, penyimpanan pesan, validasi email, jebakan honeypot, dan 404 area API.

## 7. Catatan teknis

- **Tanpa dependensi native.** SQLite memakai modul bawaan Node (`node:sqlite`), jadi tidak perlu compiler saat `npm install`.
- **Database tidak masuk repo.** `server/data/*.db` ada di `.gitignore`; jalankan `npm run db:seed` setelah clone.
- **Gambar** memakai `picsum.photos` sebagai placeholder agar repo tetap ringan.

---

© 2025 Bima Abiyasa — dibangun dari nol di Bogor, Indonesia.
