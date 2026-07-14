import 'dotenv/config';
import { createApp } from './app.js';
import runMigrations from './db/migrate.js';

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  await runMigrations();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[api] Health Tracker API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[api] Failed to start:', err);
  process.exit(1);
});
