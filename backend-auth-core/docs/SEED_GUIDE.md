# Database Seed Guide

## Overview

The seed script populates the database with sample data for development and testing. It creates tenants, users, roles, and all necessary relationships.

## Running the Seed

```bash
npm run db:seed
```

**Prerequisites:**
- Database migration must be run first (`npm run db:migrate`)
- Database connection configured in `.env` (`DATABASE_URL`)

## What Gets Created

### Roles
- `USER` - Standard user role
- `ADMIN` - Administrator role
- `OWNER` - Tenant owner role

### Tenants
- `acme-corp` - Acme Corporation (domain: acme.example.com)
- `demo-company` - Demo Company (domain: demo.example.com)

### Users

All users have the same password: `Password123!`

| Email | Password | Role | Tenant | Verified |
|-------|----------|------|--------|----------|
| `admin@acme.com` | `Password123!` | ADMIN | acme-corp | ✅ Yes |
| `user@acme.com` | `Password123!` | USER | acme-corp | ✅ Yes |
| `owner@demo.com` | `Password123!` | OWNER | demo-company | ✅ Yes |
| `user@demo.com` | `Password123!` | USER | demo-company | ❌ No |

### AuthIdentity Records

Each user gets an `AuthIdentity` record with:
- `providerType: "email"`
- `providerUserId: <user-email>`
- `email: <user-email>`

## Testing with Seed Data

### Login Tests

**Email/Password:**
```bash
POST /api/v1/auth/email/login
{
  "email": "admin@acme.com",
  "password": "Password123!"
}
```

**Email OTP:**
1. Request OTP: `POST /api/v1/auth/email/otp/send` with `{"email": "admin@acme.com"}`
2. Verify OTP: `POST /api/v1/auth/email/otp/verify` with `{"email": "admin@acme.com", "code": "<otp>"}`

### Test Scenarios

- **Verified user login**: Use `admin@acme.com` or `user@acme.com`
- **Unverified user**: Use `user@demo.com` (should fail if `requireVerifiedEmail` is true)
- **Different tenants**: Test multi-tenant isolation with users from different tenants
- **Role-based access**: Test with ADMIN vs USER roles

## Resetting Seed Data

The seed script uses `upsert` operations, so running it multiple times is safe (idempotent). To completely reset:

1. **Option 1: Clear and reseed** (uncomment `clearDatabase()` in seed.ts)
2. **Option 2: Drop and recreate database**
   ```bash
   # Drop database (careful!)
   # Then run migrations and seed
   npm run db:migrate
   npm run db:seed
   ```

## Customizing Seed Data

Edit `prisma/seed.ts` to:
- Add more tenants
- Add more users
- Create different role assignments
- Add sample modules
- Add sample client apps
- Create test verification codes

## Integration with Tests

Seed data is useful for:
- Integration tests
- Manual API testing (Postman)
- Local development
- Demo environments

**Note:** Tests should use their own test data (mocked or isolated test database), not seed data.

## Environment Variables

Ensure these are set in `.env`:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## Troubleshooting

### "Unique constraint violation"
- Seed uses `upsert`, so it should handle existing data
- If you get unique errors, the seed may need to clear first (uncomment `clearDatabase()`)

### "Relation does not exist"
- Run migrations first: `npm run db:migrate`
- Ensure all tables exist before seeding

### "Password hash error"
- Ensure `bcryptjs` is installed: `npm install`
- Check that `hashPassword` function is working

## Production Warning

⚠️ **Never run seed in production!** The seed script is for development only. It creates predictable test data and should not be used in production environments.
