import { Pool } from 'pg';

let cachedPool: Pool | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for API startup.');
  }
  return databaseUrl;
}

export function getPool() {
  if (cachedPool) return cachedPool;
  cachedPool = new Pool({ connectionString: getDatabaseUrl() });
  return cachedPool;
}

export async function initDatabase() {
  const pool = getPool();
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password',
      ADD COLUMN IF NOT EXISTS google_sub TEXT,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique
    ON users (google_sub)
    WHERE google_sub IS NOT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      current_stage_index INTEGER NOT NULL DEFAULT 0,
      completed_stage_ids INTEGER[] NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      ai_hints_enabled BOOLEAN NOT NULL DEFAULT true,
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      preferred_difficulty TEXT NOT NULL DEFAULT 'normal',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
