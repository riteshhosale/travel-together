# Travel Together Frontend

Frontend application for the Travel Together platform.

## Overview

This app provides:

- Authentication flows (register/login/logout)
- Trip discovery, creation, and joining
- Real-time trip chat UI
- Reviews and community feed
- AI tools for planning and luggage guidance
- Responsive product-style interface

## Tech Stack

- React 18
- React Router
- Socket.IO client
- Tailwind CSS utilities + custom style tokens
- Fetch-based API client

## Performance Highlights

- Route-level lazy loading (code splitting)
- Async page fallback during chunk loading
- Optimized production build with hashed assets

## Folder Structure

```text
frontend/
  README.md
  vercel.json
  client/
    package.json
    public/
    src/
```

## Prerequisites

- Node.js 22.x
- Running backend API (default: http://localhost:5000)

## Docker

The frontend is included in the workspace Docker stack. Start everything from the repository root with:

```bash
docker compose up --build
```

That serves the app on `http://localhost:3000` and points it at the backend on `http://localhost:5000`.

## Installation

```bash
cd client
npm install
```

## Environment Variables (optional)

Create frontend/client/.env if needed:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

If these are not set:

- Development uses http://localhost:5000
- Production falls back to hosted backend URL coded in the app

## Run

Development:

```bash
cd client
npm start
```

Production build:

```bash
cd client
npm run build
```

## Scripts

Inside frontend/client:

- npm start
- npm run build
- npm test

## Core Flows

- Register and login
- Create and join trips
- Real-time chat in joined trip rooms
- Post feed updates and reviews
- Use AI tools with backend fallback-safe responses
- Match with trips and travelers using saved preferences
- Reset password via email link (SMTP on backend, or dev console link)

## Deployment

- Frontend can be deployed to Vercel.
- Ensure backend CORS includes deployed frontend domain.
- Set REACT_APP_API_URL and REACT_APP_SOCKET_URL to deployed backend URL.

## Troubleshooting

- 401 errors: check token and login state.
- Chat not connecting: verify REACT_APP_SOCKET_URL and backend CORS.
- API failures in dev: ensure backend is running on configured PORT.
