import { query, getOne, run, transaction } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { CreateFoodLogInput, UpdateFoodLogInput, FoodLog } from '@health-tracker/shared';
import { recomputeIntake } from '../dailyLogs/dailyLogs.service.js';

export const foodLogService = {
  async listByDate(userId: number, logDate: string): Promise<FoodLog[]> {
    const { rows } = await query<FoodLog>(
      'SELECT * FROM food_logs WHERE user_id = $1 AND log_date = $2 ORDER BY id',
      [userId, logDate],
    );
    return rows;
  },

  async getById(id: number): Promise<FoodLog> {
    const row = await getOne<FoodLog>('SELECT * FROM food_logs WHERE id = $1', [id]);
    if (!row) throw new HttpError(404, 'Food log not found');
    return row;
  },

  async create(userId: number, input: CreateFoodLogInput): Promise<FoodLog> {
    return transaction(async (client) => {
      await client.query(
        `INSERT INTO daily_logs (user_id, log_date) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, input.log_date],
      );

      const { rows } = await client.query<FoodLog>(
        `INSERT INTO food_logs
          (user_id, log_date, meal_type, food_name, quantity_g, calories, protein_g, carbs_g, fat_g)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId,
          input.log_date,
          input.meal_type,
          input.food_name,
          input.quantity_g,
          input.calories,
          input.protein_g,
          input.carbs_g,
          input.fat_g,
        ],
      );
      const created = rows[0];
      await recomputeIntake(userId, input.log_date, client);
      return created;
    });
  },

  async update(id: number, input: UpdateFoodLogInput): Promise<FoodLog> {
    const current = await this.getById(id);

    return transaction(async (client) => {
      const { rows } = await client.query<FoodLog>(
        `UPDATE food_logs SET
          meal_type = COALESCE($1, meal_type),
          food_name = COALESCE($2, food_name),
          quantity_g = COALESCE($3, quantity_g),
          calories = COALESCE($4, calories),
          protein_g = COALESCE($5, protein_g),
          carbs_g = COALESCE($6, carbs_g),
          fat_g = COALESCE($7, fat_g),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *`,
        [
          input.meal_type ?? null,
          input.food_name ?? null,
          input.quantity_g ?? null,
          input.calories ?? null,
          input.protein_g ?? null,
          input.carbs_g ?? null,
          input.fat_g ?? null,
          id,
        ],
      );
      const updated = rows[0];
      await recomputeIntake(current.user_id, current.log_date, client);
      return updated;
    });
  },

  async remove(id: number): Promise<void> {
    const current = await this.getById(id);
    await transaction(async (client) => {
      await client.query('DELETE FROM food_logs WHERE id = $1', [id]);
      await recomputeIntake(current.user_id, current.log_date, client);
    });
  },
};
