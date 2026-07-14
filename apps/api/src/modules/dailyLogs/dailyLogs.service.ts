import { query, getOne, run } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { UpsertDailyLogInput, DailyLog } from '@health-tracker/shared';

export async function recomputeIntake(userId: number, logDate: string): Promise<number> {
  const { rows } = await query<{ total: number }>(
    `SELECT COALESCE(SUM(calories), 0) AS total FROM food_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, logDate],
  );
  const total = rows[0]?.total ?? 0;
  await run(
    `UPDATE daily_logs SET calories_intake = $1, updated_at = NOW() WHERE user_id = $2 AND log_date = $3`,
    [total, userId, logDate],
  );
  return total;
}

export const dailyLogService = {
  async getByDate(userId: number, logDate: string): Promise<DailyLog | null> {
    return (await getOne<DailyLog>('SELECT * FROM daily_logs WHERE user_id = $1 AND log_date = $2', [userId, logDate])) ?? null;
  },

  async getById(id: number): Promise<DailyLog> {
    const row = await getOne<DailyLog>('SELECT * FROM daily_logs WHERE id = $1', [id]);
    if (!row) throw new HttpError(404, 'Daily log not found');
    return row;
  },

  async range(userId: number, from: string, to: string): Promise<DailyLog[]> {
    const { rows } = await query<DailyLog>(
      `SELECT * FROM daily_logs WHERE user_id = $1 AND log_date BETWEEN $2 AND $3 ORDER BY log_date`,
      [userId, from, to],
    );
    return rows;
  },

  async upsert(userId: number, input: UpsertDailyLogInput): Promise<DailyLog> {
    const recommendedWater = input.weight_kg ? Math.round(input.weight_kg * 0.4 * 1000) : undefined;

    await query(
      `INSERT INTO daily_logs
        (user_id, log_date, weight_kg, water_ml, recommended_water_ml, water_reminder_interval_minutes, steps, exercise_min, calories_burned, sleep_hours, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id, log_date) DO UPDATE SET
        weight_kg = COALESCE(EXCLUDED.weight_kg, daily_logs.weight_kg),
        water_ml = COALESCE(EXCLUDED.water_ml, daily_logs.water_ml),
        recommended_water_ml = COALESCE(EXCLUDED.recommended_water_ml, daily_logs.recommended_water_ml),
        water_reminder_interval_minutes = COALESCE(EXCLUDED.water_reminder_interval_minutes, daily_logs.water_reminder_interval_minutes),
        steps = COALESCE(EXCLUDED.steps, daily_logs.steps),
        exercise_min = COALESCE(EXCLUDED.exercise_min, daily_logs.exercise_min),
        calories_burned = COALESCE(EXCLUDED.calories_burned, daily_logs.calories_burned),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_logs.sleep_hours),
        note = COALESCE(EXCLUDED.note, daily_logs.note),
        updated_at = NOW()`,
      [
        userId,
        input.log_date,
        input.weight_kg ?? null,
        input.water_ml ?? null,
        recommendedWater ?? (input.recommended_water_ml ?? null),
        input.water_reminder_interval_minutes ?? 20,
        input.steps ?? null,
        input.exercise_min ?? null,
        input.calories_burned ?? null,
        input.sleep_hours ?? null,
        input.note ?? null,
      ],
    );

    await recomputeIntake(userId, input.log_date);
    return (await this.getByDate(userId, input.log_date))!;
  },

  async update(id: number, input: UpsertDailyLogInput): Promise<DailyLog> {
    await this.getById(id);
    const current = await this.getById(id);

    const recommendedWater = input.weight_kg ? Math.round(input.weight_kg * 0.4 * 1000) : undefined;

    const { rows } = await query<DailyLog>(
      `UPDATE daily_logs SET
        weight_kg = COALESCE($1, weight_kg),
        water_ml = COALESCE($2, water_ml),
        recommended_water_ml = COALESCE($3, recommended_water_ml),
        water_reminder_interval_minutes = COALESCE($4, water_reminder_interval_minutes),
        steps = COALESCE($5, steps),
        exercise_min = COALESCE($6, exercise_min),
        calories_burned = COALESCE($7, calories_burned),
        sleep_hours = COALESCE($8, sleep_hours),
        note = COALESCE($9, note),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        input.weight_kg ?? null,
        input.water_ml ?? null,
        recommendedWater ?? (input.recommended_water_ml ?? null),
        input.water_reminder_interval_minutes ?? 20,
        input.steps ?? null,
        input.exercise_min ?? null,
        input.calories_burned ?? null,
        input.sleep_hours ?? null,
        input.note ?? null,
        id,
      ],
    );
    const updated = rows[0];
    if (input.log_date) await recomputeIntake(current.user_id, input.log_date);
    return updated;
  },
};
