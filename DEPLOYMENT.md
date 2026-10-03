# Deployment Instructions — ADE Foot Wear

Two Vercel projects deploy from this one repo: the **backend** (FastAPI,
serverless) and the **frontend** (React, static). On top of Vercel, the app
needs its **Supabase** project (database + Google sign-in), which is already
set up and shared by local and live environments alike.

> **One database:** local and deployed backends share the same Supabase
> project, so products and orders are the same everywhere.

Follow the parts in order. Every part ends with a check — do not move on
until it passes.

---

## Part 0 — Before you start (once)

- [ ] Working tree is clean: `git status` shows nothing modified that matters.
      (Untracked notes like `AGENTS.md`, screenshots, and `.impeccable/` are
      fine to leave; they never deploy.)
- [ ] Push everything, so Vercel builds exactly what is on your machine:
      ```bat
      cd C:\Users\olowo\Desktop\ade.footwear
      git push
      ```
      **Vercel can only build what is on GitHub.** If `git push` asks for a
      login, sign in with the GitHub account that owns `Umarpython001/ade.footwear`.
- [ ] You can open `backend/.env` and `frontend/.env` — you will copy values
      from them into Vercel. Never paste them into chat or commit them.

---

## Part 1 — Deploy the backend

1. - [ ] Vercel dashboard → **Add New… → Project** → import
       `Umarpython001/ade.footwear`. (Yes, the same repo as the frontend —
       Vercel allows two projects from one repo. Name this one something like
       `ade-backend` so you can tell them apart.)
2. - [ ] **Root Directory**: click Edit, choose **`backend`**.
3. - [ ] Framework Preset: **Other**. Leave Build Command and Output Directory
       empty — Vercel finds `api/index.py` itself.
4. - [ ] **Deploy** once (it will fail or return 500s without env vars — that
       is expected), then set the Python version and env vars below.
