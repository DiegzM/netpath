# API Request Examples (Current Backend)

Base URL:

- `http://localhost:4000/api/v1`

## Health

```bash
curl http://localhost:4000/health
```

## Register (password)

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'
```

Expected response (shape):

```json
{
  "user": {
    "id": "uuid",
    "name": "Test User",
    "email": "test@example.com",
    "createdAt": "2026-05-05T00:00:00.000Z"
  },
  "accessToken": "jwt"
}
```

## Login (password)

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'
```

## Me (Bearer token example)

```bash
curl http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer <accessToken>"
```

## Get Progress

```bash
curl http://localhost:4000/api/v1/progress \
  -H "Authorization: Bearer <accessToken>"
```

## Update Progress

```bash
curl -X PUT http://localhost:4000/api/v1/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "currentStageIndex": 2,
    "completedStageIds": [1, 2]
  }'
```

## Get Settings

```bash
curl http://localhost:4000/api/v1/settings \
  -H "Authorization: Bearer <accessToken>"
```

## Update Settings

```bash
curl -X PUT http://localhost:4000/api/v1/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "packet_explorer",
    "bio": "I like network labs.",
    "avatarUrl": "https://example.com/avatar.png",
    "aiHintsEnabled": true,
    "emailNotifications": false,
    "preferredDifficulty": "normal"
  }'
```

## Login With Google

```bash
curl -X POST http://localhost:4000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "<google_id_token_credential>"
  }'
```

## Logout

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```
