# Troubleshooting Local Postgres

## 1. Docker Daemon Not Running

Symptom:
- `Cannot connect to the Docker daemon ... Is the docker daemon running?`

Fix:
1. Open Docker Desktop.
2. Wait until it shows running status.
3. Re-run:

```bash
npm run db:up
```

## 2. Port 5432 Already In Use

Symptom:
- Docker compose fails because port 5432 is occupied.

Fix option A:
1. Change `POSTGRES_PORT` in `.env` to another value (for example 5433).
2. Restart:

```bash
npm run db:down
npm run db:up
```

Fix option B:
- Stop conflicting local Postgres process.

## 3. Container Starts But App Cannot Connect

Checks:
1. Verify container logs:

```bash
npm run db:logs
```

2. Confirm `DATABASE_URL` matches `.env` credentials and port.
3. Confirm DB name exists (`POSTGRES_DB`).

## 4. Need a Clean Database

Reset and delete DB volume:

```bash
npm run db:reset
```

This removes all local Postgres data for this project.

## 5. Container Name Conflict

Symptom:
- Existing container with same name prevents startup.

Fix:

```bash
docker rm -f netpath-postgres
npm run db:up
```

## 6. Sanity Check Command

After startup, verify readiness:

```bash
docker ps --filter "name=netpath-postgres"
```

The container should be running and healthy.