5. - [ ] **Python version: 3.12**, set two ways (belt and suspenders):
       - In code: `backend/.python-version` already contains `3.12`, which
         Vercel reads at build time.
       - In the dashboard: backend project → Settings → Python Version →
         pick **3.12** (3.14 is not offered; our packages all support 3.12).
       If the two ever disagree, the dashboard wins — so make sure both say 3.12.
       (`runtime.txt` is a Render/Heroku convention and does nothing on Vercel,
       which is why this repo doesn't have one.)
6. - [ ] **Environment Variables** (backend project → Settings → Environment
       Variables), copied from `backend/.env`. Tick **Production, Preview AND
       Development** for each:

       | Name | Value |
       | --- | --- |
       | `SUPABASE_URL` | same as `.env` |
       | `PUBLISHABLE_KEY` | same as `.env` |
       | `DIRECT_CONNECTION_STRING` | same as `.env` |
       | `ALLOWED_ORIGINS` | `http://localhost:5173,https://ade-footwear-v2n7.vercel.app` |

7. - [ ] Deployments → ⋯ on the latest → **Redeploy** (env changes only apply
       on a fresh build).
8. - [ ] Write down your backend domain, e.g.
       `https://ade-backend.vercel.app`. You need it twice below.

### ✅ Check it worked

- [ ] `https://<your-backend-domain>/health` → `{"status":"ok"}`
- [ ] `https://<your-backend-domain>/products/?limit=100` → the 4 ADE products
- [ ] `https://<your-backend-domain>/docs` → interactive API docs load

**If something fails:** backend project → Deployments → your deployment →
Functions/Logs shows the Python traceback. Common causes:

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'app'` | Root Directory is not `backend` | Settings → General → Root Directory → `backend`, redeploy |
| 500 on every request, logs mention env/key | Missing env var | Add it (all three environments ticked), then **Redeploy** |
| Logs show database connection errors | Bad `DIRECT_CONNECTION_STRING` | Re-copy from `backend/.env`, redeploy |
| First request after idle is slow (~10s) | Cold start | Normal on serverless; hit `/health` once to warm it up |

---

## Part 2 — Supabase settings for the live site

Local sign-in already works. Production needs two additions so Google sign-in
works on the real URL too.

1. - [ ] Supabase dashboard → your project (`wmamaugrxhtmvbpiiqtx`) →
       **Authentication → URL Configuration**:
       - **Site URL:** leave as is (local development uses it).
       - **Redirect URLs:** make sure BOTH entries exist (add any missing one):
         - `http://localhost:5173/**`
         - `https://ade-footwear-v2n7.vercel.app/**`
       - Save. (A returning Google login whose page is not on this list loses
         its session — this is the classic "comes back but still signed out".)
2. - [ ] **Authentication → Providers → Google** is already enabled with your
       Client ID + Secret — no change needed. The redirect URI registered in
       Google Cloud (`https://wmamaugrxhtmvbpiiqtx.supabase.co/auth/v1/callback`)
       does not change between local and live, because Google always returns
       to Supabase, and Supabase forwards to the site.

### ✅ Check it worked

- [ ] You cannot fully test this until Part 3 is done (the live frontend must
      exist first). Come back to the live sign-in test in Part 4.

---

## Part 3 — Point the live frontend at the backend

The live frontend was built before the API connection existed, so until you do
this the live shop is empty and its sign-in button reports "not connected".

1. - [ ] Open the **frontend** Vercel project (the existing one) → Settings →
       Environment Variables. Tick **Production and Preview** for each:

       | Name | Value (from `frontend/.env`) |
       | --- | --- |
       | `VITE_API_URL` | `https://<your-backend-domain>` from Part 1 |
       | `VITE_SUPABASE_URL` | same as `frontend/.env` |
       | `VITE_SUPABASE_ANON_KEY` | same as `frontend/.env` |

       (`VITE_` vars are public-safe by design — Vite inlines them into the
       browser bundle. Never put the service role or Mailgun keys here.)
2. - [ ] Deployments → ⋯ on the latest → **Redeploy**. (Vite reads env vars at
       build time — changing them alone does nothing until a rebuild.)
3. - [ ] Confirm the frontend project's **Root Directory** is `frontend`
       (Settings → General). If it was deployed from the repo root, fix it and
       redeploy.

### ✅ Check it worked

- [ ] `https://ade-footwear-v2n7.vercel.app` shop page shows the 4 ADE products
- [ ] Clicking a product opens its details page with the photo
- [ ] Dev tools → Network shows calls to your backend domain, status 200
- [ ] No CORS errors in Dev tools → Console

**If the shop is empty:** Console CORS error mentioning `Access-Control-Allow-Origin`
means the frontend domain is missing from the backend's `ALLOWED_ORIGINS` —
update it in the **backend** project's env vars and redeploy the backend.

---

## Part 4 — End-to-end test on the live site (do this once)

This proves the whole chain — live frontend → live backend → Supabase Auth →
Supabase database — before any customer touches it.

1. - [ ] Open `https://ade-footwear-v2n7.vercel.app/orders` → **Continue with
       Google** → pick your account → you land back on the **homepage** (the
       rule: plain sign-ins return to featured products).
2. - [ ] Add a pair to the cart → `/checkout` → fill the form → send the order
       → you land on `/order-confirmed/ADE-XXXXXX` with the reference, items
       and totals.
3. - [ ] Open `/orders` → the new order appears in your history.
4. - [ ] Supabase dashboard → Table Editor → `orders` → one row with your
       `user_id`, the reference, `status: submitted`, and totals in kobo;
       `order_items` holds its lines.
5. - [ ] (Optional cleanup) If that was a throwaway test, delete its rows from
       `order_items` first, then `orders`, in the Supabase Table Editor.

**If something fails here:**

| Symptom | Cause | Fix |
| --- | --- | --- |
| Back on the site but still signed out | Live URL missing from Supabase Redirect URLs | Part 2, step 1 |
| `redirect_uri_mismatch` on Google's page | Wrong callback in Google Cloud | The OAuth client's Authorized redirect URI must be exactly `https://wmamaugrxhtmvbpiiqtx.supabase.co/auth/v1/callback` |
| Checkout shows "sign-in expired" loop | Live frontend missing Supabase env vars | Part 3, step 1 (all three vars), redeploy |
| Checkout 400 with per-line messages | Real validation (sold out, bad size) | Not a bug — the backend is protecting the order; adjust cart and retry |
| Old error text stuck in the address bar | Stale URL from a previous failure | Harmless; the app strips these on new sign-ins |

---

## Part 5 — Every-day workflow (after the one-time setup)

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

- `git push` → both Vercel projects rebuild automatically. Re-run the Part 4
  checks after any change that touches checkout, auth, or CORS.

### Re-seed the products

```bat
cd C:\Users\olowo\Desktop\ade.footwear\backend
venv\Scripts\python.exe seed_products.py
```

Deletes every product and inserts the 4 ADE dummy products. Affects the live
site too (shared database).

### Database safety (already done — no action needed)

- Row Level Security is enabled (`backend/supabase/migrations/001_rls.sql`):
  browsers can read active products only; orders tables deny all direct
  access. The backend uses service-level credentials and bypasses RLS.
- If you ever create tables by hand in Supabase, re-apply that file so the
  rules stay in force.

---

## Part 6 — Known limitations (expected, not bugs)

- **No order emails** — Mailgun was dropped from scope. `email_sent_at` stays null.
- **No online payment** — by design: the shop takes order *requests*; Ade Foot Wear
  confirms delivery and payment directly. This is the only piece left for a
  future payment step.
- **Catalogue is placeholder** — names/prices/descriptions in
  `frontend/src/data/products.ts` and the seed are invented; the owner must
  approve real ones before launch (re-run `seed_products.py` afterwards, then
  redeploy nothing — the live site reads the same database).
