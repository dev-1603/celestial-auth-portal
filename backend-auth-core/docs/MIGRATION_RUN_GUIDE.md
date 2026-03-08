# Running Migration and Backfill - Quick Guide

## Where to Run

**Both migration and backfill can be run from:**
- ✅ Your local machine (if you have database access)
- ✅ CI/CD pipeline
- ✅ Server with database access
- ✅ Any environment with `DATABASE_URL` configured

## Quick Steps

### 1. Setup Environment

Create/update `.env` file in `backend-auth-core/`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

**For local development:**
- If database is on localhost: Use `localhost` or `127.0.0.1`
- If database is remote: Ensure network/VPN access

### 2. Run Migration

```bash
cd backend-auth-core
npm run db:migrate
```

When prompted for migration name, enter:
```
add_auth_identity_and_verification_code
```

**What this does:**
- Creates migration file in `prisma/migrations/`
- Applies changes to database (creates `AuthIdentity` and `VerificationCode` tables)
- Updates Prisma client

### 3. Run Backfill

```bash
npm run db:backfill
```

**What this does:**
- Finds all existing `GlobalUser` records
- Creates `AuthIdentity` records for each (providerType="email")
- Safe to run multiple times (idempotent)

## Verification

After both steps, verify:

```bash
# Option 1: Prisma Studio (visual)
npm run db:studio
# Navigate to AuthIdentity table, should see records

# Option 2: Check via SQL
# Connect to your database and run:
SELECT COUNT(*) FROM "AuthIdentity";
# Should match number of GlobalUser records with email
```

## Troubleshooting

### "Tenant or user not found" (Supabase)
This error means migrations are using the pooler instead of the direct database. Prisma must use the **direct** connection for migrations.

- **Wrong (pooler):** `DIRECT_URL=...@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
- **Correct (direct):** `DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

Get the direct connection string from **Supabase Dashboard → Settings → Database → Connection string → URI** (use the "Direct connection" option, not "Session pooler"). Use that full URI for `DIRECT_URL`. Keep `DATABASE_URL` as the pooler URL (port 6543) for your app.

### "Failed to apply cleanly to the shadow database" / "The underlying table for model GlobalUser does not exist"
This happens when the DB was created outside Prisma Migrate (e.g. `db push` or manual) and the migrations folder only has later migrations. `migrate dev` uses a **shadow database** and replays all migrations from scratch, so it never creates `GlobalUser` and the migration that adds `AuthIdentity` fails.

**Fix:** Apply pending migrations without using a shadow database:

```bash
pnpm run db:migrate:deploy
```

This applies only pending migrations (e.g. `AuthIdentity` + `VerificationCode`) to your existing database. Use `db:migrate:deploy` for this setup instead of `db:migrate` when adding new migrations.

### "The database schema is not empty" (P3005) / baseline
This happens when the database already has tables but no Prisma migration history (`_prisma_migrations` empty or missing). Prisma refuses to run migrations until you **baseline** the DB.

**Fix (one-time):**

1. Mark the baseline migration as already applied (does not run any SQL):
   ```bash
   pnpm run db:migrate:baseline
   ```
2. Apply pending migrations (creates `AuthIdentity` and `VerificationCode`):
   ```bash
   pnpm run db:migrate:deploy
   ```

After that, use `db:migrate:deploy` for future migrations.

### "Connection refused" or "Cannot connect"
- Check `DATABASE_URL` is correct
- Verify network access to database
- Check firewall/VPN if database is remote

### "Migration already applied"
- Migration was already run
- Check `prisma/migrations/` folder for existing migration
- You can skip to backfill step

### "AuthIdentity already exists" (during backfill)
- This is normal - script is idempotent
- It skips users that already have AuthIdentity
- Check "Skipped" count in output

## Production Considerations

**For production databases:**
1. **Backup first:** Always backup database before migrations
2. **Test on staging:** Run migration on staging environment first
3. **Maintenance window:** Consider running during low-traffic period
4. **Monitor:** Watch for any errors during migration/backfill

## Running from CI/CD

If you want to automate this:

```yaml
# Example GitHub Actions
- name: Run Migration
  run: |
    cd backend-auth-core
    npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    DIRECT_URL: ${{ secrets.DIRECT_URL }}

- name: Run Backfill
  run: |
    cd backend-auth-core
    npm run db:backfill
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```
