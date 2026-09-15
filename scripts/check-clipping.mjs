/* ============================================================
   CEK TEKS TERPOTONG — memeriksa apakah ada teks yang meluber
   keluar kotaknya di berbagai ukuran layar.

   Skrip ini butuh Playwright (devDependency opsional) dan Chrome:

     npm install --no-save playwright-core
     npm run preview                          # terminal terpisah
     npm run check:clipping http://localhost:4173/

   Skrip sengaja mengabaikan elemen yang MEMANG dirancang meluber
   (marquee berjalan, teks melingkar SVG, honeypot) supaya yang
   dilaporkan hanya pemotongan teks yang benar-benar terlihat.
   ============================================================ */
let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error(
    'Playwright belum terpasang. Jalankan dulu:\n' +
      '  npm install --no-save playwright-core\n' +
      'Lalu pastikan Google Chrome tersedia di sistem.'
  );
  process.exit(2);
}

const url = process.argv[2] ?? 'http://localhost:4173/';
const SIZES = [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [414, 896],
  [480, 800],
  [600, 960],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080]
];

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader']
});

let total = 0;

for (const [width, height] of SIZES) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(7000);

  /* gulir seluruh halaman supaya animasi berbasis scroll selesai,
     karena transform GSAP bisa mengubah hasil pengukuran */
  await page.evaluate(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y < H; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);

  const clipped = await page.evaluate(() => {
    const out = [];
    const hasOwnText = (el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

    document.querySelectorAll('body *').forEach((el) => {
      if (!hasOwnText(el)) return;
      /* elemen yang memang dirancang meluber / tidak terlihat */
      if (el.closest('#preloader,#menuOverlay,.noise,.mqs,.mq,.foot-mq,.hp-field')) return;
      if (el.closest('svg')) return;

      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.getBoundingClientRect().width === 0) return;

      const clips = cs.overflowX !== 'visible' || cs.overflow === 'hidden' || cs.overflowY === 'hidden';
      if (el.scrollWidth > el.clientWidth + 1 && (clips || el.scrollWidth > el.offsetWidth + 1)) {
        out.push(
          `${el.tagName}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')} ` +
            `"${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}" sw=${el.scrollWidth} cw=${el.clientWidth}`
        );
      }
    });
    return out;
  });

  total += clipped.length;
  const status = clipped.length === 0 ? 'BERSIH' : `${clipped.length} TERPOTONG`;
  console.log(`${width}x${height}: ${status}${errors.length ? ` (error JS: ${errors.length})` : ''}`);
  clipped.forEach((line) => console.log('    - ' + line));

  await page.close();
}

console.log(`\nTOTAL teks terpotong: ${total}`);
await browser.close();
process.exit(total === 0 ? 0 : 1);
