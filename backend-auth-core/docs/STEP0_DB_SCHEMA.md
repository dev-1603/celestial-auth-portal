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

**Both steps can be run from your local machine** (or any environment with database access).

### Prerequisites

Ensure your `.env` file has database connection:
```env
DATABASE_URL=postgresql://...  # Connection string to your database
DIRECT_URL=postgresql://...    # Direct connection (for migrations)
```

### 1. Run Database Migration (Local or Server)

**Where to run:** Any machine with:
- Database network access (can connect to DATABASE_URL)
- Node.js and npm installed
- `.env` file configured

**Steps:**

1. Navigate to `backend-auth-core` directory
2. Ensure `.env` has `DATABASE_URL` and `DIRECT_URL`
3. Run the migration:
   ```bash
   npm run db:migrate
   ```
   
   This will:
   - Create a new migration file in `prisma/migrations/`
   - Apply the migration to your database
   - Create the `AuthIdentity` and `VerificationCode` tables

4. **Name the migration:** When prompted, use: `add_auth_identity_and_verification_code`

**Note:** If running locally, ensure your local machine can reach the database (VPN, network access, etc.)

### 2. Run Backfill Script (Local or Server)

**Where to run:** Same as migration - any machine with database access

**Steps:**

1. Ensure migration from Step 1 is complete
2. Run the backfill:
   ```bash
   npm run db:backfill
   ```

This will:
- Find all `GlobalUser` records with email addresses
- Create corresponding `AuthIdentity` records
- Skip users that already have AuthIdentity (idempotent - safe to run multiple times)

**Output example:**
```
Starting AuthIdentity backfill...
Found 10 users to backfill
  ✓ Created AuthIdentity for user1@example.com
  ✓ Created AuthIdentity for user2@example.com
  ...

Backfill complete:
  Created: 10
  Skipped: 0
  Errors: 0
```

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
