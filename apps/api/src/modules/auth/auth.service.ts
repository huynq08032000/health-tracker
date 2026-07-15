import { getOne, transaction } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { hashPassword, verifyPassword } from '../../utils/crypto.js';
import { issueToken, revokeToken } from '../../middleware/auth.js';
import { RegisterInput, LoginInput, AuthResponse, User } from '@health-tracker/shared';

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await getOne<{ id: number }>('SELECT id FROM users WHERE username = $1', [input.username]);
    if (existing) throw new HttpError(409, 'Username already exists');

    const password_hash = hashPassword(input.password);
    const daily_calorie_goal = input.daily_calorie_goal ?? 2000;

    return transaction(async (client) => {
      const user = await getOne<User>(
        `INSERT INTO users (username, display_name, gender, birth_date, height_cm, weight_kg, activity_level, goal, daily_calorie_goal, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.username,
          input.display_name ?? '',
          input.gender ?? 'other',
          input.birth_date ?? '1990-01-01',
          input.height_cm ?? 170,
          input.weight_kg ?? 65,
          input.activity_level ?? 'sedentary',
          input.goal ?? 'maintain',
          daily_calorie_goal,
          password_hash,
        ],
      );

      if (!user) throw new HttpError(500, 'Failed to create user');
      const token = await issueToken(user.id, client);

      return { user: omitPassword(user), token };
    });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await getOne<User>('SELECT * FROM users WHERE username = $1', [input.username]);
    if (!user || !verifyPassword(input.password, user.password_hash)) {
      throw new HttpError(401, 'Invalid username or password');
    }
    const token = await issueToken(user.id);
    return { user: omitPassword(user), token };
  },

  async logout(token: string): Promise<void> {
    await revokeToken(token);
  },
};

function omitPassword(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...rest } = user as any;
  void password_hash;
  return rest;
}
