# Travel Together Workspace

This workspace is organized into separated project folders:

- `backend/` -> Node.js API server, database models, routes, scripts
- `frontend/` -> React client app and deployment config

## Folder Rules

- Do backend work only inside `backend/`
- Do frontend work only inside `frontend/`
- Run backend commands from `backend/`
- Run frontend commands from `frontend/client/`
- Keep dependencies installed in each project folder, not at workspace root

## Docker

The repository now includes a local Docker stack for MongoDB, the API, and the React app.

From the workspace root:

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/api/health

## Common Commands

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend/client
npm start
```
