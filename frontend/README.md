# Pulse Daily Analytics

This repo contains **two separate deployable apps**:

- `./frontend/` **Frontend**: Vite + React + TypeScript (Tailwind + shadcn/ui)
- `./backend/server/` **Backend**: Node.js + Express + **MongoDB (NoSQL)** + JWT auth

## Prereqs

- Node.js 18+ (or 20+ recommended)
- MongoDB (local or Atlas)

## Frontend setup (`frontend/`)

Install dependencies:

```bash
npm install
```

Create your env file (frontend):

```bash
copy .env.example .env
```

Set:

- `VITE_API_URL` (example: `http://localhost:8787`)

## Backend setup (`backend/server/`)

```bash
cd backend/server
npm install
copy .env.example .env
```

Set `MONGODB_URI` and `JWT_SECRET`.

## Run locally (two terminals)

Backend:

```bash
cd backend/server
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:8080`.

## Quality checks

```bash
cd frontend
npm run lint
npm test
npm run build
```
