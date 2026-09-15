/* ============================================================
   INDEX — titik masuk server.
   PORT default 3000 (bisa diubah via env).
   ============================================================ */
import { createApp } from './app.js';
import { closeDb } from './db.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = createApp({ serveClient: process.env.SERVE_CLIENT !== 'false' });

const server = app.listen(PORT, HOST, () => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`\n  PORTOKU API siap`);
  console.log(`  → situs   : http://${shown}:${PORT}/`);
  console.log(`  → API     : http://${shown}:${PORT}/api/bootstrap`);
  console.log(`  → health  : http://${shown}:${PORT}/api/health`);
  console.log(`  → runtime : node ${process.version}\n`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} diterima — menutup server…`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 4000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
