# Environment File Setup for Prisma Migrations

## Issue: Prisma Doesn't Load .env.local

**Problem:** Prisma CLI only loads `.env` by default, not `.env.local`.

**Solution:** Use `dotenv-cli` to load `.env.local` for Prisma commands.

## Setup

### Option 1: Use .env File (Simplest)

Copy your `.env.local` to `.env`:
```bash
cp .env.local .env
```

**Note:** `.env` is usually gitignored, so this is safe.

### Option 2: Use dotenv-cli (Recommended)

The `package.json` scripts are already configured to use `dotenv-cli`:
```json
"db:migrate": "dotenv -e .env.local -- prisma migrate dev"
```

This automatically loads `.env.local` before running Prisma.

## Your DIRECT_URL Issue

**Issue:** You're using the pooler hostname (`pooler.supabase.com`) with port 5432. For Supabase direct connections, you need the **direct connection hostname**.

**Fix:** Change to use the direct connection hostname:
```env
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

**Difference:**
- ❌ `pooler.supabase.com` (even with port 5432) - still goes through pooler
- ✅ `db.xxxxx.supabase.co` (port 5432) - direct connection

## Quick Fix Steps

1. **Update DIRECT_URL in .env.local:**
   - Change hostname from `pooler.supabase.com` to `db.[PROJECT_REF].supabase.co`
   - Replace `[PROJECT_REF]` with your Supabase project reference
   - Replace `[PASSWORD]` with your database password
   - Keep port as `5432`

2. **Run migration:**
   ```bash
   npm run db:migrate
   ```
   (Now uses dotenv-cli to load .env.local)

3. **Name migration:** `add_auth_identity_and_verification_code`

## Finding Your Supabase Direct URL

1. Go to Supabase Dashboard
2. Settings → Database
3. Look for "Connection string" → "Direct connection" (not "Connection pooling")
4. Copy that URL for `DIRECT_URL`

Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

**Example (DO NOT use actual credentials):**
```env
DIRECT_URL="postgresql://postgres.abc123xyz:your_password_here@db.abc123xyz.supabase.co:5432/postgres"
```

## Verification

After fixing DIRECT_URL, test:
```bash
npm run db:migrate
```

Should work without the "DIRECT_URL not found" error.
