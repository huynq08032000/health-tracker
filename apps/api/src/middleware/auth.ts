import type { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler.js';
import { asyncHandler } from './asyncHandler.js';
import crypto from 'crypto';
import { getOne, run } from '../db/pg.js';

declare module 'express' {
  interface Request {
    user?: { id: number };
  }
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing token');
  }
  const token = header.slice(7);
  const session = await getOne<{ user_id: number }>(
    `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()`,
    [token],
  );
  if (!session) {
    throw new HttpError(401, 'Invalid token');
  }
  req.user = { id: session.user_id };
  next();
});

export async function issueToken(userId: number): Promise<string> {
  const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await run(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt],
  );
  return token;
}

export async function revokeToken(token: string) {
  await run(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export async function cleanupExpiredSessions() {
  await run(`DELETE FROM sessions WHERE expires_at <= NOW()`);
}

