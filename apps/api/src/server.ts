import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { getPool, initDatabase } from './db';
import { requireAuth, signAccessToken } from './auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');
const envExamplePath = resolve(__dirname, '../../../.env.example');

// Load local secrets first when present, then use .env.example as fallback defaults.
dotenv.config({ path: envPath });
dotenv.config({ path: envExamplePath });

const app = Fastify({ logger: true });

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const pool = getPool();
const rawGoogleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_ID = rawGoogleClientId.startsWith('replace_') ? '' : rawGoogleClientId;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,24}$/;

function normalizeUsername(candidate: string) {
  const cleaned = candidate
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, '')
    .replace(/[._-]{2,}/g, '_')
    .slice(0, 24);

  if (cleaned.length >= 3) return cleaned;
  return 'user';
}

const usernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_REGEX, 'Username must be 3-24 chars and use only letters, numbers, ., _, or -.');

const registerSchema = z.object({
  name: usernameSchema,
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const progressSchema = z.object({
  currentStageIndex: z.number().int().min(0),
  completedStageIds: z.array(z.number().int().min(1)),
});

const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

const settingsSchema = z.object({
  name: usernameSchema,
  bio: z.string().max(240),
  avatarUrl: z.string().url().or(z.literal('')),
  aiHintsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  preferredDifficulty: z.enum(['easy', 'normal', 'hard']),
});

app.register(cors, {
  origin: CORS_ORIGIN,
});

app.get('/health', async () => ({ status: 'ok' }));

app.post('/api/v1/auth/register', async (request, reply) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      message: 'Invalid request payload. Username must be 3-24 chars and only use letters, numbers, ., _, or -.',
    });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
  if (existing.rowCount) {
    return reply.status(409).send({ message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at, avatar_url, bio, auth_provider
    `,
    [name.trim(), normalizedEmail, passwordHash],
  );

  const user = result.rows[0];
  await pool.query(`INSERT INTO user_progress (user_id, current_stage_index, completed_stage_ids) VALUES ($1, 0, '{}') ON CONFLICT (user_id) DO NOTHING`, [user.id]);
  await pool.query(`INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return reply.send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      authProvider: user.auth_provider,
    },
    accessToken,
  });
});

app.post('/api/v1/auth/login', async (request, reply) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: 'Invalid request payload.' });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const result = await pool.query(
    `SELECT id, name, email, created_at, password_hash, avatar_url, bio, auth_provider FROM users WHERE email = $1 LIMIT 1`,
    [normalizedEmail],
  );

  if (!result.rowCount) {
    return reply.status(401).send({ message: 'Email or password is incorrect.' });
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    return reply.status(401).send({ message: 'Use Google sign-in for this account.' });
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return reply.status(401).send({ message: 'Email or password is incorrect.' });
  }

  await pool.query(`UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`, [user.id]);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return reply.send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      authProvider: user.auth_provider,
    },
    accessToken,
  });
});

app.post('/api/v1/auth/google', async (request, reply) => {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    return reply.status(503).send({ message: 'Google login is not configured yet.' });
  }

  const parsed = googleAuthSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ message: 'Invalid request payload.' });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: parsed.data.credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    return reply.status(401).send({ message: 'Unable to verify Google account.' });
  }

  if (payload.email_verified === false) {
    return reply.status(401).send({ message: 'Google account email is not verified.' });
  }

  const email = payload.email.toLowerCase();
  const googleSub = payload.sub;
  const fallbackName = normalizeUsername(payload.name?.trim() || email.split('@')[0] || 'user');
  const avatarUrl = payload.picture || null;

  const existing = await pool.query(
    `SELECT id, name, email, created_at, avatar_url, bio, auth_provider, google_sub FROM users WHERE google_sub = $1 OR email = $2 LIMIT 1`,
    [googleSub, email],
  );

  let user;
  if (!existing.rowCount) {
    const inserted = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, auth_provider, google_sub, avatar_url, bio, last_login_at, updated_at)
        VALUES ($1, $2, NULL, 'google', $3, $4, '', now(), now())
        RETURNING id, name, email, created_at, avatar_url, bio, auth_provider
      `,
      [fallbackName, email, googleSub, avatarUrl],
    );
    user = inserted.rows[0];
  } else {
    const existingUser = existing.rows[0];
    const nextProvider = existingUser.auth_provider === 'password' ? 'hybrid' : existingUser.auth_provider;
    const updated = await pool.query(
      `
        UPDATE users
        SET google_sub = COALESCE(google_sub, $1),
            auth_provider = $2,
            avatar_url = CASE
              WHEN avatar_url IS NULL OR avatar_url = '' THEN $3
              ELSE avatar_url
            END,
            last_login_at = now(),
            updated_at = now()
        WHERE id = $4
        RETURNING id, name, email, created_at, avatar_url, bio, auth_provider
      `,
      [googleSub, nextProvider, avatarUrl, existingUser.id],
    );
    user = updated.rows[0];
  }

  await pool.query(`INSERT INTO user_progress (user_id, current_stage_index, completed_stage_ids) VALUES ($1, 0, '{}') ON CONFLICT (user_id) DO NOTHING`, [user.id]);
  await pool.query(`INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return reply.send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      authProvider: user.auth_provider,
    },
    accessToken,
  });
});

