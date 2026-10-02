# ADE Foot Wear Backend Plan

This is the plan for the backend, written before any code. Read it top to
bottom once; every later step points back to a section here. Nothing in this
file is built yet.

---

## 1. The big picture in one diagram

```
 ┌────────────────────┐   1. "Sign in with Google"   ┌──────────────────────┐
 │  Browser (React)   │ ───────────────────────────▶ │  Supabase Auth       │
 │  your frontend     │ ◀─────────────────────────── │  (Google sign-in)    │
 │                    │   2. access token (a pass)   └──────────────────────┘
 │                    │
 │                    │   3. axios POST /orders
 │                    │      header: Authorization: Bearer <token>
 │                    │      body:   cart + delivery details
 │                    │ ───────────────────────────▶ ┌──────────────────────┐
 │                    │                              │  FastAPI (Python)    │
 │                    │   7. { reference, total }    │  backend/app         │
 │                    │ ◀─────────────────────────── │                      │
 └────────────────────┘                              │ 4. checks the token  │
                                                     │ 5. reads real prices │──▶ Supabase Postgres
                                                     │    saves the order   │    (products, orders,
                                                     │ 6. sends the email   │──▶ Mailgun   order_items)
                                                     └──────────────────────┘
```

- **Frontend** (what you have now): shows the shop, keeps the cart in the
  browser, and talks to the backend.
- **Backend** (what we build): a small Python program that the frontend calls.
  It is the only part trusted to decide prices and save orders.
- **Supabase**: two things in one service. A **database** (Postgres) that
  stores products and orders, and **Auth**, which handles Google sign-in.
- **Mailgun**: sends the order confirmation email.

Why a backend at all? Anything that runs in the browser can be edited by the
person using it. If the browser decided the price, a customer could change
₦58,000 to ₦5 in their browser tools. The backend runs on a server we control,
so it looks prices up itself and ignores any price the browser sends.

---

## 2. Words you will see

| Word | What it means here |
| --- | --- |
| **API** | The set of URLs the backend answers, like a menu the frontend orders from. |
| **Endpoint** | One item on that menu, e.g. `POST /orders`. |
| **Request / response** | The frontend sends a request (method + URL + data); the backend sends back a response (status code + data). |
| **GET / POST** | GET = "give me data". POST = "here is new data, create something". |
| **JSON** | The text format both sides use, e.g. `{ "size": "42", "quantity": 1 }`. |
| **Status code** | A number on every response. `200` OK, `201` created, `400` your data is wrong, `401` not signed in, `404` not found, `500` server bug. |
| **axios** | A small JavaScript library the frontend uses to send requests. You asked for it; it replaces `fetch`. |
| **FastAPI** | The Python framework the backend is built with. You write a function, put a URL on it, and FastAPI turns it into an endpoint. |
| **Pydantic model** | A Python class describing the exact shape of some data. In this project, `app/models/` holds API models (what we accept and return; FastAPI uses them to reject bad input automatically) and `app/schemas/` holds DB models (the shape of a database row). |
| **Table / row / column** | How the database stores things. `products` is a table; each product is a row; `price_kobo` is a column. |
| **Kobo** | 1 naira = 100 kobo. Prices are stored as whole numbers of kobo (₦58,000 = `5800000`) so there are never decimal rounding errors. |
| **Access token (JWT)** | A long string Supabase gives the browser after Google sign-in. It proves who the user is, like a wristband at an event. It expires after a while. |
| **Environment variables (`.env`)** | Secret settings (keys, passwords) kept out of the code and out of git. |
| **Service role key** | The Supabase master key. It can read and write everything, so it lives **only** in `backend/.env`, never in the frontend. |
| **Anon key** | The public Supabase key. Safe in the frontend; it can only do what database rules allow. |
| **CORS** | A browser safety rule. The backend must say "I accept requests from the ADE website" or the browser blocks the call. |
| **Transaction** | A group of database writes that either all succeed or all fail. Used so we never save an order without its items. |
| **Migration** | A SQL file that creates or changes tables, kept in the repo so the database can be rebuilt. |

