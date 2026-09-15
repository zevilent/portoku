/* ============================================================
   DATA.FALLBACK.JS — sumber data darurat (offline / API mati)
   ------------------------------------------------------------
   Salinan identik dengan seed database di server/src/data.js.
   Client memuat file ini SEBELUM app.js, lalu app.js mencoba
   /api/* dan hanya memakai data di sini bila API tidak tersedia.
   Dengan begitu situs tetap utuh saat dibuka dari GitHub Pages.
   ============================================================ */
window.PORTOKU_FALLBACK = {
  profile: {
    name: 'BIMA ABIYASA',
    role: 'Full Stack Web Developer',
    shortRole: 'Full Stack Web Developer — BOGOR, ID',
    location: 'Bogor, Indonesia',
    coords: '6.5950° S / 106.8166° E',
    timezone: 'Asia/Jakarta',
    timezoneLabel: 'WIB',
    available: true,
    availabilityNote: 'TERSEDIA UNTUK PROYEK — HUBUNGI VIA WHATSAPP',
    responseTime: '< 24 jam',
    version: 'v2.2',
    copyright: '© 2025 BIMA ABIYASA — SEMUA HAK DILINDUNGI',
    about:
      'Saya @Bima Abiyasa@, full stack web developer yang berbasis di @Bogor, Indonesia@. ' +
      'Saya membangun produk web @dari nol hingga live@ — merancang antarmuka, menyusun logika di balik server, ' +
      'sampai menekan tombol deploy. Bagi saya, setiap proyek klien bukan sekadar pekerjaan, tapi @nama yang saya pertaruhkan.@'
  },

  contact: {
    whatsapp: '+62 851-5540-2545',
    whatsappRaw: '+6285155402545',
    whatsappLink:
      'https://wa.me/6285155402545?text=Hai%20Bima%2C%20saya%20tertarik%20diskusi%20proyek%20web!',
    whatsappLinkProject:
      'https://wa.me/6285155402545?text=Hai%20Bima%2C%20saya%20punya%20ide%20proyek%20web%20dan%20ingin%20diskusi!',
    instagram: 'zevilents.ventus',
    instagramLink: 'https://instagram.com/zevilents.ventus',
    github: 'zevilent',
    githubLink: 'https://github.com/zevilent'
  },

  stats: [
    { value: 4, suffix: '', label: 'PROYEK TERPUBLIKASI' },
    { value: 12, suffix: '+', label: 'TEKNOLOGI DIKUASAI' },
    { value: 100, suffix: '%', label: 'KOMITMEN PADA PROYEK' },
    { value: 24, suffix: '', label: 'JAM RESPON MAKSIMAL' }
  ],

  marquees: {
    lime: ['HTML', 'CSS', 'JAVASCRIPT', 'REACT', 'NODE.JS', 'TAILWIND', 'VERCEL', 'REST API', 'GITHUB', 'RESPONSIF'],
    ghost: ['MYSQL', 'MONGODB', 'PHP', 'LARAVEL', 'EXPRESS', 'BOOTSTRAP', 'SEO', 'DEPLOY', 'UI/UX', 'FULL STACK'],
    footer: ['BIMA ABIYASA', 'FULL STACK WEB DEVELOPER', 'BIMA ABIYASA', 'FULL STACK WEB DEVELOPER']
  },

  projects: [
    {
      slug: 'hikari-tutor',
      title: 'HIKARI TUTOR',
      year: '2024',
      url: 'https://hikaritutor.web.id',
      seed: 'bima-hikari',
      tagline: 'platform tutor online',
      stack: ['Web App', 'Pendidikan', 'Full-Stack'],
      desc: 'Platform tutor online yang menghubungkan siswa dengan mentor — pencarian tutor, profil lengkap, dan alur pemesanan sesi belajar dalam satu antarmuka yang bersih dan mudah dipakai.',
      points: ['Sistem pencarian & filter tutor', 'Alur pemesanan sesi belajar', 'Antarmuka responsif multi-perangkat']
    },
    {
      slug: 'phoenix-signal',
      title: 'PHOENIX SIGNAL',
      year: '2024',
      url: 'https://phoenixsignal.app',
      seed: 'bima-phoenix',
      tagline: 'sinyal pasar real-time',
      stack: ['Real-Time', 'Analitik', 'Dashboard'],
      desc: 'Aplikasi penyedia sinyal pasar real-time — memantau pergerakan, menyajikan data dalam dashboard yang mudah dibaca, dan menghadirkan informasi tepat saat dibutuhkan.',
      points: ['Visualisasi data pasar langsung', 'Sistem penyajian sinyal yang jelas', 'Dashboard ringkas & informatif']
    },
    {
      slug: 'niaga-one',
      title: 'NIAGA ONE',
      year: '2025',
      url: 'https://niaga-one.vercel.app',
      seed: 'bima-niaga',
      tagline: 'aplikasi niaga modern',
      stack: ['E-Commerce', 'Web App', 'Vercel'],
      desc: 'Aplikasi niaga modern yang membungkus katalog, transaksi, dan pengelolaan dalam satu pengalaman yang mulus. Dibangun end-to-end dan ter-deploy langsung di Vercel.',
      points: ['Katalog & manajemen produk', 'Alur transaksi yang ramping', 'Deployment di Vercel']
    },
    {
      slug: 'teras-kinara',
      title: 'TERAS KINARA',
      year: '2024',
      url: 'https://zevilent.github.io/teras-kinara-landing',
      seed: 'bima-kinara',
      tagline: 'landing page immersif',
      stack: ['Landing Page', 'UI/UX', 'Responsif'],
      desc: 'Landing page untuk brand Teras Kinara — desain satu halaman yang memadukan storytelling, visual, dan animasi halus untuk menghadirkan kesan pertama yang membekas.',
      points: ['Desain storytelling satu halaman', 'Animasi & transisi halus', 'Optimal di semua ukuran layar']
    }
  ],

  techGroups: [
    { code: 'A', name: 'FRONTEND', items: ['HTML', 'CSS', 'JAVASCRIPT', 'REACT', 'TAILWIND', 'BOOTSTRAP', 'RESPONSIF DESIGN'] },
    { code: 'B', name: 'BACKEND', items: ['NODE.JS', 'PHP', 'LARAVEL', 'EXPRESS', 'REST API', 'AUTH & JWT'] },
    { code: 'C', name: 'DATABASE', items: ['MYSQL', 'MONGODB', 'FIREBASE', 'PRISMA'] },
    { code: 'D', name: 'TOOLS & DEPLOY', items: ['GIT / GITHUB', 'VERCEL', 'POSTMAN', 'VS CODE', 'SEO DASAR', 'FIGMA'] }
  ],

  steps: [
    { num: '01', title: 'DISKUSI & RISET', desc: 'Ngobrol santai soal kebutuhan, target audiens, dan referensi yang kamu suka. Dari situ saya susun ruang lingkup, timeline, dan estimasi biaya yang jelas sejak awal.', tag: 'GRATIS KONSULTASI' },
    { num: '02', title: 'DESAIN & STRUKTUR', desc: 'Wireframe lalu desain UI. Kamu punya kesempatan review dan approve sebelum satu baris kode pun ditulis — supaya tidak ada kejutan di akhir.', tag: 'UI/UX · APPROVAL' },
    { num: '03', title: 'DEVELOPMENT', desc: 'Proses koding front-end & back-end, integrasi database, dan pengujian di perangkat nyata. Progres bisa kamu pantau secara berkala via WhatsApp.', tag: 'KODE · TESTING' },
    { num: '04', title: 'DEPLOY & DUKUNGAN', desc: 'Rilis ke domain, optimasi kecepatan terakhir, dan serah terima lengkap dengan garansi perbaikan bug plus panduan singkat pengelolaan.', tag: 'LIVE · GARANSI' }
  ],

  services: [
    { code: 'SRV.01', title: 'WEBSITE & LANDING PAGE', desc: 'Company profile, landing page kampanye, dan situs bisnis — cepat, responsif, dan ramah mesin pencari. Seperti Teras Kinara yang saya bangun dari nol.' },
    { code: 'SRV.02', title: 'WEB APPLICATION', desc: 'Aplikasi web fungsional dengan dashboard, autentikasi, dan basis data — dari ide di kertas sampai produk yang dipakai pengguna nyata.' },
    { code: 'SRV.03', title: 'BACKEND & API', desc: 'REST API, desain database, integrasi third-party (payment, WhatsApp, peta), dan deployment ke Vercel maupun VPS.' },
    { code: 'SRV.04', title: 'PERAWATAN & OPTIMASI', desc: 'Perbaikan bug, peningkatan kecepatan, penguatan keamanan dasar, dan pengembangan fitur untuk website yang sudah berjalan.' }
  ],

  faqs: [
    { q: 'Berapa biaya pembuatan website?', a: 'Setiap proyek punya kebutuhan berbeda, jadi biayanya menyesuaikan lingkup — mulai dari landing page tunggal sampai aplikasi web dengan database. Ceritakan kebutuhanmu via WhatsApp, saya kirimkan penawaran rinci tanpa biaya tersembunyi.' },
    { q: 'Berapa lama waktu pengerjaan?', a: 'Landing page umumnya selesai dalam 1–2 minggu. Website atau aplikasi dengan fitur lebih kompleks menyesuaikan — timeline pasti selalu saya sepakati di awal dan kamu bisa memantau progresnya.' },
    { q: 'Apakah bisa revisi kalau hasilnya kurang cocok?', a: 'Bisa. Revisi sudah saya masukkan di tiap tahap — desain tidak lanjut ke koding sebelum kamu approve, dan setelah rilis masih ada siklus penyempurnaan.' },
    { q: 'Teknologi apa yang dipakai?', a: 'Sesuai kebutuhan proyek: dari HTML/CSS/JS murni untuk kecepatan maksimal, sampai React, Node.js/Laravel, dan database MySQL/MongoDB untuk aplikasi yang lebih besar. Deployment bisa di Vercel, hosting, atau VPS.' },
    { q: 'Apakah domain & hosting dibantu juga?', a: 'Ya. Saya bisa membantu dari pemilihan domain, setup hosting, sampai website benar-benar live dan bisa diakses — kamu tinggal terima beres.' },
    { q: 'Bagaimana kalau setelah selesai ada masalah?', a: 'Ada garansi perbaikan bug setelah serah terima. Untuk kebutuhan berkelanjutan (update konten, fitur baru, maintenance), tersedia opsi kerja sama bulanan.' }
  ]
};
