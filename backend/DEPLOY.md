# Deploying the backend (Vercel)

The backend deploys as a Vercel serverless function. `api/index.py` is the
entrypoint; `vercel.json` rewrites every path to it.

## One-time setup

1. **New Vercel project** (separate from the frontend project), with
   **Root Directory = `backend`**.
2. **Python version**: set in Project Settings → Python Version (pick **3.12**;
   3.14 does not exist on Vercel yet). Note: `runtime.txt` is a Render/Heroku
   convention — Vercel ignores it, which is why this repo doesn't have one.
3. **Environment variables** (Project Settings → Environment Variables), same
   values as your local `backend/.env`:
   - `SUPABASE_URL`
   - `PUBLISHABLE_KEY`
   - `DIRECT_CONNECTION_STRING`
   - `ALLOWED_ORIGINS` = `http://localhost:5173,https://ade-footwear-v2n7.vercel.app`
4. Deploy. Vercel installs `requirements.txt` automatically.

## After it's live

1. Check `https://<your-backend-domain>/health` → `{"status":"ok"}`.
2. In the **frontend** Vercel project, set `VITE_API_URL` =
   `https://<your-backend-domain>` and redeploy the frontend. Until then the
   live site keeps calling `localhost:8000` and the shop appears empty.

## Notes

- **Cold starts**: serverless instances run `create_all` at import (it is a
  no-op once tables exist). The Supabase pooler connection string we use is
  built for exactly this many-short-connections pattern.
- **Local dev is unchanged**: `uvicorn app.main:app --reload` from `backend/`.
- The database is the same Supabase project for local and deployed backends,
  so seeded products/orders are shared between them.
