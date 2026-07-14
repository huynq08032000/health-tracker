import { query, getOne } from '../../db/pg.js';
import { Food, CreateFoodInput } from '@health-tracker/shared';

export const foodRepository = {
  async listByName(queryStr: string): Promise<Food[]> {
    const { rows } = await query<Food>(
      `SELECT id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
       FROM foods
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 20`,
      [`%${queryStr}%`],
    );
    return rows;
  },

  async byId(id: number): Promise<Food | null> {
    return getOne<Food>(
      `SELECT id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM foods WHERE id = $1`,
      [id],
    );
  },

  async create(input: CreateFoodInput): Promise<Food> {
    const { rows } = await query<Food>(
      `INSERT INTO foods (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.kcal_per_100g, input.protein_per_100g, input.carbs_per_100g, input.fat_per_100g],
    );
    return rows[0];
  },
};