app.get('/api/v1/me', { preHandler: requireAuth }, async (request) => {
  const auth = (request as typeof request & { auth: { sub: string } }).auth;
  const result = await pool.query(
    `SELECT id, name, email, created_at, avatar_url, bio, auth_provider FROM users WHERE id = $1 LIMIT 1`,
    [auth.sub],
  );

  if (!result.rowCount) {
    return { user: null };
  }

  const user = result.rows[0];
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      authProvider: user.auth_provider,
    },
  };
});

app.get('/api/v1/settings', { preHandler: requireAuth }, async (request) => {
  const auth = (request as typeof request & { auth: { sub: string } }).auth;

  const [userResult, settingsResult] = await Promise.all([
    pool.query(
      `SELECT name, email, avatar_url, bio, auth_provider FROM users WHERE id = $1 LIMIT 1`,
      [auth.sub],
    ),
    pool.query(
      `SELECT ai_hints_enabled, email_notifications, preferred_difficulty FROM user_settings WHERE user_id = $1 LIMIT 1`,
      [auth.sub],
    ),
  ]);

  if (!userResult.rowCount) {
    return {
      settings: null,
    };
  }

  const user = userResult.rows[0];
  const settings = settingsResult.rows[0] ?? {
    ai_hints_enabled: true,
    email_notifications: true,
    preferred_difficulty: 'normal',
  };

  return {
    settings: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url || '',
      bio: user.bio || '',
      authProvider: user.auth_provider,
      aiHintsEnabled: settings.ai_hints_enabled,
      emailNotifications: settings.email_notifications,
      preferredDifficulty: settings.preferred_difficulty,
    },
  };
});

app.put('/api/v1/settings', { preHandler: requireAuth }, async (request, reply) => {
  const auth = (request as typeof request & { auth: { sub: string } }).auth;
  const parsed = settingsSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      message: 'Invalid request payload. Username must be 3-24 chars and only use letters, numbers, ., _, or -.',
    });
  }

  const data = parsed.data;

  await Promise.all([
    pool.query(
      `
        UPDATE users
        SET name = $1,
            avatar_url = $2,
            bio = $3,
            updated_at = now()
        WHERE id = $4
      `,
      [data.name.trim(), data.avatarUrl || null, data.bio.trim(), auth.sub],
    ),
    pool.query(
      `
        INSERT INTO user_settings (user_id, ai_hints_enabled, email_notifications, preferred_difficulty)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET
          ai_hints_enabled = EXCLUDED.ai_hints_enabled,
          email_notifications = EXCLUDED.email_notifications,
          preferred_difficulty = EXCLUDED.preferred_difficulty,
          updated_at = now()
      `,
      [auth.sub, data.aiHintsEnabled, data.emailNotifications, data.preferredDifficulty],
    ),
  ]);

  return {
    settings: {
      ...data,
      bio: data.bio.trim(),
      name: data.name.trim(),
    },
  };
});

app.get('/api/v1/progress', { preHandler: requireAuth }, async (request) => {
  const auth = (request as typeof request & { auth: { sub: string } }).auth;
  const result = await pool.query(
    `SELECT current_stage_index, completed_stage_ids FROM user_progress WHERE user_id = $1 LIMIT 1`,
    [auth.sub],
  );

  if (!result.rowCount) {
    return {
      currentStageIndex: 0,
      completedStageIds: [],
    };
  }

  const row = result.rows[0];
  return {
    currentStageIndex: row.current_stage_index,
    completedStageIds: row.completed_stage_ids,
  };
});

app.put('/api/v1/progress', { preHandler: requireAuth }, async (request, reply) => {
  const auth = (request as typeof request & { auth: { sub: string } }).auth;
  const parsed = progressSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({ message: 'Invalid request payload.' });
  }

  const { currentStageIndex, completedStageIds } = parsed.data;

  await pool.query(
    `
      INSERT INTO user_progress (user_id, current_stage_index, completed_stage_ids)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        current_stage_index = EXCLUDED.current_stage_index,
        completed_stage_ids = EXCLUDED.completed_stage_ids,
        updated_at = now()
    `,
    [auth.sub, currentStageIndex, completedStageIds],
  );

  return {
    currentStageIndex,
    completedStageIds,
  };
});

app.post('/api/v1/auth/logout', async () => ({ success: true }));

const start = async () => {
  await initDatabase();
  await app.listen({ port: PORT, host: '0.0.0.0' });
};

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
