/* ============================================================
   APP.JS — seluruh perilaku halaman portofolio.
   ------------------------------------------------------------
   Isi halaman diambil dari REST API (/api/bootstrap). Bila API
   tidak tersedia (misalnya dibuka dari GitHub Pages tanpa backend),
   konten otomatis memakai PORTOKU_FALLBACK sehingga situs tetap utuh.
   ============================================================ */
(function () {
  'use strict';

  /* ============ UTIL ============ */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const FALLBACK = window.PORTOKU_FALLBACK ?? {};

  /* hanya animasi GSAP yang dijalankan setelah data siap */
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ============ STATE DATA ============ */
  const state = {
    source: 'static',
    profile: FALLBACK.profile ?? {},
    contact: FALLBACK.contact ?? {},
    stats: FALLBACK.stats ?? [],
    marquees: FALLBACK.marquees ?? { lime: [], ghost: [], footer: [] },
    projects: FALLBACK.projects ?? [],
    techGroups: FALLBACK.techGroups ?? [],
    steps: FALLBACK.steps ?? [],
    services: FALLBACK.services ?? [],
    faqs: FALLBACK.faqs ?? []
  };
  window.PORTOKU_STATE = state;

  /* WA_LINK diisi ulang setelah data API tiba (lihat boot()). */
  let WA_LINK = state.contact.whatsappLink || 'https://wa.me/6285155402545';

  /* ============ FIT JUDUL (anti-kepotong di semua ukuran layar) ============
     Setiap judul besar diukur: jika lebih lebar dari wadahnya, font
     mengecil tepat secukupnya. Semua baris dalam satu judul disamakan
     ukurannya, lalu diulang saat resize / font selesai dimuat. */
  function fitTitles() {
    /* Setiap baris judul dulu dipaksa satu baris (nowrap) lalu diperkecil
       secukupnya agar pas di wadahnya. Perkecilan dijalankan di SEMUA lebar
       layar — sebelumnya hanya saat nowrap diizinkan, sehingga di ponsel
       judul meluber jauh keluar layar dan teksnya tampak terpotong. */
    $$('.hero-title,.sec-title,.c-title').forEach((t) => {
      const lines = [...t.querySelectorAll('.ht-inner,.sec-inner')];
      if (!lines.length) return;

      lines.forEach((l) => {
        l.style.fontSize = '';
        l.style.whiteSpace = 'nowrap';
      });

      let ratio = 1;
      lines.forEach((l) => {
        const box = l.parentElement.clientWidth;
        const w = l.scrollWidth;
        if (box > 0 && w > box) ratio = Math.min(ratio, box / w);
      });

      /* Batas bawah agar judul tidak pernah mengecil sampai tak terbaca:
         kalau masih meluber setelah batas ini, biarkan judul membungkus
         ke baris berikutnya sebagai jalan terakhir. */
      const floor = 20;
      lines.forEach((l) => {
        const cur = parseFloat(getComputedStyle(l).fontSize) || 16;
        if (ratio >= 1) return;
        const next = cur * ratio * 0.985; /* margin aman 1,5% */
        l.style.fontSize = Math.max(floor, next).toFixed(2) + 'px';
      });

      /* Khusus judul hero di layar sempit: dua baris besar jauh lebih
         enak dibaca daripada satu baris yang dikecilkan ekstrem.
         "BIMAABIYASA" adalah satu kata utuh, jadi pembungkusan biasa
         tidak menolong — perlu titik putus buatan di antara nama. */
      if (innerWidth < 640 && t.classList.contains('hero-title')) {
        [lines[1], lines[2]].forEach((l) => l?.querySelector('.ht-ast')?.remove());
        const first = lines[0];
        const chip = first.querySelector('.ht-chip');
        if (first && chip && !first.querySelector('[data-break]')) {
          const br = document.createElement('span');
          br.setAttribute('data-break', '');
          br.style.cssText = 'flex-basis:100%;height:0';
          chip.before(br);
        }
        lines.forEach((l) => {
          l.style.whiteSpace = 'normal';
          l.style.fontSize = '';
          l.style.flexWrap = 'wrap';
          l.style.justifyContent = 'flex-start';
        });
        /* ukur ulang setelah susunan baris berubah */
        let ratio2 = 1;
        lines.forEach((l) => {
          const box = l.parentElement.clientWidth;
          if (box > 0 && l.scrollWidth > box) ratio2 = Math.min(ratio2, box / l.scrollWidth);
        });
        if (ratio2 < 1) {
          lines.forEach((l) => {
            const cur = parseFloat(getComputedStyle(l).fontSize) || 16;
            l.style.fontSize = Math.max(20, cur * ratio2 * 0.98).toFixed(2) + 'px';
          });
        }
      }

      /* Verifikasi hasil nyata: kalau masih ada yang meluber, lepaskan
         nowrap supaya teks membungkus, bukan terpotong. */
      const stillSpills = lines.some((l) => l.scrollWidth > l.parentElement.clientWidth + 1);
      if (stillSpills) {
        lines.forEach((l) => {
          l.style.whiteSpace = '';
          l.style.fontSize = '';
        });
      }
    });
  }
  fitTitles();
  let fitT;
  addEventListener('resize', () => {
    clearTimeout(fitT);
    fitT = setTimeout(() => {
      fitTitles();
      if (ScrollTrigger) ScrollTrigger.refresh();
    }, 180);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fitTitles();
      if (ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ============ LENIS (smooth scroll, TANPA skew) ============ */
  const lenis = window.Lenis ? new window.Lenis({ duration: 1.15, smoothWheel: true }) : null;
  if (lenis) {
    lenis.stop();
    lenis.on('scroll', (e) => {
      if (ScrollTrigger) ScrollTrigger.update();
      window.__sy = e.scroll;
      const bar = $('#pbar i');
      if (bar) bar.style.transform = `scaleX(${e.limit ? e.scroll / e.limit : 0})`;
      const nav = $('.nav');
      if (nav) {
        nav.classList.toggle('scrolled', e.scroll > 40);
        nav.style.transform =
          e.direction === 1 && e.scroll > 400 && !document.body.classList.contains('menu-open')
            ? 'translateY(-110%)'
            : 'translateY(0)';
      }
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollTo = (target, options) => {
    if (lenis) lenis.scrollTo(target, options);
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ============ JAM WIB ============ */
  const clockEl = $('#clock');
  const tz = state.profile.timezone || 'Asia/Jakarta';
  const tickClock = () => {
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('id-ID', { timeZone: tz, hour12: false });
    }
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ============ KURSOR KUSTOM ============ */
  const dot = $('.cur-dot');
  const ring = $('.cur-ring');
  const curLabel = $('#curLabel');
  const heroContent = $('.hero-content');
  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let rx = mx;
  let ry = my;
  let pmx = 0;
  let pmy = 0;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && dot && ring) {
    addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      pmx = e.clientX / innerWidth - 0.5;
      pmy = e.clientY / innerHeight - 0.5;
    });
    document.addEventListener('mouseover', (e) => {
      const c = e.target.closest('[data-cursor]');
      if (c) {
        curLabel.textContent = c.dataset.cursor;
        ring.classList.add('cur-view');
      } else ring.classList.remove('cur-view');
      ring.classList.toggle('cur-link', !!e.target.closest('a,button,.pill'));
    });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      /* gerak kecil pada SELURUH blok konten hero — aman dari clipping */
      heroContent.style.transform = `translate3d(${pmx * 10}px,${pmy * 7}px,0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ============ MARQUEE (CSS murni, isi konten via JS) ============ */
  function fillMq(id, items) {
    const host = $('#' + id);
    if (!host || !items?.length) return;
    /* isi ulang: buang klon duplikat dari pemanggilan sebelumnya */
    const track = host.parentElement;
    [...track.querySelectorAll('.mq-half')].forEach((half, i) => {
      if (i > 0) half.remove();
    });
    host.innerHTML = items.map((t) => `<b>${esc(t)}</b><span class="dia"></span>`).join('');
    track.appendChild(host.cloneNode(true)); /* duplikat untuk loop mulus */
  }

  function renderMarquees() {
    fillMq('lm1', state.marquees.lime);
    fillMq('gh1', state.marquees.ghost);
    fillMq('fm1', state.marquees.footer);
  }

  /* ============ PARTIKEL 3D MORFOLOGI (Three.js) ============ */
  let heroVisible = true;
  (function initHero3D() {
    if (!window.THREE) return;
    const cv = $('#heroCanvas');
    const hero = $('#hero');
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;

    const N = matchMedia('(max-width:760px)').matches || RM ? 4500 : 9000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.random();
      const c = r < 0.05 ? [1, 0.36, 0.12] : r < 0.2 ? [0.93, 0.96, 0.88] : [0.72, 1, 0.18];
      col.set(c, i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const cloud = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.024,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      })
    );
    const knot = new THREE.Group();
    knot.add(cloud);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.6, 1)),
      new THREE.LineBasicMaterial({ color: 0x2c2e26, transparent: true, opacity: 0.5 })
    );
    scene.add(wire, knot);

    /* ---- generator bentuk ---- */
    function fKnot() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const x = Math.cos(t * 2) * (2 + Math.cos(t * 3));
        const y = Math.sin(t * 2) * (2 + Math.cos(t * 3));
        const z = Math.sin(t * 3);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const rr = 0.42 * Math.cbrt(Math.random());
        a[i * 3] = x * 0.62 + rr * Math.sin(ph) * Math.cos(th);
        a[i * 3 + 1] = y * 0.62 + rr * Math.sin(ph) * Math.sin(th);
        a[i * 3 + 2] = z * 0.71 + rr * Math.cos(ph);
      }
      return a;
    }
    function fSphere() {
      const a = new Float32Array(N * 3);
      const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const yy = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - yy * yy));
        const th = ga * i;
        const R = 2.15 + Math.random() * 0.12;
        a[i * 3] = Math.cos(th) * r * R;
        a[i * 3 + 1] = yy * R;
        a[i * 3 + 2] = Math.sin(th) * r * R;
      }
      return a;
    }
    function fWave() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const x = (Math.random() * 2 - 1) * 3.4;
        const z = (Math.random() * 2 - 1) * 2.3;
        a[i * 3] = x;
        a[i * 3 + 1] = Math.sin(x * 1.4) * Math.cos(z * 1.4) * 0.7 + (Math.random() - 0.5) * 0.06;
        a[i * 3 + 2] = z;
      }
      return a;
    }
    function fGalaxy() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        if (Math.random() < 0.12) {
          const r = 0.4 * Math.sqrt(Math.random());
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(2 * Math.random() - 1);
          a[i * 3] = r * Math.sin(ph) * Math.cos(th);
          a[i * 3 + 1] = r * Math.cos(ph) * 0.6;
          a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
          continue;
        }
        const arm = i % 3;
        const t = Math.pow(Math.random(), 0.6);
        const r = t * 3.3;
        const ang = t * 4.4 + arm * ((Math.PI * 2) / 3);
        a[i * 3] = Math.cos(ang) * r + (Math.random() - 0.5) * 0.3 * t;
        a[i * 3 + 1] = (Math.random() - 0.5) * 0.24 * (1.1 - t);
        a[i * 3 + 2] = Math.sin(ang) * r + (Math.random() - 0.5) * 0.3 * t;
      }
      return a;
    }
    let textPts = null;
    function fText() {
      const c = document.createElement('canvas');
      c.width = 360;
      c.height = 170;
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.font = '900 148px Syne, "Arial Black", sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('BA', 180, 90);
      const d = x.getImageData(0, 0, 360, 170).data;
      const pts = [];
      for (let yy = 0; yy < 170; yy += 2) {
        for (let xx = 0; xx < 360; xx += 2) {
          if (d[(yy * 360 + xx) * 4 + 3] > 128) pts.push([(xx - 180) / 48, (90 - yy) / 48]);
        }
      }
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const p = pts.length ? pts[(Math.random() * pts.length) | 0] : [0, 0];
        a[i * 3] = p[0] + (Math.random() - 0.5) * 0.04;
        a[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 0.04;
        a[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      return a;
    }
    fText();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        try {
          textPts = fText();
        } catch (e) {
          /* font belum siap — bentuk teks dilewati */
        }
      });
    }

    const SHAPES = [
      { name: 'TORUS KNOT', make: fKnot },
      { name: 'SPHERE', make: fSphere },
      { name: 'WAVE GRID', make: fWave },
      { name: 'GALAXY', make: fGalaxy },
      { name: 'LOGO "BA"', make: () => textPts || fSphere(), face: true }
    ];
    let idx = 0;
    let target = fKnot();
    const hudD = $('#hudDots');
    hudD.innerHTML = SHAPES.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('');
    function setShape(n) {
      idx = ((n % SHAPES.length) + SHAPES.length) % SHAPES.length;
      const s = SHAPES[idx];
      target = s.cache || (s.cache = s.make());
      $('#hudName').textContent = `OBJ.0${idx + 1} — ${s.name}`;
      [...hudD.children].forEach((d, i) => d.classList.toggle('on', i === idx));
      gsap.fromTo(
        knot.scale,
        { x: 1.14, y: 1.14, z: 1.14 },
        { x: 1, y: 1, z: 1, duration: 1.5, ease: 'elastic.out(1,.55)' }
      );
    }
    setInterval(() => {
      if (heroVisible && !document.hidden) setShape(idx + 1);
    }, RM ? 12000 : 8000);

    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      knot.position.x = w > 900 ? 1.9 : 0;
      wire.position.x = knot.position.x;
    }
    resize();
    addEventListener('resize', resize);

    /* seret + klik untuk ganti bentuk */
    let down = false;
    let moved = 0;
    let px = 0;
    let py = 0;
    let vx = 0;
    let vy = 0;
    let rx2 = 0;
    let ry2 = 0.5;
    hero.addEventListener('pointerdown', (e) => {
      down = true;
      moved = 0;
      px = e.clientX;
      py = e.clientY;
    });
    addEventListener('pointermove', (e) => {
      if (down) {
        const dx = e.clientX - px;
        const dy = e.clientY - py;
        moved += Math.abs(dx) + Math.abs(dy);
        vx = dx * 0.006;
        vy = dy * 0.006;
      }
      px = e.clientX;
      py = e.clientY;
      window._mnx = (e.clientX / innerWidth) * 2 - 1;
      window._mny = (e.clientY / innerHeight) * 2 - 1;
    });
    addEventListener('pointerup', () => {
      if (down && moved < 8) setShape(idx + 1);
      down = false;
    });
    new IntersectionObserver((en) => (heroVisible = en[0].isIntersecting)).observe(hero);

    (function render(t) {
      requestAnimationFrame(render);
      if (!heroVisible) return;
      const face = SHAPES[idx].face;
      if (face) {
        ry2 += (Math.round(ry2 / (Math.PI * 2)) * Math.PI * 2 - ry2) * 0.05;
        rx2 += (0 - rx2) * 0.05;
      } else {
        ry2 += 0.0028 + vx;
        rx2 += vy;
        vx *= 0.93;
        vy *= 0.93;
      }
      knot.rotation.y = ry2;
      knot.rotation.x = rx2;
      wire.rotation.y = -ry2 * 0.25;
      wire.rotation.x = -rx2 * 0.2;

      const hp = clamp((window.__sy || 0) / Math.max(1, hero.offsetHeight), 0, 1);
      knot.position.y = -hp * 1.1;
      wire.position.y = knot.position.y;
      camera.position.z = 6 + hp * 1.6;
      camera.position.x += ((window._mnx || 0) * 0.7 - camera.position.x) * 0.04;
      camera.position.y += (-(window._mny || 0) * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(knot.position.x * 0.6, knot.position.y * 0.5, 0);

      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const halfW = halfH * camera.aspect;
      const wx = (window._mnx || 0) * halfW - knot.position.x;
      const wy = -(window._mny || 0) * halfH - knot.position.y;
      const wz = 0;
      let c = Math.cos(-ry2);
      let s = Math.sin(-ry2);
      const x1 = c * wx + s * wz;
      const z1 = -s * wx + c * wz;
      c = Math.cos(-rx2);
      s = Math.sin(-rx2);
      const y1 = c * wy - s * z1;
      const z2 = s * wy + c * z1;
      const R = 1;
      const R2 = R * R;

      const arr = pos;
      const tg = target;
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        arr[j] += (tg[j] - arr[j]) * 0.055;
        arr[j + 1] += (tg[j + 1] - arr[j + 1]) * 0.055;
        arr[j + 2] += (tg[j + 2] - arr[j + 2]) * 0.055;
        const dx = arr[j] - x1;
        const dy = arr[j + 1] - y1;
        const dz = arr[j + 2] - z2;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < R2) {
          const dd = Math.sqrt(d2) || 0.001;
          const f = ((R - dd) / R) * 0.09;
          arr[j] += (dx / dd) * f;
          arr[j + 1] += (dy / dd) * f;
          arr[j + 2] += (dz / dd) * f;
        }
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    })(0);
  })();

  /* ============================================================
     RENDER KONTEN — semua bagian diisi dari `state`
     ============================================================ */
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const byPath = (obj, path) => path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

  function applyContentBindings() {
    $$('[data-content]').forEach((el) => {
      const value = byPath(state, el.dataset.content);
      if (value != null && value !== '') el.textContent = String(value);
    });
  }

  function renderStats() {
    const wrap = $('#statsWrap');
    if (!wrap) return;
    wrap.innerHTML = state.stats
      .map(
        (s) =>
          `<div class="stat"><span class="stat-n" data-n="${esc(s.value)}" data-s="${esc(s.suffix ?? '')}">00</span>` +
          `<span class="stat-l mono">${esc(s.label)}</span></div>`
      )
      .join('');
  }

  function renderProjects() {
    const list = $('#workList');
    if (!list) return;
    list.innerHTML = state.projects
      .map(
        (p, i) => `
 <article class="work-row rv" data-i="${i}" data-cursor="LIHAT" tabindex="0" role="button" aria-label="Buka detail ${esc(p.title)}">
   <span class="wr-index">${String(i + 1).padStart(3, '0')}</span>
   <h3 class="wr-title">${esc(p.title)}</h3>
   <div class="wr-meta">${p.stack
     .slice(0, 2)
     .map((s) => `<span>${esc(s)}</span>`)
     .join('')}<span>${esc(p.year)}</span></div>
   <span class="wr-year">${esc(p.year)}</span>
   <span class="wr-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg></span>
 </article>`
      )
      .join('');
    const counter = $('#projectCount');
    if (counter) counter.textContent = `(${String(state.projects.length).padStart(2, '0')})`;
  }

  function renderTechGroups() {
    const wrap = $('#tgWrap');
    if (!wrap) return;
    wrap.innerHTML = state.techGroups
      .map(
        (g) => `
 <div class="tg rv">
   <div class="tg-head"><span class="tg-idx">${esc(g.code)}</span><h3 class="tg-name">${esc(g.name)}</h3><span class="tg-count">/ ${String(g.items.length).padStart(2, '0')}</span></div>
   <div class="tg-pills">${g.items.map((t) => `<span class="pill scramble">${esc(t)}</span>`).join('')}</div>
 </div>`
      )
      .join('');
  }

  function renderSteps() {
    const wrap = $('#prSteps');
    if (!wrap) return;
    wrap.insertAdjacentHTML(
      'beforeend',
      state.steps
        .map(
          (s) => `
 <div class="pr-step rv">
   <span class="pr-num">${esc(s.num)}</span>
   <div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p><span class="pr-tag">${esc(s.tag)}</span></div>
 </div>`
        )
        .join('')
    );
  }

  function renderServices() {
    const wrap = $('#svWrap');
    if (!wrap) return;
    wrap.innerHTML = state.services
      .map(
        (x) => `
 <div class="xp-row rv">
   <span class="xp-year">${esc(x.code)}</span>
   <div class="xp-main"><h3>${esc(x.title)}</h3></div>
   <p class="xp-desc">${esc(x.desc)}</p>
 </div>`
      )
      .join('');
  }

  function renderFaqs() {
    const wrap = $('#faqWrap');
    if (!wrap) return;
    wrap.innerHTML = state.faqs
      .map(
        (f, i) => `
 <div class="faq-item rv">
   <button class="faq-q" aria-expanded="false">
     <span class="q-idx">${String(i + 1).padStart(2, '0')}</span>
     <h3>${esc(f.q)}</h3>
     <span class="q-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></span>
   </button>
   <div class="faq-a"><p>${esc(f.a)}</p></div>
 </div>`
      )
      .join('');
  }

  /* teks tentang dengan sorotan @kata@ */
  function renderAbout() {
    const host = $('#aboutText');
    if (!host) return;
    const raw = state.profile.about ?? FALLBACK.profile?.about ?? '';
    const frag = document.createDocumentFragment();
    raw.split(/(@[^@]*@)/).forEach((seg) => {
      const hl = seg.startsWith('@');
      const text = hl ? seg.slice(1, -1) : seg;
      text
        .split(' ')
        .filter(Boolean)
        .forEach((w) => {
          const s = document.createElement('span');
          s.className = 'aw' + (hl ? ' hl' : '');
          s.textContent = w;
          frag.appendChild(s);
          frag.appendChild(document.createTextNode(' '));
        });
    });
    host.innerHTML = '';
    host.appendChild(frag);
  }

  function applyContact() {
    const c = state.contact;
    const set = (sel, attr, value) => {
      const el = $(sel);
      if (el && value) el.setAttribute(attr, value);
    };
    set('#navCta', 'href', c.whatsappLink);
    set('#contactCta', 'href', c.whatsappLinkProject || c.whatsappLink);
    set('#waLink', 'href', c.whatsappLink);
    set('#igLink', 'href', c.instagramLink);
    set('#ghLink', 'href', c.githubLink);
    const phone = $('#copyPhone');
    if (phone && c.whatsapp) {
      phone.innerHTML = `${esc(c.whatsapp)}<span class="copy-hint">— KLIK UNTUK MENYALIN NOMOR</span>`;
    }
  }

  /* ============ PRATINJAU MENGAMBANG PROYEK ============ */
  let prevEl;
  let prevImg;
  let prevUrl;
  const preImgs = [];
  let pvx = 0;
  let pvy = 0;
  let pvs = 0;
  let pvt = 0;
  let lastMx = 0;

  function initPreview() {
    prevEl = $('#workPreview');
    prevImg = $('#prevImg');
    prevUrl = $('#prevUrl');
    if (!prevEl) return;

    state.projects.forEach((p) => {
      const im = new Image();
      im.src = `https://picsum.photos/seed/${p.seed}/800/560.jpg`;
      preImgs.push(im);
    });

    $$('.work-row').forEach((row) => {
      const i = +row.dataset.i;
      row.addEventListener('mouseenter', () => {
        pvt = 1;
        prevUrl.textContent = state.projects[i].url.replace(/^https?:\/\//, '');
        if (prevImg.src !== preImgs[i].src) prevImg.src = preImgs[i].src;
      });
      row.addEventListener('mouseleave', () => (pvt = 0));
      row.addEventListener('click', () => openWork(i));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openWork(i);
        }
      });
    });

    (function pvLoop() {
      pvx += (mx - pvx) * 0.12;
      pvy += (my - pvy) * 0.12;
      pvs += (pvt - pvs) * 0.13;
      const rot = clamp((mx - lastMx) * 0.6, -14, 14);
      lastMx += (mx - lastMx) * 0.2;
      const px2 = clamp(pvx + 26, 10, innerWidth - 360);
      const py2 = clamp(pvy - 262, 10, innerHeight - 272);
      prevEl.style.transform = `translate3d(${px2}px,${py2}px,0) rotate(${rot}deg) scale(${0.7 + pvs * 0.3})`;
      prevEl.style.opacity = pvs.toFixed(3);
      requestAnimationFrame(pvLoop);
    })();
  }

  /* ============ MODAL PROYEK ============ */
  const modal = $('#modal');
  let curWork = 0;

  function fillModal(i) {
    if (!state.projects.length) return;
    curWork = i;
    const p = state.projects[i];
    $('#mImg').src = `https://picsum.photos/seed/${p.seed}/1100/760.jpg`;
    $('#mUrl').textContent = p.url.replace(/^https?:\/\//, '');
    $('#mIdx').textContent = `${String(i + 1).padStart(2, '0')} / ${String(state.projects.length).padStart(2, '0')}`;
    $('#mYear').textContent = p.year;
    $('#mTitle').textContent = p.title;
    $('#mDesc').textContent = p.desc;
    $('#mPts').innerHTML = p.points.map((x) => `<li>${esc(x)}</li>`).join('');
    $('#mStack').innerHTML = p.stack.map((s) => `<span class="pill">${esc(s)}</span>`).join('');
    $('#mLink').href = p.url;
  }

  function openWork(i) {
    fillModal(i);
    modal.classList.add('open');
    if (lenis) lenis.stop();
    gsap.fromTo('#mPanel', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out' });
    gsap.fromTo('.m-overlay', { opacity: 0 }, { opacity: 1, duration: 0.4 });
  }

  function closeWork() {
    gsap.to('#mPanel', { y: 50, opacity: 0, duration: 0.35, ease: 'power3.in' });
    gsap.to('.m-overlay', {
      opacity: 0,
      duration: 0.35,
      onComplete: () => {
        modal.classList.remove('open');
        if (lenis) lenis.start();
      }
    });
  }

  /* ============ ANIMASI & INTERAKSI ============ */
  function initAnimations() {
    $$('[data-scroll]').forEach((a) =>
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const target = a.getAttribute('href');
        if (document.body.classList.contains('menu-open')) {
          toggleMenu(false);
          setTimeout(() => scrollTo(target, { offset: 0 }), 450);
        } else scrollTo(target, { offset: 0 });
      })
    );
    $('#toTop').addEventListener('click', () => scrollTo(0));

    $('#mClose').addEventListener('click', closeWork);
    $('#mOverlay').addEventListener('click', closeWork);
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeWork();
    });
    $('#mPrev').addEventListener('click', () =>
      fillModal((curWork - 1 + state.projects.length) % state.projects.length)
    );
    $('#mNext').addEventListener('click', () => fillModal((curWork + 1) % state.projects.length));

    /* FAQ akordeon */
    $$('.faq-q').forEach((btn) =>
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const a = item.querySelector('.faq-a');
        const open = item.classList.contains('open');
        $$('.faq-item.open').forEach((o) => {
          if (o !== item) {
            o.classList.remove('open');
            o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            gsap.to(o.querySelector('.faq-a'), { height: 0, duration: 0.45, ease: 'power3.inOut' });
          }
        });
        if (open) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          gsap.to(a, { height: 0, duration: 0.45, ease: 'power3.inOut' });
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          gsap.to(a, { height: 'auto', duration: 0.55, ease: 'power3.inOut' });
        }
      })
    );

    /* teks tentang */
    gsap.to('#aboutText .aw', {
      opacity: 1,
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: { trigger: '#aboutText', start: 'top 78%', end: 'bottom 45%', scrub: 0.5 }
    });

    /* judul section: reveal per baris */
    $$('.sec-inner').forEach((el) =>
      gsap.to(el, {
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      })
    );

    /* animasi scroll umum */
    $$('.rv').forEach((el) =>
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      })
    );

    /* angka statistik */
    $$('.stat-n').forEach((el) => {
      const target = +el.dataset.n;
      const suf = el.dataset.s || '';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          const o = { v: 0 };
          gsap.to(o, {
            v: target,
            duration: 1.7,
            ease: 'power2.out',
            onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(2, '0') + suf)
          });
        }
      });
    });

    /* dot nav aktif */
    $$('.dotnav a').forEach((a) => {
      ScrollTrigger.create({
        trigger: a.getAttribute('href'),
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (s) => a.classList.toggle('on', s.isActive)
      });
    });

    /* garis proses */
    gsap.to('#prFill', {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: '#prSteps', start: 'top 70%', end: 'bottom 55%', scrub: 0.4 }
    });

    /* efek scramble */
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/';
    $$('.scramble').forEach((el) => {
      const orig = el.textContent;
      let iv = null;
      el.addEventListener('mouseenter', () => {
        let f = 0;
        clearInterval(iv);
        iv = setInterval(() => {
          el.textContent = orig
            .split('')
            .map((c, i) => (i < f ? c : c === ' ' ? ' ' : CH[(Math.random() * CH.length) | 0]))
            .join('');
          if (++f > orig.length) {
            clearInterval(iv);
            el.textContent = orig;
          }
        }, 26);
      });
    });

    /* tombol magnetik */
    $$('.mag').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.35,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.4,
          ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ============ MENU FULLSCREEN ============ */
  let menuOpen = false;
  function toggleMenu(force) {
    const open = force !== undefined ? force : !menuOpen;
    if (open === menuOpen) return;
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    const ov = $('#menuOverlay');
    const links = $$('.m-link a');
    if (open) {
      ov.style.visibility = 'visible';
      if (lenis) lenis.stop();
      gsap.to(ov, { clipPath: 'inset(0% 0 0% 0)', duration: 0.7, ease: 'power4.inOut' });
      gsap.to(links, { y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.06, delay: 0.35, overwrite: true });
    } else {
      gsap.to(links, { y: '120%', duration: 0.35, ease: 'power3.in', stagger: 0.03, overwrite: true });
      gsap.to(ov, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.6,
        ease: 'power4.inOut',
        delay: 0.15,
        onComplete: () => (ov.style.visibility = 'hidden')
      });
      if (lenis) lenis.start();
    }
  }

  /* ============ TOAST + SALIN NOMOR WA ============ */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function initCopyPhone() {
    $('#copyPhone').addEventListener('click', async () => {
      const num = state.contact.whatsappRaw || '+6285155402545';
      try {
        await navigator.clipboard.writeText(num);
        toast('NOMOR WHATSAPP DISALIN ✓');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = num;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          toast('NOMOR WHATSAPP DISALIN ✓');
        } catch (e2) {
          toast(`GAGAL MENYALIN — NOMOR: ${state.contact.whatsapp || num}`);
        }
        ta.remove();
      }
    });
  }

  /* ============ FORM KONTAK → POST /api/contact ============ */
  function initForm() {
    const form = $('#contactForm');
    if (!form) return;
    const status = $('#formStatus');
    const submit = $('#formSubmit');

    const setStatus = (msg, kind) => {
      status.textContent = msg;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: $('#cName').value.trim(),
        email: $('#cEmail').value.trim(),
        subject: $('#cSubject').value.trim(),
        message: $('#cMessage').value.trim(),
        website: $('#cWebsite').value /* honeypot */
      };

      if (payload.name.length < 2) return setStatus('NAMA MINIMAL 2 KARAKTER.', 'err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) return setStatus('EMAIL TIDAK VALID.', 'err');
      if (payload.message.length < 10) return setStatus('PESAN MINIMAL 10 KARAKTER.', 'err');

      submit.disabled = true;
      setStatus('MENGIRIM…');

      try {
        if (!window.PortokuAPI || state.source !== 'api') throw new Error('offline');
        const result = await window.PortokuAPI.sendMessage(payload);
        form.reset();
        setStatus(`TERKIRIM ✓ (ID #${result.id}) — SAYA BALAS < 24 JAM.`, 'ok');
        toast('PESAN TERKIRIM ✓');
      } catch (error) {
        if (error.message === 'offline') {
          setStatus('BACKEND BELUM AKTIF DI SITUS INI — SILAKAN HUBUNGI VIA WHATSAPP.', 'err');
          toast('BACKEND OFFLINE — PAKAI WHATSAPP');
        } else {
          setStatus(String(error.message || 'GAGAL MENGIRIM.').toUpperCase(), 'err');
          toast('GAGAL MENGIRIM PESAN');
        }
      } finally {
        submit.disabled = false;
      }
    });
  }

  /* ============ EASTER EGG: MATRIX ============ */
  const MatrixFX = (() => {
    const cv = $('#matrixFx');
    const ctx = cv.getContext('2d');
    let on = false;
    let raf;
    let to = null;
    let keyH = null;
    let last = 0;
    let cols = 0;
    let drops = [];
    const CHS = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF<>/#$%';
    function size() {
      cv.width = innerWidth;
      cv.height = innerHeight;
      cols = Math.ceil(cv.width / 16);
      drops = Array(cols).fill(1);
    }
    function loop(t) {
      if (!on) return;
      raf = requestAnimationFrame(loop);
      if (t - last < 50) return;
      last = t;
      ctx.fillStyle = 'rgba(5,6,4,.16)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.font = '15px "JetBrains Mono",monospace';
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = Math.random() < 0.03 ? '#eaffd0' : '#7ab31a';
        ctx.fillText(CHS[(Math.random() * CHS.length) | 0], i * 16, drops[i] * 16);
        if (drops[i] * 16 > cv.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    function start() {
      if (on) return;
      on = true;
      size();
      cv.style.display = 'block';
      if (lenis) lenis.stop();
      setTimeout(() => addEventListener('click', stop, { once: true }), 0);
      keyH = (e) => {
        if (e.key === 'Escape') stop();
      };
      addEventListener('keydown', keyH);
      to = setTimeout(stop, 12000);
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      if (!on) return;
      on = false;
      cancelAnimationFrame(raf);
      clearTimeout(to);
      removeEventListener('keydown', keyH);
      cv.style.display = 'none';
      if (lenis) lenis.start();
    }
    return { start, stop };
  })();

  /* ============ TERMINAL INTERAKTIF ============ */
  const tOut = $('#termOut');
  const tBody = $('#termBody');
  const tTyped = $('#termTyped');
  const tInput = $('#termInput');
  const tRow = $('#termInputRow');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollDown = () => (tBody.scrollTop = tBody.scrollHeight);

  function print(html) {
    const d = document.createElement('div');
    d.className = 'tl';
    d.innerHTML = html;
    tOut.appendChild(d);
    scrollDown();
    return d;
  }
  function echo(cmd) {
    print(`<span class="t-lime">bima@web:~$</span> ${esc(cmd)}`);
  }
  async function typeCmd(cmd) {
    const d = print(`<span class="t-lime">bima@web:~$</span> <span class="tc"></span><span class="t-caret"></span>`);
    const sp = d.querySelector('.tc');
    for (const c of cmd) {
      sp.textContent += c;
      scrollDown();
      await wait(30 + Math.random() * 45);
    }
    d.querySelector('.t-caret')?.remove();
    await wait(220);
  }

  const CMDS = {
    help: () => `<span class="t-dim">PERINTAH TERSEDIA:</span>
  <span class="t-lime">help</span>            daftar perintah
  <span class="t-lime">whoami</span>          identitas
  <span class="t-lime">skills</span>          keahlian teknis
  <span class="t-lime">projects</span>        proyek portofolio
  <span class="t-lime">open &lt;no&gt;</span>      buka detail proyek (1–${state.projects.length})
  <span class="t-lime">services</span>       layanan yang tersedia
  <span class="t-lime">process</span>        alur kerja 4 tahap
  <span class="t-lime">faq</span>             pertanyaan umum
  <span class="t-lime">contact</span>         info kontak
  <span class="t-lime">status</span>         status ketersediaan
  <span class="t-lime">api</span>            status koneksi backend
  <span class="t-lime">date</span>            waktu server (WIB)
  <span class="t-lime">banner</span>          spanduk ASCII
  <span class="t-lime">coffee</span>          seduh kopi
  <span class="t-lime">matrix</span>          ???
  <span class="t-lime">sudo hire-me</span>   eksekusi rekrutmen
  <span class="t-lime">clear</span>           bersihkan layar`,
    whoami: () =>
      `${state.profile.name ?? 'Bima Abiyasa'} — ${state.profile.role ?? 'Full Stack Web Developer'}. ${
        state.profile.location ?? 'Bogor, Indonesia'
      }. Siap mengerjakan proyek web Anda, dari ide sampai live.`,
    skills: () =>
      state.techGroups
        .map((g) => `<span class="t-lime">${esc(g.name.toLowerCase().padEnd(9))}</span> ${esc(g.items.join(' · '))}`)
        .join('\n'),
    projects: () =>
      state.projects
        .map((p, i) => `  <span class="t-dim">${String(i + 1).padStart(2, '0')}</span>  <span class="t-lime">${esc(p.title.padEnd(15))}</span> ${esc(p.tagline)}`)
        .join('\n') + `\n\n<span class="t-dim">ketik "open 1" s.d. "open ${state.projects.length}" untuk membuka detail</span>`,
    services: () => state.services.map((x) => `<span class="t-lime">${esc(x.code)}</span>  ${esc(x.title)}`).join('\n'),
    process: () => state.steps.map((s) => `<span class="t-lime">${esc(s.num)}</span>  ${esc(s.title)} <span class="t-dim">— ${esc(s.tag)}</span>`).join('\n'),
    faq: () =>
      state.faqs.map((f, i) => `<span class="t-lime">${String(i + 1).padStart(2, '0')}</span> ${esc(f.q)}`).join('\n') +
      `\n<span class="t-dim">jawaban lengkap ada di bagian FAQ halaman</span>`,
    contact: () =>
      `<span class="t-lime">whatsapp </span> ${esc(state.contact.whatsapp)}
<span class="t-lime">instagram</span> @${esc(state.contact.instagram)}
<span class="t-lime">github   </span> github.com/${esc(state.contact.github)}
<span class="t-lime">lokasi   </span> ${esc(state.profile.location)} (UTC+7)
<span class="t-dim">respons ${esc(state.profile.responseTime ?? '< 24 jam')} — biasanya jauh lebih cepat</span>`,
    status: () =>
      `<span class="t-lime">●</span> ${state.profile.available ? 'TERSEDIA — siap menerima proyek baru' : 'SEDANG PENUH — hubungi untuk daftar tunggu'}
<span class="t-dim">lokasi: ${esc(state.profile.location)} · zona waktu: ${esc(state.profile.timezoneLabel ?? 'WIB')} (UTC+7)</span>`,
    api: () =>
      state.source === 'api'
        ? `<span class="t-lime">● TERHUBUNG</span> — konten dimuat dari ${esc(window.PortokuAPI?.base || 'origin yang sama')}/api/bootstrap
<span class="t-dim">endpoint: /api/projects · /api/services · /api/faqs · POST /api/contact</span>`
        : `<span class="t-org">● MODE STATIS</span> — backend tidak terdeteksi, memakai data bawaan
<span class="t-dim">jalankan "npm run dev" di repo untuk mengaktifkan API.</span>`,
    date: () => new Date().toLocaleString('id-ID', { timeZone: tz }) + ' ' + (state.profile.timezoneLabel ?? 'WIB'),
    banner: () => `<span class="t-lime">██████╗ ██╗███╗   ███╗ █████╗
██╔══██╗██║████╗ ████║██╔══██╗
██████╔╝██║██╔████╔██║███████║
██╔══██╗██║██║╚██╔╝██║██╔══██║
██████╔╝██║██║ ╚═╝ ██║██║  ██║
╚═════╝ ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝</span>
<span class="t-dim">${esc(state.profile.name)} — ${esc(state.profile.role).toUpperCase()}</span>`,
    coffee: () => `      ) )
     ( (
   .........
   |       |]
   \\       /
    \`-----'
<span class="t-org">Error 418:</span> Saya teko, bukan mesin kopi.`,
    matrix: () => {
      MatrixFX.start();
      return 'selamat datang di matriks… <span class="t-dim">(klik / Esc untuk keluar)</span>';
    },
    ls: () => 'about.txt   skills.json   projects/   contact.md',
    cat: (a) =>
      a[0] === 'about.txt'
        ? esc(String(state.profile.about ?? '').replace(/@/g, ''))
        : `<span class="t-org">cat:</span> ${esc(a[0] || '')}: file tidak ditemukan`,
    open: (a) => {
      const n = parseInt(a[0], 10);
      if (n >= 1 && n <= state.projects.length) {
        openWork(n - 1);
        return `membuka <span class="t-lime">${esc(state.projects[n - 1].title)}</span> `;
      }
      return `<span class="t-org">open:</span> pilih nomor 1–${state.projects.length}. contoh: <span class="t-lime">open 2</span>`;
    }
  };

  async function sudoHire() {
    print('[sudo] password untuk bima: <span class="t-dim">********</span>');
    await wait(650);
    print('<span class="t-lime">AKSES DIBERIKAN.</span> Membuka jalur rekrutmen…');
    await wait(750);
    print(`membuka WhatsApp… <span class="t-dim">${esc(state.contact.whatsapp)}</span>`);
    await wait(500);
    window.open(WA_LINK, '_blank');
  }

  const hist = [];
  let hi = 0;
  function exec(raw) {
    const cmd = raw.trim();
    echo(cmd);
    if (!cmd) return;
    hist.push(cmd);
    hi = hist.length;
    const parts = cmd.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    if (name === 'sudo') {
      if (args.join(' ') === 'hire-me') {
        sudoHire();
        return;
      }
      print(`<span class="t-org">sudo:</span> perintah tidak dikenal — coba <span class="t-lime">sudo hire-me</span>`);
      return;
    }
    if (name === 'rm' && args.join(' ').includes('-rf')) {
      print(`<span class="t-org">Ditolak.</span> Server ini pernah masuk produksi. Tidak hari ini.`);
      return;
    }
    if (name === 'clear') {
      tOut.innerHTML = '';
      return;
    }
    const fn = CMDS[name];
    if (fn) print(fn(args));
    else print(`<span class="t-org">perintah tidak dikenal: ${esc(name)}</span> — ketik <span class="t-lime">help</span>`);
  }

  function initTerminal() {
    tInput.addEventListener('input', () => (tTyped.textContent = tInput.value));
    tInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const v = tInput.value;
        tInput.value = '';
        tTyped.textContent = '';
        exec(v);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        hi = Math.max(0, hi - 1);
        tInput.value = hist[hi] || '';
        tTyped.textContent = tInput.value;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        hi = Math.min(hist.length, hi + 1);
        tInput.value = hist[hi] || '';
        tTyped.textContent = tInput.value;
      }
    });
    $('#term').addEventListener('click', () => tInput.focus({ preventScroll: true }));

    let termStarted = false;
    const startDemo = () => {
      if (termStarted) return;
      termStarted = true;
      (async () => {
        await typeCmd('whoami');
        print(CMDS.whoami());
        await wait(380);
        await typeCmd('status');
        print(CMDS.status());
        await wait(320);
        print(`<span class="t-dim">// terminal ini nyata — ketik "help" lalu tekan Enter. hint: coba "matrix"</span>`);
        tRow.classList.add('on');
        scrollDown();
      })();
    };
    ScrollTrigger.create({ trigger: '#terminal', start: 'top 72%', once: true, onEnter: startDemo });
  }

  /* ============ PRELOADER ============ */
  function preload() {
    const cnt = $('#preCount');
    const bar = $('#preBar i');
    const log = $('#preLog');
    const msgs = ['INISIALISASI SISTEM…', 'MEMUAT MESIN 3D… OK', 'MENYUSUN PARTIKEL… OK', `MENGHUBUNGI ${state.source === 'api' ? 'DATABASE' : 'DATA LOKAL'}… OK`, 'SIAP.'];
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 2.4 + 0.9);
      cnt.innerHTML = String(Math.floor(p)).padStart(3, '0') + '<em>%</em>';
      bar.style.transform = `scaleX(${p / 100})`;
      log.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 22))];
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(reveal, 300);
      }
    }, 34);
  }

  function reveal() {
    const tl = gsap.timeline();
    tl.to('#preCount,#preLog', { yPercent: -120, opacity: 0, duration: 0.5, ease: 'power3.in' })
      .to('#preBar', { scaleX: 0, transformOrigin: 'right', duration: 0.45, ease: 'power3.in' }, '<')
      .to('#preloader', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=.05')
      .set('#preloader', { display: 'none' })
      .to('.ht-inner', { y: 0, duration: 1.15, ease: 'power4.out', stagger: 0.13 }, '-=.6')
      .to('.hero-fade', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=.75')
      .to(
        '.nav',
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          onStart: () => (document.querySelector('.nav').style.transform = '')
        },
        '-=.8'
      )
      .add(() => {
        if (lenis) lenis.start();
      });
  }

  /* ============ INDIKATOR SUMBER DATA ============ */
  function showSourceBadge() {
    const badge = $('#dataBadge');
    const label = $('#dataBadgeSrc');
    if (!badge || !label) return;
    const online = state.source === 'api';
    label.textContent = online ? 'REST API' : 'STATIS (OFFLINE)';
    badge.classList.toggle('offline', !online);
    badge.classList.add('on');
    setTimeout(() => badge.classList.remove('on'), 5000);
  }

  /* ============ BOOT ============ */
  async function boot() {
    /* 1. ambil data dari API (dengan fallback otomatis) */
    const res = window.PortokuAPI ? await window.PortokuAPI.fetchBootstrap() : { source: 'static', data: null };
    state.source = res.source;
    if (res.data) Object.assign(state, res.data);
    if (!state.projects.length) state.projects = FALLBACK.projects ?? [];
    WA_LINK = state.contact.whatsappLink || WA_LINK;

    /* 2. isi halaman */
    applyContentBindings();
    renderMarquees();
    renderAbout();
    renderStats();
    renderProjects();
    renderTechGroups();
    renderSteps();
    renderServices();
    renderFaqs();
    applyContact();

    /* 3. aktifkan animasi & interaksi */
    initPreview();
    initAnimations();
    initCopyPhone();
    initForm();
    initTerminal();
    gsap.set('.m-link a', { y: '120%' });
    $('#menuBtn').addEventListener('click', () => toggleMenu());

    fitTitles();
    if (ScrollTrigger) ScrollTrigger.refresh();
    showSourceBadge();
    preload();
  }

  window.addEventListener('load', () => {
    fitTitles();
    if (ScrollTrigger) ScrollTrigger.refresh();
  });

  boot();
})();