---

## 3. What happens when someone clicks Checkout

This is the main journey, step by step. The numbers match the diagram.

1. **Customer fills the cart.** Already works: the cart lives in
   `localStorage` as `{ productId, size, quantity }` lines. No prices.
2. **Customer goes to Checkout and signs in with Google.** The frontend asks
   Supabase Auth to sign them in. Supabase sends them to Google and back, then
   hands the browser an **access token**. The cart survives the trip because it
   is in `localStorage`.
3. **Customer fills delivery details and clicks "Send order request".** The
   frontend uses **axios** to send:

   ```http
   POST /orders
   Authorization: Bearer eyJhbGciOi...        <- the access token
   Idempotency-Key: 6f1c0b8e-...              <- random ID for this attempt
   Content-Type: application/json

   {
     "items": [
       { "productId": "p-001", "size": "42", "quantity": 2 },
       { "productId": "p-003", "size": "41", "quantity": 1 }
     ],
     "customer": {
       "name": "Ada Obi",
       "email": "ada@example.com",
       "phone": "08012345678",
       "address": "12 Example Street",
       "cityState": "Ikeja, Lagos",
       "note": "Call before delivery"
     },
     "confirmed": true
   }
   ```

   Notice what is **not** sent: no prices, no totals, no user ID.
4. **Backend checks who is asking.** It reads the token from the
   `Authorization` header and asks Supabase "is this token real, and whose is
   it?". No valid token, no order (`401`). The user ID comes from the token,
   never from the request body.
5. **Backend checks the cart and works out the money.**
   - Pydantic rejects malformed data (missing name, quantity 0, etc.) with `422`.
   - It loads every product in the cart from the `products` table.
   - It rejects products that don't exist, aren't active, or sizes that are
     sold out (`400` with a clear message per line).
   - It calculates each line total and the order total from the **database**
     prices.
   - It saves the order and all its items **in one transaction**.
   - The `Idempotency-Key` stops a double-click from creating two orders: the
     same key returns the first order instead of making a new one.
6. **Backend sends the confirmation email** through Mailgun: order reference,
   items, sizes, quantities, prices, total, delivery details, next steps. If the
   email fails, the order is still saved; the failure is logged and can be
   retried without creating a duplicate order.
7. **Backend replies** `201 Created` with:

   ```json
   {
     "reference": "ADE-7K3Q9P",
     "status": "submitted",
     "subtotalKobo": 16100000,
     "totalKobo": 16100000,
     "createdAt": "2026-10-02T10:15:00Z"
   }
   ```

   The frontend shows a confirmation screen with the reference, states that no
   payment was taken, and only **then** clears the cart.

If anything fails, the frontend shows the backend's message and keeps the cart,
so the customer can fix it and try again.

---

## 4. The database (Supabase Postgres)

Three tables. Money is always integer kobo.

### `products`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text, primary key | e.g. `p-001` (matches the frontend today) |
| `slug` | text, unique | used in URLs: `/products/woven-buckle-derby` |
| `name`, `description`, `category` | text | |
| `price_kobo` | integer | must be > 0 |
| `images` | jsonb | list of `{ src, alt, focus }` |
| `sizes` | jsonb | list of `{ size, available }` |
| `active` | boolean | false = hidden and cannot be ordered |
| `featured` | boolean | shown on the homepage |
| `created_at`, `updated_at` | timestamp | |

We seed it with the same dummy products the frontend uses now, so nothing
changes visually.

### `orders`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, primary key | internal only, never shown to customers |
| `reference` | text, unique | human-friendly, e.g. `ADE-7K3Q9P` |
| `user_id` | uuid → `auth.users.id` | from the verified token; **indexed** (see "Finding a customer's orders quickly") |
| `idempotency_key` | text, unique | stops duplicate orders |
| `customer_name`, `customer_email`, `phone` | text | |
| `address`, `city_state`, `note` | text | `note` optional |
| `status` | text | starts as `submitted` (PRD section 9 list) |
| `subtotal_kobo`, `delivery_fee_kobo`, `total_kobo` | integer | delivery fee is `0`/unknown until the owner decides |
| `email_sent_at` | timestamp, nullable | set when Mailgun accepts the email |
| `created_at`, `updated_at` | timestamp | |

