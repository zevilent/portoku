/* ============================================================
   KONFIGURASI CLIENT
   ------------------------------------------------------------
   Atur alamat REST API di sini (satu tempat saja).

   • Dijalankan lokal lewat server Express  → biarkan kosong ('')
     karena API satu origin dengan halaman.
   • Dibuka dari GitHub Pages               → isi URL backend,
     contoh: 'https://portoku-api.onrender.com'
     Jika dikosongkan, situs tetap jalan memakai data statis
     di js/data.fallback.js (mode offline).
   ============================================================ */
window.PORTOKU_CONFIG = {
  /* Alamat dasar REST API. Kosong = origin yang sama. */
  API_BASE: '',

  /* Nama file database di server: dipakai untuk info versi di terminal. */
  API_LABEL: 'PORTOKU API',

  /* Batas waktu permintaan API (ms). Lewat batas ini → pakai data statis. */
  API_TIMEOUT: 5000,

  /* Kunci untuk mengaktifkan simulasi mode offline saat pengembangan.
     Ubah jadi true untuk menguji tampilan tanpa backend. */
  FORCE_OFFLINE: false
};
