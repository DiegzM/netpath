import { Pool } from 'pg';

let cachedPool: Pool | null = null;
let readinessCheckPromise: Promise<void> | null = null;
let lastSchemaCheckAt = 0;

const SCHEMA_CHECK_INTERVAL_MS = 5000;
const REQUIRED_TABLES = ['users', 'user_progress', 'user_settings', 'sandbox_worlds'] as const;

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sandbox_worlds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Untitled World',
      description TEXT NOT NULL DEFAULT '',
      thumbnail_data TEXT,
      canvas_data JSONB NOT NULL DEFAULT '{"devices":[],"connections":[],"simulationSettings":{}}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE sandbox_worlds
    ALTER COLUMN canvas_data SET DEFAULT '{"devices":[],"connections":[],"simulationSettings":{}}'::jsonb;
  `);

  lastSchemaCheckAt = Date.now();
}

export async function ensureDatabaseReady(force = false) {
  const now = Date.now();
  if (!force && now - lastSchemaCheckAt < SCHEMA_CHECK_INTERVAL_MS) {
    return;
  }

  if (readinessCheckPromise) {
    return readinessCheckPromise;
  }

  readinessCheckPromise = (async () => {
    const pool = getPool();
    const result = await pool.query<{ tablename: string }>(
      `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
      `,
      [REQUIRED_TABLES],
    );

    const existing = new Set(result.rows.map((row) => row.tablename));
    const hasAllRequired = REQUIRED_TABLES.every((tableName) => existing.has(tableName));

    if (!hasAllRequired) {
      await initDatabase();
      return;
    }

    lastSchemaCheckAt = Date.now();
  })().finally(() => {
    readinessCheckPromise = null;
  });

  return readinessCheckPromise;
}
