CREATE TABLE IF NOT EXISTS users (
  id               BIGSERIAL PRIMARY KEY,
  username         TEXT NOT NULL UNIQUE,
  display_name     TEXT NOT NULL,
  gender           TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  birth_date       TEXT NOT NULL,
  height_cm        REAL NOT NULL,
  weight_kg        REAL NOT NULL,
  activity_level   TEXT NOT NULL DEFAULT 'sedentary'
                   CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  goal             TEXT NOT NULL DEFAULT 'maintain'
                   CHECK (goal IN ('lose','maintain','gain')),
  daily_calorie_goal INTEGER NOT NULL,
  password_hash    TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL DEFAULT NOW(),
  updated_at       TEXT NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date         TEXT NOT NULL,
  weight_kg        REAL,
  water_ml         INTEGER DEFAULT 0,
  recommended_water_ml INTEGER DEFAULT 0,
  water_reminder_interval_minutes INTEGER DEFAULT 20,
  steps            INTEGER DEFAULT 0,
  exercise_min     INTEGER DEFAULT 0,
  calories_burned  INTEGER DEFAULT 0,
  calories_intake  INTEGER DEFAULT 0,
  note             TEXT,
  created_at       TEXT NOT NULL DEFAULT NOW(),
  updated_at       TEXT NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS foods (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL UNIQUE,
  kcal_per_100g    REAL NOT NULL DEFAULT 0,
  protein_per_100g REAL NOT NULL DEFAULT 0,
  carbs_per_100g   REAL NOT NULL DEFAULT 0,
  fat_per_100g     REAL NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT NOW(),
  updated_at       TEXT NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_logs (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date         TEXT NOT NULL,
  meal_type        TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name        TEXT NOT NULL,
  quantity_g       REAL NOT NULL,
  calories         REAL NOT NULL,
  protein_g        REAL DEFAULT 0,
  carbs_g          REAL DEFAULT 0,
  fat_g            REAL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT NOW(),
  updated_at       TEXT NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id, log_date) REFERENCES daily_logs(user_id, log_date) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date  ON food_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
