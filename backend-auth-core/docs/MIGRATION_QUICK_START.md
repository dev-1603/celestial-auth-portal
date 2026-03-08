# Migration Quick Start Guide

## Error Resolution

If you see: `Environment variable not found: DIRECT_URL`

**Solution:** Add `DIRECT_URL` to your `.env.local` file (or `.env` file).

## Required Environment Variables

For Prisma migrations, you need **both**:

```env
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

**Why two URLs?**
- `DATABASE_URL` - Used by the application (can be a connection pooler)
- `DIRECT_URL` - Used by Prisma migrations (must be direct connection, not pooler)

**For local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/celestial_auth
DIRECT_URL=postgresql://postgres:password@localhost:5432/celestial_auth
```

**For Supabase:**
```env
# Pooler (for app)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct (for migrations)
DIRECT_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

## Migration Script Location

**Migration command:** `npm run db:migrate`

This runs: `prisma migrate dev`

**What it does:**
1. Creates migration files in `prisma/migrations/` folder
2. Applies migrations to your database
3. Generates Prisma client

**Migration files location:**
```
backend-auth-core/
└── prisma/
    └── migrations/
        └── YYYYMMDDHHMMSS_migration_name/
            └── migration.sql
```

## Step-by-Step Migration

### 1. Set Environment Variables

Create/update `.env.local`:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 2. Run Migration

```bash
cd backend-auth-core
npm run db:migrate
```

**When prompted for migration name, enter:**
```
add_auth_identity_and_verification_code
```

### 3. Verify

Check that tables were created:
```bash
npm run db:studio
# Or query: SELECT * FROM "AuthIdentity";
```

### 4. Run Backfill (Optional)

If you have existing users:
```bash
npm run db:backfill
```

### 5. Run Seed (Optional)

For test data:
```bash
npm run db:seed
```

## Common Issues

### "DIRECT_URL not found"
- Add `DIRECT_URL` to `.env.local` or `.env`
- For local: same as `DATABASE_URL`
- For Supabase: use direct connection URL (port 5432, not 6543)

### "Connection refused"
- Check database is running
- Verify host/port in connection string
- Check firewall/VPN if database is remote

### "Migration already exists"
- Check `prisma/migrations/` folder
- If migration exists, you can skip or reset

## Files Involved

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema definition |
| `prisma/migrations/` | Generated migration files (created by Prisma) |
| `.env.local` or `.env` | Environment variables (DATABASE_URL, DIRECT_URL) |
| `package.json` | Contains `db:migrate` script |

## Migration Scripts in Package.json

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",      // Create and apply migration
    "db:generate": "prisma generate",        // Generate Prisma client
    "db:seed": "tsx prisma/seed.ts",         // Seed database
    "db:backfill": "tsx scripts/backfill-auth-identity.ts",  // Backfill existing users
    "db:studio": "prisma studio"             // Visual database browser
  }
}
```

## Quick Reference

```bash
# 1. Set env vars in .env.local
# 2. Run migration
npm run db:migrate

# 3. (Optional) Backfill existing users
npm run db:backfill

# 4. (Optional) Seed test data
npm run db:seed
```
