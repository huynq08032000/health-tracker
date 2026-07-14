import { z } from 'zod';

export const Gender = z.enum(['male', 'female', 'other']);
export const ActivityLevel = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']);
export const Goal = z.enum(['lose', 'maintain', 'gain']);
export const MealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
export const ISODateTime = z.string().min(1);

export const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50),
  display_name: z.string().min(1).max(100),
  gender: Gender,
  birth_date: ISODate,
  height_cm: z.number().positive(),
  weight_kg: z.number().positive(),
  activity_level: ActivityLevel,
  goal: Goal,
  daily_calorie_goal: z.number().int().positive(),
  password_hash: z.string().default(''),
  created_at: ISODateTime,
  updated_at: ISODateTime,
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  daily_calorie_goal: true,
  password_hash: true,
}).extend({
  password: z.string().min(6).max(100),
  daily_calorie_goal: z.number().int().positive().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const RegisterSchema = CreateUserSchema.partial().extend({
  username: z.string().min(3).max(50),
  display_name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema.omit({ password_hash: true }),
  token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const DailyLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  log_date: ISODate,
  weight_kg: z.number().positive().nullable(),
  water_ml: z.number().int().nonnegative().default(0),
  recommended_water_ml: z.number().int().nonnegative().default(0),
  water_reminder_interval_minutes: z.number().int().positive().default(20),
  steps: z.number().int().nonnegative().default(0),
  exercise_min: z.number().int().nonnegative().default(0),
  calories_burned: z.number().int().nonnegative().default(0),
  sleep_hours: z.number().nonnegative().default(0),
  calories_intake: z.number().int().nonnegative().default(0),
  note: z.string().nullable(),
  created_at: ISODateTime,
  updated_at: ISODateTime,
});
export type DailyLog = z.infer<typeof DailyLogSchema>;

export const UpsertDailyLogSchema = z.object({
  log_date: ISODate,
  weight_kg: z.number().positive().optional(),
  water_ml: z.number().int().nonnegative().optional(),
  recommended_water_ml: z.number().int().nonnegative().optional(),
  water_reminder_interval_minutes: z.number().int().positive().optional(),
  steps: z.number().int().nonnegative().optional(),
  exercise_min: z.number().int().nonnegative().optional(),
  calories_burned: z.number().int().nonnegative().optional(),
  sleep_hours: z.number().nonnegative().optional(),
  note: z.string().optional(),
});
export type UpsertDailyLogInput = z.infer<typeof UpsertDailyLogSchema>;

export const FoodLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  log_date: ISODate,
  meal_type: MealType,
  food_name: z.string().min(1).max(150),
  quantity_g: z.number().positive(),
  calories: z.number().nonnegative(),
  protein_g: z.number().nonnegative().default(0),
  carbs_g: z.number().nonnegative().default(0),
  fat_g: z.number().nonnegative().default(0),
  created_at: ISODateTime,
  updated_at: ISODateTime,
});
export type FoodLog = z.infer<typeof FoodLogSchema>;

export const CreateFoodLogSchema = FoodLogSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
}).extend({
  calories: z.number().nonnegative(),
});
export type CreateFoodLogInput = z.infer<typeof CreateFoodLogSchema>;

export const UpdateFoodLogSchema = CreateFoodLogSchema.partial();
export type UpdateFoodLogInput = z.infer<typeof UpdateFoodLogSchema>;

export const FoodSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(150),
  kcal_per_100g: z.number().nonnegative(),
  protein_per_100g: z.number().nonnegative(),
  carbs_per_100g: z.number().nonnegative(),
  fat_per_100g: z.number().nonnegative(),
});
export type Food = z.infer<typeof FoodSchema>;

export const CreateFoodSchema = z.object({
  name: z.string().min(1).max(150),
  kcal_per_100g: z.number().nonnegative(),
  protein_per_100g: z.number().nonnegative(),
  carbs_per_100g: z.number().nonnegative(),
  fat_per_100g: z.number().nonnegative(),
});
export type CreateFoodInput = z.infer<typeof CreateFoodSchema>;

export const ActivityFactor: Record<z.infer<typeof ActivityLevel>, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface TdeeInput {
  gender: z.infer<typeof Gender>;
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  activity_level: z.infer<typeof ActivityLevel>;
  goal: z.infer<typeof Goal>;
}

function ageFromBirthDate(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return Math.max(age, 0);
}

export function calcTdee(input: TdeeInput): number {
  const { gender, birth_date, height_cm, weight_kg, activity_level, goal } = input;
  const age = ageFromBirthDate(birth_date);
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * ActivityFactor[activity_level];
  const goalDelta = goal === 'lose' ? -500 : goal === 'gain' ? 300 : 0;
  return Math.round(tdee + goalDelta);
}

export const StravaConnectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  strava_athlete_id: z.number(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.string(),
  scope: z.string().nullable(),
  created_at: ISODateTime,
  updated_at: ISODateTime,
});
export type StravaConnection = z.infer<typeof StravaConnectionSchema>;

export const StravaSyncResultSchema = z.object({
  activitiesSynced: z.number(),
  stepsAdded: z.number(),
  caloriesBurnedAdded: z.number(),
  exerciseMinAdded: z.number(),
});
export type StravaSyncResult = z.infer<typeof StravaSyncResultSchema>;
