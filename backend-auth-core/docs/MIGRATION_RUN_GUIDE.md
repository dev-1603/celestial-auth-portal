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
