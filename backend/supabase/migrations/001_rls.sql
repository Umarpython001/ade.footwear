-- 001_rls.sql: Row Level Security for the shop tables (BACKEND_PLAN.md section 4).
--
-- The browser talks to Postgres directly with the anon key, so the database
-- itself must enforce: anyone may READ active products, and nobody outside the
-- backend may read or write orders. The FastAPI backend uses the pooler
-- connection (service-level credentials) and bypasses RLS entirely, so it is
-- unaffected by these policies.
--
-- Applied once with:  python -c "from sqlalchemy import text; ..."
-- (see DEPLOYMENT.md). Re-running is safe: every statement is idempotent.

-- 1. Switch RLS on for all three tables. With RLS on and no policy, every
--    direct (anon/authenticated) access is denied by default.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Anyone (anon + signed-in browser users) may read ACTIVE products only.
--    Hidden products stay invisible even to direct queries.
DROP POLICY IF EXISTS products_read_active ON products;
CREATE POLICY products_read_active ON products
    FOR SELECT
    TO anon, authenticated
    USING (active IS TRUE);

-- 3. No policies on orders / order_items: direct browser access to them is
--    fully denied (no SELECT, INSERT, UPDATE, DELETE). All order work goes
--    through the FastAPI backend, which bypasses RLS.
--    (Intentionally empty: nothing to create here.)