### `order_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, primary key | |
| `order_id` | uuid → `orders.id` | **indexed**, so an order's items load in one jump |
| `product_id` | text | |
| `product_name` | text | **snapshot**: the name at the time of the order |
| `size`, `quantity` | text, integer | |
| `unit_price_kobo`, `line_total_kobo` | integer | **snapshot** of the price we charged |

Why snapshots? If the owner later renames a shoe or changes its price, old
orders must still show what the customer actually ordered.

### Where are the users?

There is no `users` table of our own, on purpose. **Supabase Auth already
keeps one**: `auth.users` (dashboard: Authentication → Users). Every time
someone signs in with Google, Supabase adds or updates their row there: `id`,
`email`, the provider (Google), last sign-in, and their Google name and picture.

Supabase creates, updates and secures that table itself. A second `users` table
of ours would be a duplicate list of the same people that could drift out of
sync. Instead, our tables point at Supabase's:

```
auth.users (Supabase's)        orders (ours)                order_items (ours)
───────────────────────        ─────────────────            ──────────────────
id  ◀───────────────────────── user_id                      order_id ──▶ orders.id
email                          reference
...                            customer_name, phone, ...
```

1. The customer signs in; the browser gets a token.
2. The backend checks the token with Supabase and gets the user's `id`.
3. The order is saved with `user_id = that id`.
4. "Your orders" = the orders whose `user_id` is the signed-in person's `id`.

**When you would add a table of your own:** usually a `profiles` table, linked
one-to-one to `auth.users.id`, for extra details Supabase doesn't keep (a saved
phone number or default address so customers don't retype them, a role like
"admin"). v1 doesn't need one: delivery details are saved on each order, which
is also more accurate, since old orders keep the address they were actually
sent to.

### Finding a customer's orders quickly (indexes)

"Your orders" runs:

```sql
select * from orders where user_id = '<signed-in user id>' order by created_at desc;
```

Without help, the database would read every order to find the matching ones,
which gets slower as orders pile up. An **index** fixes that. It works like the
index at the back of a textbook: instead of reading all 400 pages to find
"kobo", you look under K, see "kobo → page 212", and jump there. The database
keeps a sorted list of `user_id`s pointing at their rows, so the lookup takes a
few milliseconds whether there are 100 orders or 10 million.

The step 2 migration creates two indexes:

```sql
-- A customer's orders, already in newest-first order (no extra sorting step).
create index orders_user_id_created_at_idx on orders (user_id, created_at desc);

-- The items of one order.
create index order_items_order_id_idx on order_items (order_id);
```

`reference` and `idempotency_key` are `unique`, and Postgres indexes unique
columns automatically, so looking up an order by reference is fast too.

### Why orders aren't stored inside the user's row

It's tempting to keep each customer's orders in a list on their user row. It
causes more problems than it solves:

- **The owner needs every order, not one person's.** "All orders with status
  `submitted`" or "everything from today" would mean opening every customer's
  row and digging through it: the slow full scan again. With an `orders`
  table it's one indexed query.
- **Orders contain items.** Lists of orders that each contain lists of items
  are hard to query, hard to validate and easy to corrupt.
- **The row keeps growing.** Every order makes that user's row bigger, and the
  database rewrites the whole row on each change.
- **Two saves at once can lose an order.** A double-click or two open tabs can
  update the same row at the same moment, and one write overwrites the other.
  Separate rows are only ever added, never overwritten.
- **We can't edit Supabase's table anyway.** `auth.users` is managed by
  Supabase; we'd need our own users table and the sync problem above.
