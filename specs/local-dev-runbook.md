# NetPath Local Dev Runbook

This runbook explains exactly what is required to run NetPath locally with Postgres, API, and frontend.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (or Docker Engine + Compose)

## 2. Install Dependencies

From repository root:

```bash
npm install
```

## 3. Environment Variables

Primary reference file: `.env.example`

Required for local auth + Google setup:

- `DATABASE_URL`
- `VITE_API_URL`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`

Typical local values:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/netpath
VITE_API_URL=http://localhost:4000/api/v1
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
```

Notes:

- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` should be the same web client ID.
- Google client secret is not used in current implementation.
- If Google vars are placeholders or missing, Google sign-in button will not initialize.

## 4. Start Database

```bash
npm run db:up
```

Optional checks:

```bash
npm run db:logs
docker ps --filter name=netpath-postgres
```

## 5. Start API

In terminal 1:

```bash
npm run dev:api
```

Expected:

- API binds to `http://127.0.0.1:4000`
- On startup, API initializes schema tables automatically

## 6. Start Frontend

In terminal 2:

```bash
npm run dev:web
```

Expected:

- Web app on `http://localhost:5173`

## 7. Quick Verification

- Open `http://localhost:5173/auth`
- Confirm:
  - password login/register works
  - Google button renders with valid Google client ID
  - guest mode works
- Save settings and confirm top-right profile updates immediately

## 8. Build Validation

```bash
npm run build:api
npm run build:web
```

## 9. Useful Maintenance Commands

```bash
npm run db:down
npm run db:reset
```

`db:reset` removes local DB volume and recreates Postgres.
