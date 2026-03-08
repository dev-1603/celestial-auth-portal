-- Baseline: existing database already has core tables (GlobalUser, Tenant, etc.).
-- Do not run this migration on an existing DB. Mark as applied with:
--   npx dotenv -e .env.local -- prisma migrate resolve --applied 20200101000000_baseline
SELECT 1;
