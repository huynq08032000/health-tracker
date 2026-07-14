import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL environment variable');
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

export async function getOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function run(text: string, params?: any[]): Promise<{ insertId?: number; rowCount: number }> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return {
    insertId: typeof result.rows[0]?.id === 'number' ? (result.rows[0].id as number) : undefined,
    rowCount: result.rowCount ?? 0,
  };
}
