# Deployment (Vercel + Render)

This repo is a small monorepo:

- `trading-frontend/` (Next.js) → deploy on **Vercel**
- `backend/` (NestJS + Prisma + Postgres) → deploy on **Render**

## Vercel (frontend)

This repo includes `vercel.json` so Vercel can build the Next.js app from the repo root.

Set these **Environment Variables** in Vercel:

- `NEXT_PUBLIC_API_BASE_URL` = your Render backend URL (e.g. `https://trading-backend.onrender.com`)
- `NEXT_PUBLIC_MARKET_REFRESH_MS` = optional (default is `5000`)

## Render (backend)

This repo includes `render.yaml` (Render Blueprint) to deploy:

- a `trading-db` Postgres database
- a `trading-backend` Node web service from `backend/`

Set these **Environment Variables** in Render:

- `CORS_ORIGIN` = your Vercel URL(s)
  - single: `https://your-app.vercel.app`
  - multiple: `https://a.vercel.app,https://b.vercel.app`
  - if omitted in `production`, the backend will allow all origins (`*`)

Required (already handled by `render.yaml`):

- `DATABASE_URL` (from the Render database)
- `JWT_SECRET` (auto-generated)
