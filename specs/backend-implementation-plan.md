# Backend Implementation Status

Date: 2026-05-05
Status: Updated to current repository state

## Goal

Replace insecure browser-only auth/progress persistence with backend + PostgreSQL.

## Completed Work

1. Monorepo/workspaces setup
- Root npm workspaces with `apps/api` and `apps/web`.
- Scripts in root for dev/build and DB lifecycle.

2. API + DB baseline
- Fastify API running on port 4000.
- PostgreSQL in Docker Compose.
- Runtime schema initialization for users, progress, and settings tables.

3. Auth implementation
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- JWT access token signing/verification.
- Bcrypt password hashing.

4. User data + settings
- `GET /api/v1/settings`
- `PUT /api/v1/settings`
- Supports username, avatar URL, bio, and learning preferences.
- Header/session updates immediately after settings save.

5. Progress persistence
- `GET /api/v1/progress`
- `PUT /api/v1/progress`
- Signed-in users persist progress in DB.
- Guests can use app without persisted progress.

6. Google auth integration
- Frontend Google Identity Services button.
- Backend ID token verification with audience check.
- Preserves user-customized avatar on future Google sign-ins.

7. Security/data fixes
- Removed legacy plaintext localStorage user persistence.
- Username validation enforced frontend + backend:
	- `^[A-Za-z0-9._-]{3,24}$`

## Current Gaps

1. No refresh token rotation/cookie session model yet.
2. No request rate-limiting on auth endpoints yet.
3. No automated integration tests in repository yet.
4. AI hint endpoint is still planned, not implemented.

## High-Value Next Steps

1. Add auth endpoint rate limiting and lockout policy.
2. Add integration tests for auth/settings/progress flows.
3. Add refresh token flow for stronger session security.
4. Implement AI hint endpoint behind feature flag.
