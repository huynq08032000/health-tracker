import { getPool } from '../db/pg.js';
import runMigrations from '../db/migrate.js';

const pool = getPool();

(async () => {
  await runMigrations();
})();

export { pool, getPool };

