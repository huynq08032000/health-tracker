import { query, getOne, run } from '../../db/pg';
import { HttpError } from '../../middleware/errorHandler';
import { CreateFoodInput, Food } from '@health-tracker/shared';

export const foodService = {
  async search(q?: string): Promise<Food[]> {
    const pattern = q && q.trim() ? `%${q.trim()}%` : '%';
    const { rows } = await query<Food>(
      `SELECT id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
       FROM foods
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 50`,
      [pattern],
    );
    return rows;
  },

  async getById(id: number): Promise<Food> {
    const row = await getOne<Food>(
      `SELECT id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM foods WHERE id = $1`,
      [id],
    );
    if (!row) throw new HttpError(404, 'Food not found');
    return row;
  },

  async create(input: CreateFoodInput): Promise<Food> {
    const existing = await getOne<{ id: number }>('SELECT 1 FROM foods WHERE name = $1', [input.name]);
    if (existing) throw new HttpError(409, 'Món ăn đã tồn tại trong danh sách');

    const { rows } = await query<Food>(
      `INSERT INTO foods (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.kcal_per_100g, input.protein_per_100g, input.carbs_per_100g, input.fat_per_100g],
    );
    return rows[0];
  },
};
