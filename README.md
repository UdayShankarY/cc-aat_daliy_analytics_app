# Pulse Daily Analytics

This repo is intentionally split into **two separate folders** so deployment is easy:

- `frontend/` — Vite + React + TypeScript UI
- `backend/server/` — Node.js + Express API + **MongoDB (NoSQL)** + JWT auth

## What you need to provide

- **MongoDB URL**: `MONGODB_URI`
- **JWT secret**: `JWT_SECRET`
- **Frontend API URL**: `VITE_API_URL`

## Run locally

### Backend

```bash
cd backend/server
npm install
copy .env.example .env
npm run dev
```

Edit `backend/server/.env` and set at least:
- `MONGODB_URI=...`
- `JWT_SECRET=...`

Backend health: `http://localhost:8787/health`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Edit `frontend/.env`:
- `VITE_API_URL=http://localhost:8787` (or your deployed backend URL)

Frontend: `http://localhost:8080`
