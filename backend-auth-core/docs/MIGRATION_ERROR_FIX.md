# Fix: DIRECT_URL Environment Variable Error

## Error Message

```
Error: Environment variable not found: DIRECT_URL.
  -->  prisma/schema.prisma:8
   | 
 7 |   url       = env("DATABASE_URL")
 8 |   directUrl = env("DIRECT_URL")
```

## Solution

Add `DIRECT_URL` to your environment file (`.env.local` or `.env`).

### Step 1: Check Your Environment File

The migration script looks for environment variables in:
1. `.env.local` (if exists)
2. `.env` (fallback)

Check which file you have:
```bash
cd backend-auth-core
ls -la .env*
```

### Step 2: Add DIRECT_URL

**If using `.env.local`:**

Add this line (usually same as DATABASE_URL for local):
```env
DIRECT_URL=postgresql://user:password@host:port/database
```

**If using `.env`:**

Same as above - add `DIRECT_URL` line.

### Step 3: Example Configuration

**For Local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/celestial_auth
DIRECT_URL=postgresql://postgres:password@localhost:5432/celestial_auth
```

**For Supabase:**
```env
# Pooler connection (for app)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (for migrations - required!)
DIRECT_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

**Note:** For Supabase, `DIRECT_URL` must use port `5432` (direct), not `6543` (pooler).

### Step 4: Verify

After adding `DIRECT_URL`, run migration again:
```bash
npm run db:migrate
```

## Why DIRECT_URL is Required

Prisma migrations need a **direct database connection** (not a connection pooler) because:
- Migrations need to create/modify schema
- Poolers (like PgBouncer) don't support schema changes
- `DATABASE_URL` might be a pooler (for app performance)
- `DIRECT_URL` is the direct connection (for migrations)

## Migration Script Location

**Command:** `npm run db:migrate`

**Runs:** `prisma migrate dev`

**Creates files in:** `prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql`

**Script definition:** In `package.json`:
```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev"
  }
}
```

## Quick Fix Checklist

- [ ] Check if `.env.local` or `.env` exists
- [ ] Add `DIRECT_URL=...` (usually same as `DATABASE_URL` for local)
- [ ] For Supabase: Use direct connection (port 5432) in `DIRECT_URL`
- [ ] Run `npm run db:migrate` again
