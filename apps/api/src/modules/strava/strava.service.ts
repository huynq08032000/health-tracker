import { query, getOne, run } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { StravaConnection } from '@health-tracker/shared';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

function buildState(userId: number): string {
  // Simple state: userId + timestamp to prevent CSRF
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64url');
}

function parseState(state: string): number | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const [userIdStr] = decoded.split(':');
    return Number(userIdStr);
  } catch {
    return null;
  }
}

export const stravaService = {
  async getAuthorizationUrl(userId: number): Promise<string> {
    const clientId = process.env.STRAVA_CLIENT_ID;
    if (!clientId) throw new HttpError(500, 'Strava is not configured');
    const redirectUri = process.env.STRAVA_REDIRECT_URI || `${STRAVA_API_BASE}/callback`;
    const state = buildState(userId);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'activity:read',
      state,
    });
    return `${STRAVA_AUTH_URL}?${params.toString()}`;
  },

  async handleCallback(code: string, state: string): Promise<void> {
    const userId = parseState(state);
    if (!userId) throw new HttpError(400, 'Invalid state');

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new HttpError(500, 'Strava is not configured');

    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(400, `Strava token exchange failed: ${text}`);
    }

    const tokenData = await res.json() as {
      athlete: { id: number };
      access_token: string;
      refresh_token: string;
      expires_at: number;
      expires_in: number;
      scope: string;
    };

    const expiresAt = new Date(tokenData.expires_at * 1000).toISOString();

    await run(
      `INSERT INTO strava_connections (user_id, strava_athlete_id, access_token, refresh_token, expires_at, scope)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         strava_athlete_id = EXCLUDED.strava_athlete_id,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         scope = EXCLUDED.scope,
         updated_at = NOW()`,
      [userId, tokenData.athlete.id, tokenData.access_token, tokenData.refresh_token, expiresAt, tokenData.scope || null],
    );
  },

  async getStatus(userId: number): Promise<{ connected: boolean; athleteId?: number }> {
    const row = await getOne<{ strava_athlete_id: number }>(
      'SELECT strava_athlete_id FROM strava_connections WHERE user_id = $1',
      [userId],
    );
    if (!row) return { connected: false };
    return { connected: true, athleteId: row.strava_athlete_id };
  },

  async disconnect(userId: number): Promise<void> {
    await run('DELETE FROM strava_connections WHERE user_id = $1', [userId]);
  },

  async syncActivities(userId: number): Promise<{ activitiesSynced: number; stepsAdded: number; caloriesBurnedAdded: number; exerciseMinAdded: number }> {
    const conn = await getOne<StravaConnection>(
      'SELECT * FROM strava_connections WHERE user_id = $1',
      [userId],
    );
    if (!conn) throw new HttpError(404, 'Strava not connected');

    // Refresh token if expired
    const expiresAt = new Date(conn.expires_at).getTime();
    let accessToken = conn.access_token;
    if (Date.now() >= expiresAt) {
      accessToken = await this.refreshAccessToken(conn.refresh_token);
      await run(
        'UPDATE strava_connections SET access_token = $1, expires_at = $2, updated_at = NOW() WHERE user_id = $3',
        [accessToken, new Date(Date.now() + 3600 * 1000).toISOString(), userId],
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?after=${encodeURIComponent(today + 'T00:00:00Z')}&per_page=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(400, `Strava API error: ${text}`);
    }

    const activities = await res.json() as Array<{
      start_date: string;
      type: string;
      distance: number;
      moving_time: number;
      calories?: number | null;
    }>;

    let totalSteps = 0;
    let totalCalories = 0;
    let totalMinutes = 0;

    for (const activity of activities) {
      totalCalories += activity.calories || 0;
      totalMinutes += Math.round(activity.moving_time / 60);
      // Estimate steps from distance (average stride ~0.762m)
      totalSteps += Math.round(activity.distance / 0.762);
    }

    // Upsert into daily_logs
    await query(
      `INSERT INTO daily_logs (user_id, log_date, steps, calories_burned, exercise_min)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, log_date) DO UPDATE SET
         steps = COALESCE(daily_logs.steps, 0) + EXCLUDED.steps,
         calories_burned = COALESCE(daily_logs.calories_burned, 0) + EXCLUDED.calories_burned,
         exercise_min = COALESCE(daily_logs.exercise_min, 0) + EXCLUDED.exercise_min,
         updated_at = NOW()
       RETURNING id`,
      [userId, today, totalSteps, totalCalories, totalMinutes],
    );

    return {
      activitiesSynced: activities.length,
      stepsAdded: totalSteps,
      caloriesBurnedAdded: totalCalories,
      exerciseMinAdded: totalMinutes,
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new HttpError(500, 'Strava is not configured');

    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(400, `Strava refresh failed: ${text}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  },
};
