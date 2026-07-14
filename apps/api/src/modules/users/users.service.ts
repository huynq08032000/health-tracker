import { query, getOne, run } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  calcTdee,
  CreateUserInput,
  UpdateUserInput,
  User,
} from '@health-tracker/shared';

export const userService = {
  async list(): Promise<User[]> {
    const { rows } = await query<User>('SELECT * FROM users ORDER BY id DESC');
    return rows;
  },

  async getById(id: number): Promise<User> {
    const user = await getOne<User>('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) throw new HttpError(404, 'User not found');
    return user;
  },

  async getByUsername(username: string): Promise<User> {
    const user = await getOne<User>('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) throw new HttpError(404, 'User not found');
    return user;
  },

  async create(input: CreateUserInput): Promise<User> {
    const existing = await getOne<{ id: number }>('SELECT id FROM users WHERE username = $1', [input.username]);
    if (existing) throw new HttpError(409, 'Username already exists');

    const daily_calorie_goal =
      input.daily_calorie_goal ??
      calcTdee({
        gender: input.gender,
        birth_date: input.birth_date,
        height_cm: input.height_cm,
        weight_kg: input.weight_kg,
        activity_level: input.activity_level,
        goal: input.goal,
      });

    const { rows } = await query<User>(
      `INSERT INTO users
        (username, display_name, gender, birth_date, height_cm, weight_kg, activity_level, goal, daily_calorie_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.username,
        input.display_name,
        input.gender,
        input.birth_date,
        input.height_cm,
        input.weight_kg,
        input.activity_level,
        input.goal,
        daily_calorie_goal,
      ],
    );
    return rows[0];
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const current = await this.getById(id);

    const needsRecompute =
      input.height_cm !== undefined ||
      input.weight_kg !== undefined ||
      input.gender !== undefined ||
      input.birth_date !== undefined ||
      input.activity_level !== undefined ||
      input.goal !== undefined;

    const daily_calorie_goal =
      input.daily_calorie_goal ??
      (needsRecompute
        ? calcTdee({
            gender: input.gender ?? current.gender,
            birth_date: input.birth_date ?? current.birth_date,
            height_cm: input.height_cm ?? current.height_cm,
            weight_kg: input.weight_kg ?? current.weight_kg,
            activity_level: input.activity_level ?? current.activity_level,
            goal: input.goal ?? current.goal,
          })
        : current.daily_calorie_goal);

    const { rows } = await query<User>(
      `UPDATE users SET
        username = COALESCE($1, username),
        display_name = COALESCE($2, display_name),
        gender = COALESCE($3, gender),
        birth_date = COALESCE($4, birth_date),
        height_cm = COALESCE($5, height_cm),
        weight_kg = COALESCE($6, weight_kg),
        activity_level = COALESCE($7, activity_level),
        goal = COALESCE($8, goal),
        daily_calorie_goal = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        input.username ?? null,
        input.display_name ?? null,
        input.gender ?? null,
        input.birth_date ?? null,
        input.height_cm ?? null,
        input.weight_kg ?? null,
        input.activity_level ?? null,
        input.goal ?? null,
        daily_calorie_goal,
        id,
      ],
    );
    return rows[0];
  },

  async remove(id: number): Promise<void> {
    await this.getById(id);
    await run('DELETE FROM users WHERE id = $1', [id]);
  },
};
