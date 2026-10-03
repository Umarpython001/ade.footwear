# Deployment Instructions — ADE Foot Wear

Two Vercel projects: the **backend** (FastAPI, serverless) and the **frontend**
(React, static). Both deploy from this repo. Follow the parts in order; each
ends with a check so you know it worked before moving on.

> **One database:** local and deployed backends share the same Supabase
> project, so products and orders are the same everywhere.

---

## Part 0 — Before you start (once)

- [ ] Everything is committed and pushed: `git status` shows nothing
      uncommitted that matters, then `git push`. **Vercel can only build what
      is on GitHub.**
- [ ] You can open `backend/.env` — you will copy values from it into Vercel.
      Never paste them into chat or commit them.

---

## Part 1 — Deploy the backend

1. - [ ] Vercel dashboard → **Add New… → Project** → import
       `Umarpython001/ade.footwear`.
2. - [ ] **Root Directory**: click Edit, choose **`backend`**.
3. - [ ] Framework Preset: **Other** (no build command, no output directory —
       Vercel finds `api/index.py` itself).
4. - [ ] **Python version**: Project Settings → Python Version → **3.12**
       (3.14 is not offered; our packages all support 3.12).
5. - [ ] **Environment Variables** (Project Settings → Environment Variables),
       copied from `backend/.env`:

       | Name | Value |
       | --- | --- |
       | `SUPABASE_URL` | same as `.env` |
       | `PUBLISHABLE_KEY` | same as `.env` |
       | `DIRECT_CONNECTION_STRING` | same as `.env` |
       | `ALLOWED_ORIGINS` | `http://localhost:5173,https://ade-footwear-v2n7.vercel.app` |

6. - [ ] **Deploy.**

### ✅ Check it worked

- [ ] `https://<your-backend-domain>/health` → `{"status":"ok"}`
- [ ] `https://<your-backend-domain>/products/?limit=100` → the 4 ADE products
- [ ] `https://<your-backend-domain>/docs` → interactive API docs load

**If something fails:** Vercel project → Deployments → your deployment →
Functions/Logs shows the Python traceback. Common causes:

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'app'` | Root Directory not `backend` | Settings → General → Root Directory |
| 500 on every request, logs mention env/key | Missing env var | Add it, then **Redeploy** (env changes need a redeploy) |
| Logs show database connection errors | Bad `DIRECT_CONNECTION_STRING` | Re-copy from `.env`, redeploy |
| First request after idle is slow (~10s) | Cold start | Normal on serverless; it warms up |

---

## Part 2 — Point the live frontend at the backend

The frontend was built with `localhost:8000` baked in, so until you do this
the live shop is empty.

1. - [ ] Open the **frontend** Vercel project (the existing one) → Settings →
       Environment Variables.
2. - [ ] Add **`VITE_API_URL`** = `https://<your-backend-domain>` (Production
       and Preview).
3. - [ ] Deployments → ⋯ on the latest → **Redeploy**. (Vite inlines env vars
       at build time — an env change alone does nothing until a rebuild.)

### ✅ Check it worked

- [ ] `https://ade-footwear-v2n7.vercel.app` shop page shows the 4 ADE products
- [ ] Clicking a product opens its details page with the photo
- [ ] Browser dev tools → Network shows calls to your backend domain, status 200

**If the shop is empty:** open dev tools → Console. A CORS error means the
frontend domain isn't in the backend's `ALLOWED_ORIGINS` — update it in the
backend project's env vars and redeploy the backend.

---

## Part 3 — Every-day workflow (after the one-time setup)

### Run locally

```bat
:: terminal 1
cd C:\Users\olowo\Desktop\ade.footwear\backend
venv\Scripts\activate
uvicorn app.main:app --reload

:: terminal 2
cd C:\Users\olowo\Desktop\ade.footwear\frontend
npm run dev
```

- After editing `backend/.env`: **restart uvicorn yourself** — `--reload` only
  watches `.py` files.

### Ship changes

- `git push` → both Vercel projects rebuild automatically. Nothing else to do.

### Re-seed the products

```bat
cd C:\Users\olowo\Desktop\ade.footwear\backend
venv\Scripts\python.exe seed_products.py
```

Deletes every product and inserts the 4 ADE dummy products. Affects the live
site too (shared database).

---

## Part 4 — Known limitations (expected, not bugs)

- **Checkout and Orders pages don't work yet** — they need Google sign-in,
  which isn't built. `POST /orders` correctly answers 401 without a token.
- **No order emails** — Mailgun was dropped from scope.
- **Catalogue is placeholder** — names/prices/descriptions in
  `frontend/src/data/products.ts` and the seed are invented; the owner must
  approve real ones before launch.
