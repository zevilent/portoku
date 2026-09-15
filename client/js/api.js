/* ============================================================
   API CLIENT — jembatan antara UI dan REST API
   ------------------------------------------------------------
   Alur: coba API → kalau gagal/timeout → pakai PORTOKU_FALLBACK.
   Hasil akhir selalu { source: 'api' | 'static', ...data }.
   ============================================================ */
(function () {
  const cfg = window.PORTOKU_CONFIG ?? {};
  const base = String(cfg.API_BASE ?? '').replace(/\/+$/, '');
  const timeout = Number(cfg.API_TIMEOUT ?? 5000);

  const url = (path) => `${base}${path}`;

  /** fetch dengan batas waktu; melempar error bila lewat batas. */
  async function request(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url(path), {
        signal: controller.signal,
        headers: { accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (!payload || payload.ok !== true) throw new Error('Respons API tidak valid');
      return payload.data;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Ambil seluruh konten dalam satu request; null bila API tak terjangkau. */
  async function fetchBootstrap(options = {}) {
    if (cfg.FORCE_OFFLINE) return { source: 'static', data: null };
    try {
      const data = await request('/api/bootstrap');
      return { source: 'api', data };
    } catch (error) {
      if (!options.silent) {
        console.info('[portoku] API tidak tersedia — memakai data statis.', error.message);
      }
      return { source: 'static', data: null };
    }
  }

  /** Kirim pesan form kontak. Melempar error dengan pesan siap tampil. */
  async function sendMessage(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url('/api/contact'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || `Gagal mengirim (HTTP ${res.status}).`);
      }
      return body.data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Server tidak merespons. Coba lagi.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Cek apakah API hidup — dipakai terminal & indikator status. */
  async function health() {
    try {
      return await request('/api/health');
    } catch {
      return null;
    }
  }

  window.PortokuAPI = { fetchBootstrap, sendMessage, health, base, timeout };
})();
