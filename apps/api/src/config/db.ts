import { getPool } from '../db/pg';
import runMigrations from '../db/migrate';

const pool = getPool();

(async () => {
  await runMigrations();
})();

export { pool, getPool };

