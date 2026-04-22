# API Smoke Checklist

Run this before production deploys to verify core backend availability and auth flow.

## Quick Run

From `backend`:

```bash
npm run smoke:api
```

Optional (if your server is not on auto-detected localhost port):

```bash
API_BASE_URL=http://localhost:5002 npm run smoke:api
```

PowerShell:

```powershell
$env:API_BASE_URL = "http://localhost:5002"
npm run smoke:api
```

## Automated Endpoint Matrix

These are checked by `npm run smoke:api`:

- `GET /api/health` -> expects `200`
- `GET /api/ready` -> expects `200` or `503`
- `GET /metrics` -> expects `200`
- `GET /api/feed` -> expects `200`
- `GET /api/stats` -> expects `200`
- `POST /api/auth/register` -> expects `201`
- `GET /api/auth/me` (Bearer token) -> expects `200`
- `GET /api/trips` (Bearer token) -> expects `200`
- `GET /api/users/profile` (Bearer token) -> expects `200`
- `GET /api/match/trips` (Bearer token) -> expects `200`
- `POST /api/ai/chat` (Bearer token) -> expects `200`, `400`, or `429`
- `GET /api/messages/:tripId` (Bearer token) -> expects `200` or `403` (or skipped if no trip exists)

## Manual Matrix (Route Coverage)

Use these as manual follow-ups (especially for write endpoints):

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

### Trips
- `POST /api/trips`
- `POST /api/trips/join/:id`
- `POST /api/trips/leave/:id`
- `GET /api/trips/:id`
- `GET /api/trips/:id/members`
- `PUT /api/trips/:id`
- `PUT /api/trips/:id/destination`
- `DELETE /api/trips/:id`
- `DELETE /api/trips/:id/members/:memberId`
- `GET /api/trips/search/nearby`

### Users
- `PUT /api/users/profile`
- `PUT /api/users/match-preferences`
- `POST /api/users/gps/update`
- `GET /api/users/gps/history`
- `GET /api/users/gps/nearby`

### Reviews
- `POST /api/reviews`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`
- `GET /api/reviews/:tripId`

### Feed
- `POST /api/feed`
- `DELETE /api/feed/:id`

### AI
- `POST /api/ai/trip-plan`
- `POST /api/ai/luggage`

### Messages
- `POST /api/messages`

### Match
- `GET /api/match/travelers`
- `GET /api/match/trips/:tripId/travelers`

### Internal
- `POST /internal/delete-default-user`
