import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../db/pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await query(sql);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS recommended_water_ml INTEGER DEFAULT 0`);
  await query(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS water_reminder_interval_minutes INTEGER DEFAULT 20`);
  await query(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS sleep_hours REAL DEFAULT 0`);
  await query(`ALTER TABLE strava_connections ADD COLUMN IF NOT EXISTS scope TEXT`);
}

export default runMigrations;