- **The database can't guard data inside a blob.** Separate tables let
  Postgres enforce rules such as "every item belongs to a real order" and
  "quantity is at least 1".

The general rule: when one thing has many of another (one customer → many
orders → many items), each gets its own table, and the "many" side points back
with an ID column (`user_id`, `order_id`). This is called **normalisation**;
indexes keep the lookups fast. Packing data together (**denormalising**) is a
deliberate speed trick for specific cases at far larger scale than this shop.

### Safety rules (Row Level Security)

Supabase lets the browser talk to the database directly with the anon key. We
turn on **Row Level Security** so that the browser can only *read active
products*, and can never read or write orders directly. All order work goes
through the backend, which uses the service role key.

### Saving an order "all or nothing"

The Supabase Python library can't group several writes into one transaction.
So we put a small SQL function `create_order(...)` in the database that inserts
the order and its items together; if any insert fails, none are kept. The
backend calls it with one request. This is the one piece of SQL you'll see
beyond the table definitions, and I'll comment it line by line.

---

## 5. The endpoints

| Method | URL | Signed in? | What it does |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Returns `{ "status": "ok" }`. Used to check the server is up. |
| `GET` | `/products` | No | Lists active products. Replaces the dummy data file. |
| `GET` | `/products/{slug}` | No | One product, or `404`. |
| `POST` | `/orders` | **Yes** | The checkout journey in section 3. |
| `GET` | `/orders` | **Yes** | The signed-in customer's orders, newest first. |
| `GET` | `/orders/{reference}` | **Yes** | One order, only if it belongs to that customer (`404` otherwise, so nobody can probe other people's orders). |

---

## 6. How the backend folder is organised

You already have this skeleton (all files are currently empty). Each folder has
one job:

```
backend/
├── .env                      secret settings (already git-ignored)
├── .env.example              NEW: the same names with no values, safe to commit
├── requirements.txt          Python packages to install
├── app/
│   ├── main.py               creates the FastAPI app, CORS, includes routes
│   ├── core/
│   │   ├── config.py         reads .env into one typed Settings object
│   │   ├── database.py       creates the Supabase client (service role)
│   │   └── auth.py           NEW: "who is this?" from the Bearer token
│   ├── api/
│   │   ├── routes.py         collects all endpoint groups under one router
│   │   └── endpoints/
│   │       ├── home.py       GET /health (your existing file)
│   │       ├── products.py   GET /products, GET /products/{slug}
│   │       └── orders.py     POST /orders, GET /orders, GET /orders/{ref}
│   ├── models/               API models: the shape of data sent over the API
│   │   ├── product.py        ProductOut (what GET /products returns)
│   │   └── order.py          OrderIn (POST /orders body), OrderOut, ...
│   ├── schemas/              DB models: the shape of rows in the database
│   │   ├── product.py        ProductRow (a row of the products table)
│   │   └── order.py          OrderRow, OrderItemRow
│   ├── business_logic/       the actual rules, kept out of the URL handlers
│   │   ├── pricing.py        validate cart lines, compute totals
│   │   ├── orders.py         create order, list orders, idempotency
│   │   └── email.py          build and send the Mailgun email
├── supabase/
│   └── migrations/           NEW: SQL for tables, rules, create_order()
└── tests/                    pytest tests for the rules that matter
```

The pattern: **endpoint files stay thin** (read request → call business logic
→ return response). The rules live in `business_logic/`, where they're easy to
test and read.

Why two kinds of model? The database row and the API message are different
things. A database row has `price_kobo` and `created_at` in snake_case; the API
sends `priceKobo` in camelCase because that's what JavaScript expects, and it
never exposes internal columns like the order `id` or `idempotency_key`.
Business logic reads `schemas/` rows from the database and turns them into
`models/` objects for the response.

### Python packages (`requirements.txt`)

| Package | Why |
| --- | --- |
| `fastapi` | the web framework |
| `uvicorn[standard]` | the server that runs FastAPI (`uvicorn app.main:app --reload`) |
| `pydantic-settings` | reads `.env` into typed settings |
| `supabase` | talks to Supabase database and auth |
| `httpx` | sends the Mailgun request |
| `pytest` | runs tests |

You have Python 3.14. It's very new, so if any package fails to install I'll
tell you rather than work around it; the fix would be installing Python 3.13
alongside.

### Settings in `backend/.env` (names only, you fill the values)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM=
OWNER_NOTIFY_EMAIL=          (optional: who gets a copy of each order)
ALLOWED_ORIGINS=http://localhost:5173,https://<your-vercel-site>
```

Never paste these values into chat or commit them. I will only ever read the
variable names.

---

## 7. What changes in the frontend

| Change | Why |
| --- | --- |
| Install `axios` | You asked for it; it sends the requests. |
| Install `@supabase/supabase-js` | Google sign-in and getting the access token. |
| `src/services/api.ts` | One axios instance: `baseURL` from `VITE_API_URL`, and it automatically attaches `Authorization: Bearer <token>` when signed in. |
| `src/services/products.ts` | Switch from the dummy file to `GET /products`. Pages don't change; this is why the service file exists. |
| `src/services/auth.ts` | Replace the stub with real Supabase Google sign-in. |
| `src/services/orders.ts` | `createOrder()` (axios POST) and `getOrders()`. |
| Checkout page | Real "Send order request" button: disabled while sending, shows errors, shows the confirmation, clears the cart only after success. |
| Orders page | Lists real orders when signed in, with loading, empty and error states. |
| `frontend/.env` | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (all public-safe). |

Both installs need your OK when we reach that step (AGENTS.md rule).

---

## 8. Build order: small steps, each one testable

Each step ends with something you can see working, and I'll explain the code
as we go.

| Step | Build | How you'll know it works |
| --- | --- | --- |
| **1** | `requirements.txt`, `config.py`, `main.py`, `GET /health`, CORS | Visit `http://localhost:8000/health` → `{"status":"ok"}`, and the auto docs at `/docs` |
| **2** | SQL migration: tables, indexes, rules, seed dummy products | Tables visible in the Supabase dashboard |
| **3** | `GET /products`, `GET /products/{slug}` | Products appear at `/docs`; then the frontend shop loads from the backend |
| **4** | Frontend: axios + Supabase Google sign-in | "Continue with Google" really signs you in |
| **5** | `POST /orders`: token check, price check, `create_order()` | Checkout creates a row in `orders` with correct totals |
| **6** | Mailgun email | You receive the confirmation email |
| **7** | `GET /orders` + Orders page | Sign out, sign in, see the order |
| **8** | Tests for pricing, bad sizes, missing token, other users' orders | `pytest` passes |
| **9** | Deploy the backend and point the frontend at it | Live site places a real order |

---

## 9. Tests that matter most

- A price changed in the database is the price charged, whatever the browser sent.
- An unknown product, inactive product or sold-out size is rejected.
- No token, or a fake token, gets `401`.
- Customer A asking for customer B's order gets `404`.
- Sending the same `Idempotency-Key` twice creates one order.
- Quantity below 1 is rejected.

---

## 10. What I need from you before step 2

1. **A Supabase project.** Create one at supabase.com (free plan is fine). I can
   also create it through the connected Supabase tool if you prefer.
2. **Google sign-in set up**: a Google Cloud OAuth client, enabled in Supabase
   Auth → Providers → Google. I'll walk you through it at step 4.
3. **A Mailgun account.** The free sandbox domain only emails addresses you
   add as "authorized recipients", which is fine for the HNG demo.
4. **Where to host the backend** (step 9): Render or Railway both work for
   FastAPI. Decide later.

## 11. Open questions

- Should the owner get an email copy of every order? (Add `OWNER_NOTIFY_EMAIL`.)
- Order reference format: is `ADE-7K3Q9P` (6 random letters/digits) fine?
- Delivery fee: keep it `0` and "confirmed by Ade Foot Wear" until the owner
  decides (PRD open decision 7)?
