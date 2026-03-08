# Step 0: DB Schema Update - Completion Summary

## What Was Done

### 1. Prisma Schema Updated ✅

**File:** `backend-auth-core/prisma/schema.prisma`

- Added `AuthIdentity` model for multi-method auth support
- Added `VerificationCode` model for OTP and magic link tokens
- Added `authIdentities AuthIdentity[]` relation to `GlobalUser`

### 2. Backfill Script Created ✅

**File:** `backend-auth-core/scripts/backfill-auth-identity.ts`

- Script to migrate existing `GlobalUser` records to `AuthIdentity`
- Creates AuthIdentity with `providerType="email"` for each user with email
- Can be run via: `npm run db:backfill`

### 3. Prisma Client Generated ✅

- Generated Prisma client with new models
- Run: `npm run db:generate`

## What Needs to Be Done Manually

### 1. Run Database Migration

**Important:** The migration requires a database connection. You need to:

1. Ensure your `.env` file has:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```

2. Run the migration:
   ```bash
   npm run db:migrate
   ```
   
   This will:
   - Create a new migration file in `prisma/migrations/`
   - Apply the migration to your database
   - Create the `AuthIdentity` and `VerificationCode` tables

3. **Name the migration:** When prompted, use: `add_auth_identity_and_verification_code`

### 2. Run Backfill Script

After the migration is applied, backfill existing users:

```bash
npm run db:backfill
```

This will:
- Find all `GlobalUser` records with email addresses
- Create corresponding `AuthIdentity` records
- Skip users that already have AuthIdentity (idempotent)

### 3. Verify Migration

Check that tables were created:

```bash
npm run db:studio
```

Or query directly:
```sql
SELECT COUNT(*) FROM "AuthIdentity";
SELECT COUNT(*) FROM "VerificationCode";
```

## Schema Changes Summary

### New Models

**AuthIdentity:**
- Links authentication methods to users
- Unique on `[providerType, providerUserId]`
- Supports multiple methods per user (email + OAuth, etc.)

**VerificationCode:**
- Stores OTP codes and magic link tokens
- Hashed codes for security
- Indexed for fast lookup by channel/target/purpose

### Modified Models

**GlobalUser:**
- Added `authIdentities AuthIdentity[]` relation
- No breaking changes to existing fields

## Next Steps

After completing the migration and backfill:

1. ✅ Method 1 (Email/Password) is already implemented and tested
2. Proceed to Method 2 (Email OTP) following the E2E pattern
3. Continue with other methods as per the plan

## Troubleshooting

### Migration Fails

- Check database connection (`DATABASE_URL`, `DIRECT_URL`)
- Ensure database user has CREATE TABLE permissions
- Check for existing tables with same names

### Backfill Fails

- Ensure migration was applied first
- Check that `GlobalUser` table exists
- Verify email addresses are not null
- Check for duplicate AuthIdentity records (should be handled by unique constraint)

### Prisma Client Out of Sync

If you see type errors after schema changes:

```bash
npm run db:generate
```

This regenerates the Prisma client with new types.
