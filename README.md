# NetPath

NetPath is a networking-learning web app built with Vite + React + TypeScript.

## Local Development

### 1. Install dependencies

Run from the project root:

```bash
npm install
```

### 2. Configure environment values

Use `.env.example` as reference.

Required values for auth + Google + API integration:

- `DATABASE_URL`
- `VITE_API_URL`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`

### 3. Start local Postgres server

This project includes Docker Compose configuration for a local PostgreSQL instance.

```bash
npm run db:up
```

Useful commands:

```bash
npm run db:logs
npm run db:down
npm run db:reset
```

Default local connection:

- Host: `localhost`
- Port: `5432` (or `POSTGRES_PORT` from `.env`)
- Database/User/Password: from `.env`

### 4. Start API server

In one terminal:

```bash
npm run dev:api
```

### 5. Start frontend dev server

In a second terminal:

```bash
npm run dev:web
```

## Security Notes

- Do not commit real credentials or API keys.
- Keep `.env` local only.
- OpenAI keys must be used from backend server code only, never directly in frontend client code.

## Current Branch Goal

The `backend` branch is intended to migrate auth/progress persistence from browser local storage to a secure backend with PostgreSQL.

## Documentation Map

Primary specs and execution docs live in `specs/`:

- `specs/README.md` (index)
- `specs/local-dev-runbook.md` (complete DB/API/Web startup guide)
- `specs/backend-auth-postgres-spec.md` (architecture and security requirements)
- `specs/backend-implementation-plan.md` (build phases and done criteria)
- `specs/api-request-examples.md` (curl examples)
- `specs/troubleshooting-local-postgres.md` (local DB troubleshooting)
- `specs/product-levels-ai-spec.md` (levels + AI roadmap)
