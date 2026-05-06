# NetPath Backend + Auth + Postgres Spec

Date: 2026-05-05
Status: Implemented baseline

## 1. Summary

NetPath now uses a Fastify API with PostgreSQL persistence for authentication, progress, and user settings.
The previous browser-only auth model has been replaced.

## 2. Implemented Stack

- Backend: Fastify + TypeScript
- Database: PostgreSQL (Docker Compose)
- Validation: zod
- Password hashing: bcryptjs
- Token auth: JWT access token (Bearer)
- Google login: ID token verification via `google-auth-library`
- Frontend: Vite + React + TypeScript (`apps/web`)
- Repo layout: npm workspaces (`apps/api`, `apps/web`)

## 3. Data Model (Implemented)

Created and managed at runtime by `initDatabase` in `apps/api/src/db.ts`.

- `users`
  - `id` UUID PK
  - `name`, `email`, `password_hash`
  - `auth_provider` (`password`, `google`, `hybrid`)
  - `google_sub` (unique when present)
  - `avatar_url`, `bio`
  - `created_at`, `updated_at`, `last_login_at`
- `user_progress`
  - `user_id` PK/FK
  - `current_stage_index`, `completed_stage_ids`, `updated_at`
- `user_settings`
  - `user_id` PK/FK
  - `ai_hints_enabled`, `email_notifications`, `preferred_difficulty`, `updated_at`

## 4. Auth + Session Behavior

- Password registration/login persists users in Postgres.
- Passwords are stored as bcrypt hashes only.
- `GET /api/v1/me` validates stored access token session.
- Frontend stores:
  - access token in localStorage
  - current user session object in localStorage
- Legacy local plaintext user key is actively removed by frontend code.

Note:
- Refresh token rotation/cookie session flow is not implemented yet.

## 5. Google Login Behavior

- Frontend uses Google Identity Services button.
- Backend endpoint `POST /api/v1/auth/google` verifies Google ID token audience.
- On first Google login, user is created with `auth_provider='google'`.
- On existing user login, account is reused and can become `hybrid` when linked by email.
- Custom avatar URLs from settings are preserved and not overwritten on subsequent Google sign-ins.

## 6. Profile + Settings Behavior

- Settings endpoints:
  - `GET /api/v1/settings`
  - `PUT /api/v1/settings`
- Saved fields:
  - `name`, `avatarUrl`, `bio`
  - `aiHintsEnabled`, `emailNotifications`, `preferredDifficulty`
- UI behavior:
  - top-right identity updates immediately after save
  - save navigates back to previous page context

## 7. Guest Mode

- Login is optional for core learning routes.
- Guests can access learn/sandbox/progress.
- Guest progress is in-memory for the session and is not persisted to backend.
- Settings route remains user-auth protected.

## 8. Username Validation Rules

Applied in backend and frontend:

- Length: 3-24
- Allowed characters: letters, numbers, `.`, `_`, `-`
- Disallowed: spaces, `@`, and other symbols

## 9. Environment Variables

Primary reference file: `.env.example`

- Database
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `POSTGRES_PORT`
  - `DATABASE_URL`
- API/Web config
  - `VITE_API_URL`
- Google
  - `GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_CLIENT_ID`
- AI placeholder
  - `OPENAI_API_KEY`

Notes:
- Web app reads env from monorepo root (`apps/web/vite.config.ts` sets `envDir: '../..'`).
- Placeholder values beginning with `replace_` are treated as not configured for Google login.

## 10. Known Gaps / Next Steps

- Add refresh tokens and rotation.
- Add auth endpoint rate limiting.
- Add integration tests for auth/settings/progress flows.
- Add AI hint endpoint when feature work begins.
