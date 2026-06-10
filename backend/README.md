# Travel Together Backend

Production-focused backend API for the Travel Together platform.

## Overview

This backend provides:

- JWT-based authentication and profile management
- Trip creation, joining, and member tracking
- Reviews and social feed
- Image uploads (Cloudinary or local fallback)
- REST + Socket.IO chat for real-time trip conversation
- AI endpoints for trip assistance with safe fallback behavior

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT + bcryptjs
- Multer + Cloudinary (optional)

## Security Implemented

- Helmet security headers
- Auth and AI route rate limiting
- Request payload validation with Zod
- Account lockout after repeated failed login attempts
- Protected routes with JWT middleware
- Upload MIME/type + size restrictions

## Folder Structure

```text
backend/
  package.json
  server/
    app.js
    config/
    controllers/
    middleware/
    models/
    routes/
    scripts/
    uploads/
    utils/
    validators/
```

## Prerequisites

- Node.js 22.x
- MongoDB Atlas or local MongoDB

## Docker

You can run the backend with the workspace Docker stack from the repository root:

```bash
docker compose up --build
```

The backend listens on `http://localhost:5000` and the health check is available at `http://localhost:5000/api/health`.

If you run the backend outside Docker, keep `PORT` aligned with the frontend and make sure `MONGO_URI` points to a reachable MongoDB instance.

## Installation

```bash
npm install
```

## Environment Variables

Create backend/.env with:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
MONGO_URI_FALLBACK=
MONGO_MAX_POOL_SIZE=10
MONGO_MIN_POOL_SIZE=0
MONGO_CONNECT_TIMEOUT_MS=10000
MONGO_SERVER_SELECTION_TIMEOUT_MS=10000
MONGO_SOCKET_TIMEOUT_MS=45000
MONGO_RETRY_WRITES=true
JWT_SECRET=replace_with_long_random_secret

# CORS origins
CLIENT_URL=http://localhost:3000
CLIENT_URLS=

# Optional lockout tuning
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15

# Optional AI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

# Optional image hosting (if omitted, local uploads are used)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=travel-together

# Optional when generating absolute upload URLs in local mode
BACKEND_BASE_URL=http://localhost:5000

# Email (password reset). If omitted, reset links are logged to the server console.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=TravelTogether <noreply@example.com>
```

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Tests:

```bash
npm test
```

Health check:

- GET /api/health

## Main API Groups

- /api/auth
- /api/users
- /api/trips
- /api/reviews
- /api/feed
- /api/ai
- /api/messages
- /api/match
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## Real-Time Chat (Socket.IO)

Socket server runs on the same host and port as API.

Client connection example:

```js
const socket = io('http://localhost:5000', {
  auth: { token: '<jwt_token>' },
});
```

Supported events:

- joinTrip
- sendMessage
- receiveMessage
- chatError

## Notes

- Keep frontend API base and backend PORT aligned.
- MongoDB connection setup prefers the primary URI, falls back to `MONGO_URI_FALLBACK` for local SRV/DNS issues, and shuts down cleanly on `SIGINT`/`SIGTERM`.
- If OpenAI quota/rate limits are hit, AI chat returns graceful fallback text.
- If Cloudinary config is missing, uploads are stored in server/uploads.
