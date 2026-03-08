# Developer Guide - Celestial Auth Core

## Overview

Celestial Auth Core is a headless, multi-method authentication service built with Express, Prisma, and TypeScript. It supports multiple authentication methods (email/password, OAuth, OTP, magic links, etc.) in a config-driven architecture.

## Architecture

### Key Principles

- **Headless**: No UI - returns JSON responses only
- **Config-driven**: Methods enabled/disabled via `auth.json` config file
- **Multi-method**: One folder per auth method under `src/modules/auth/`
- **Unified response**: All methods return the same JWT/session shape
- **Multi-tenant**: Supports tenant-scoped authentication and authorization

### Route structure and versioning

- **Unversioned** (no `/api/v1` prefix): `GET /` (API root), `GET /health`, `GET /health/live`, `GET /health/ready`. Use these for load balancers and liveness/readiness probes.
- **Versioned**: All auth and API routes live under `/api/v1` (e.g. `/api/v1/auth/email/login`). See Swagger at `/docs` and `src/docs/paths.*.ts` for the full list.

### Project Structure

```
backend-auth-core/
├── src/
│   ├── config/              # Configuration (env, auth config loader)
│   ├── lib/                 # Shared utilities (JWT, cookie, bcrypt, errors)
│   ├── services/            # Business logic (token service)
│   ├── repositories/        # Data access layer (user, auth-identity, etc.)
│   ├── middleware/          # Express middleware (authenticate, errorHandler)
│   ├── modules/
│   │   └── auth/           # Auth module
│   │       ├── routes.ts   # Main router (mounts method routers)
│   │       ├── email/      # Email/password method
│   │       ├── phone/      # Phone OTP method (future)
│   │       ├── oauth/      # OAuth providers (future)
│   │       └── magic-link/ # Magic link method (future)
│   └── docs/               # Swagger/OpenAPI documentation
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/                # Utility scripts (backfill, etc.)
└── postman/               # Postman collections
```

## Database Schema

### Core Models

- **GlobalUser**: Main user entity (one per user across all tenants)
- **AuthIdentity**: Links authentication methods to users (email, OAuth, etc.)
- **VerificationCode**: Stores OTP codes and magic link tokens
- **TenantUserLink**: Links users to tenants (multi-tenant support)
- **Session** / **RefreshToken**: Session management

### AuthIdentity Model

The `AuthIdentity` model enables multiple sign-in methods per user:

```prisma
model AuthIdentity {
  id             String   @id @default(cuid())
  userId         String
  providerType   String   // "email", "google", "github", "phone", etc.
  providerUserId String   // Email, OAuth sub, phone number, etc.
  email          String?
  displayName    String?
  metadata       Json?
  // ...
}
```

**Key points:**
- One user can have multiple AuthIdentities (e.g. email + Google)
- Login flow: Find AuthIdentity by `(providerType, providerUserId)` → get user → issue JWT
- Unique constraint on `[providerType, providerUserId]` ensures one identity per provider

## Configuration

### Auth Config (`auth.json`)

The backend loads auth configuration from `auth-client-vue/config/auth.json` (or path in `AUTH_CONFIG_PATH` env var).

**Key config sections:**
- `enabledMethods`: Array of enabled auth methods (e.g. `["email_password", "oauth"]`)
- `methodsConfig`: Per-method settings (OTP digits, expiry, etc.)
- `providers.oauth`: OAuth provider configs (Google, GitHub, etc.)
- `passwordPolicy`: Password requirements
- `rateLimits`: Rate limiting settings
- `session`: Session configuration

**Secrets** (not in config file - use env vars):
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET` (per provider)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (for SMS OTP)
- SMTP credentials (for email sending)

### Using Config in Code

```typescript
import { isMethodEnabled, getMethodConfig, getEnabledOAuthProviders } from '../config/auth-config.loader'

// Check if method is enabled
if (isMethodEnabled('email_password')) {
  // Mount email router
}

// Get method-specific config
const emailOtpConfig = getMethodConfig('email_otp')
const digits = emailOtpConfig.digits || 6

// Get enabled OAuth providers
const providers = getEnabledOAuthProviders()
```

## Adding a New Auth Method

### Step-by-Step Guide

1. **Create method folder** under `src/modules/auth/<method>/`
   ```
   src/modules/auth/<method>/
   ├── routes.ts
   ├── <handler>.handler.ts
   └── __tests__/
   ```

2. **Implement routes and handlers**
   - Create `routes.ts` with Express Router
   - Create handler files (e.g. `login.handler.ts`, `send-otp.handler.ts`)
   - Use `buildLoginTokens()` from `token.service` after resolving user
   - Use AuthIdentity repository for user lookup

3. **Add to config**
   - Add method to `enabledMethods` in `auth.json`
   - Add method config to `methodsConfig` if needed

4. **Mount router** in `src/modules/auth/routes.ts`
   ```typescript
   if (isMethodEnabled('your_method')) {
     router.use('/your-method', yourMethodRouter)
   }
   ```

5. **Create repositories** (if needed)
   - Add to `src/repositories/` if new data access needed
   - Create `__tests__/` for repository

6. **Write tests**
   - Handler tests in `__tests__/`
   - Mock dependencies (repos, services, config)
   - Test happy path and error cases

7. **Add Swagger docs**
   - Create or update `src/docs/paths.auth.<method>.ts`
   - Document all endpoints with request/response schemas

8. **Create Postman collection**
   - Add requests to `postman/Celestial Auth Core.postman_collection.json`
   - Include happy path and error cases

9. **Update Developer Guide**
   - Add section for your method
   - Document flow, config, endpoints, testing

## Method 1: Email/Password

### Overview

Email/password authentication using AuthIdentity for user lookup. Password hash is stored on `GlobalUser` (for backward compatibility).

### Flow

1. User submits email + password
2. Find `AuthIdentity` by `providerType="email"`, `providerUserId=email`
3. Get `GlobalUser` from AuthIdentity
4. Verify password against `GlobalUser.passwordHash`
5. Build JWT payload and issue tokens

### Endpoints

- `POST /api/v1/auth/email/login` - Login with email/password
- `POST /api/v1/auth/email/refresh` - Refresh access token
- `POST /api/v1/auth/email/logout` - Logout (clear cookie)
- `GET /api/v1/auth/email/me` - Get current user (requires Bearer token)

### Config

```json
{
  "enabledMethods": ["email_password"],
  "methodsConfig": {
    "email_password": {
      "enabled": true,
      "allowSignup": true
    }
  }
}
```

### Testing

**Unit tests:**
```bash
npm test -- src/modules/auth/email/__tests__/login.handler.test.ts
```

**Postman:**
- Import `postman/Celestial Auth Core.postman_collection.json`
- Set `baseUrl` variable (default: `http://localhost:5001`)
- Run "Email/Password Auth" folder requests

### Implementation Files

- Handler: `src/modules/auth/email/login.handler.ts`
- Routes: `src/modules/auth/email/routes.ts`
- Repository: `src/repositories/auth-identity.repository.ts`
- Tests: `src/modules/auth/email/__tests__/login.handler.test.ts`
- Swagger: `src/docs/paths.auth.email.ts`

## Method 2: Email OTP

### Overview

Email OTP (One-Time Password) authentication. User requests an OTP code sent to their email, then verifies the code to log in.

### Flow

1. **Send OTP**: User requests OTP → Generate code → Hash and store in `VerificationCode` → Send email (TODO: integrate email service)
2. **Verify OTP**: User submits code → Find active code → Verify hash → Check expiry/attempts → Mark as used → Find user via AuthIdentity → Issue JWT

### Endpoints

- `POST /api/v1/auth/email/otp/send` - Send OTP code to email
- `POST /api/v1/auth/email/otp/verify` - Verify OTP code and login

### Config

```json
{
  "enabledMethods": ["email_otp"],
  "methodsConfig": {
    "email_otp": {
      "enabled": true,
      "digits": 6,
      "expiryMinutes": 10,
      "maxAttempts": 5
    }
  }
}
```

### Testing

**Unit tests:**
```bash
npm test -- src/modules/auth/email/__tests__/otp-send.handler.test.ts
npm test -- src/modules/auth/email/__tests__/otp-verify.handler.test.ts
npm test -- src/repositories/__tests__/verification-code.repository.test.ts
```

**Postman:**
- Use "Email OTP Auth" folder in the collection
- Send OTP request → Note the code (in dev mode) → Verify with that code

### Implementation Files

- Handlers: `src/modules/auth/email/otp-send.handler.ts`, `otp-verify.handler.ts`
- Routes: `src/modules/auth/email/routes.ts` (added `/otp/send` and `/otp/verify`)
- Repository: `src/repositories/verification-code.repository.ts`
- Tests: `src/modules/auth/email/__tests__/otp-*.test.ts`, `src/repositories/__tests__/verification-code.repository.test.ts`
- Swagger: `src/docs/paths.auth.email.ts` (added `otpSend` and `otpVerify` paths)

### Notes

- OTP codes are hashed before storage (using bcrypt, same as passwords)
- Codes expire based on `expiryMinutes` config
- Failed attempts are tracked; max attempts enforced
- Email sending uses the email service abstraction (see `docs/EMAIL_SERVICE.md`)
  - Default: nodemailer with SMTP (free - Gmail, Outlook, etc.)
  - Can switch to SendGrid or other providers via `EMAIL_PROVIDER` env var
  - Development: Use `EMAIL_PROVIDER=console` to log emails instead of sending

## Method 3: Magic Link

### Overview

Magic Link authentication. User requests a magic link sent to their email, clicks the link to verify, and is automatically logged in. No password or OTP code required.

### Flow

1. **Send Magic Link**: User requests magic link → Generate secure token → Hash and store in `VerificationCode` (purpose=magic_link) → Send email with link
2. **Verify Magic Link**: User clicks link → Extract token and email from URL → Find active verification code → Verify token hash → Mark as used → Find or create user via AuthIdentity → Issue JWT → Redirect or return JSON

### Endpoints

- `POST /api/v1/auth/magic-link/send` - Send magic link to email
- `GET /api/v1/auth/magic-link/verify?token=...&email=...` - Verify magic link (browser redirect)
- `POST /api/v1/auth/magic-link/verify` - Verify magic link (API, returns JSON)

### Config

```json
{
  "enabledMethods": ["magic_link"],
  "methodsConfig": {
    "magic_link": {
      "enabled": true,
      "expiryMinutes": 20,
      "allowSignup": true,
      "allowedDomains": []
    }
  }
}
```

**Config Options:**
- `expiryMinutes`: How long the magic link is valid (default: 20)
- `allowSignup`: Whether to create new users if they don't exist (default: true)
- `allowedDomains`: Restrict to specific email domains (empty array = all domains)

### Testing

**Unit tests:**
```bash
npm test -- src/modules/auth/magic-link/__tests__/send.handler.test.ts
npm test -- src/modules/auth/magic-link/__tests__/verify.handler.test.ts
```

**Postman:**
- Use "Magic Link Auth" folder in the collection
- Send magic link request → Copy the link from response (in dev mode) → Verify with GET request

### Implementation Files

- Handlers: `src/modules/auth/magic-link/send.handler.ts`, `verify.handler.ts`
- Routes: `src/modules/auth/magic-link/routes.ts`
- Repository: `src/repositories/verification-code.repository.ts` (reused from Email OTP)
- Tests: `src/modules/auth/magic-link/__tests__/*.test.ts`
- Swagger: `src/docs/paths.auth.magicLink.ts`

### Notes

- Magic link tokens are cryptographically secure (32-byte random hex)
- Tokens are hashed before storage (using bcrypt, same as passwords)
- Links expire based on `expiryMinutes` config
- Supports both GET (browser redirect) and POST (API) verification
- GET requests can include `redirect` query param to redirect after login
- Email sending uses the email service abstraction (see `docs/EMAIL_SERVICE.md`)
- In development mode, the magic link URL is returned in the response for testing

## Database Migrations

### Running Migrations

```bash
# Create new migration
npm run db:migrate

# Generate Prisma client after schema changes
npm run db:generate
```

### Backfilling AuthIdentity

After adding AuthIdentity model, backfill existing users:

```bash
npm run db:backfill
```

This creates AuthIdentity records for all existing GlobalUser records with email addresses.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/modules/auth/email/__tests__/login.handler.test.ts

# Run with coverage
npm run test:coverage
```

### Test Structure

- Tests live next to code: `**/__tests__/*.test.ts`
- Mock dependencies (Prisma, services, config)
- Test both happy path and error cases

### Mocking in Tests

```typescript
// Mock env config
vi.mock('../../config/env.config', () => ({
  env: { DATABASE_URL: 'postgresql://test', DIRECT_URL: 'postgresql://test' }
}))

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: { authIdentity: { findUnique: vi.fn() } }
}))

// Mock repositories/services
vi.spyOn(authIdentityRepo, 'findAuthIdentityWithUser')
```

## Swagger Documentation

### Viewing Docs

Start the server and visit:
- Swagger UI: `http://localhost:5001/docs`
- OpenAPI JSON: `http://localhost:5001/docs/spec`

### Adding Paths

Add JSDoc comments in `src/docs/paths.auth.<method>.ts`:

```typescript
/**
 * @openapi
 * /auth/email/login:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Login with email and password
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Success
 */
```

## Environment Variables

Required env vars (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `JWT_ACCESS_EXPIRY` - Access token expiry (default: `15m`)
- `JWT_REFRESH_EXPIRY` - Refresh token expiry (default: `7d`)
- `AUTH_CONFIG_PATH` - Path to auth.json (optional, defaults to `../auth-client-vue/config/auth.json`)

Optional (for specific methods):
- `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- Email service: See `docs/EMAIL_SERVICE.md` for configuration
  - `EMAIL_PROVIDER` - `nodemailer` (default, free), `sendgrid` (paid), or `console` (dev)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for nodemailer)
  - `SENDGRID_API_KEY` (for SendGrid)

## Common Patterns

### Resolving User from Auth Method

```typescript
// Find AuthIdentity by provider
const authIdentity = await findAuthIdentityWithUser('email', email)

if (!authIdentity || !authIdentity.user) {
  return res.status(401).json({ error: 'Invalid credentials' })
}

const user = authIdentity.user
const tenantId = user.tenantId
const tenantSlug = user.tenantSlug
```

### Building JWT Payload

```typescript
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload } from '../../../lib/jwt'

const payload: JWTPayload = {
  userId: user.id,
  tenantId: tenantId || '',
  tenantSlug: tenantSlug,
  email: user.email,
  role: 'USER', // Determine from tenant link if needed
}

const { accessToken, refreshCookie } = buildLoginTokens(payload)

res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
res.json({ accessToken, user: { id: user.id, email: user.email, ... } })
```

### Checking Method Enabled

```typescript
import { isMethodEnabled } from '../../config/auth-config.loader'

if (!isMethodEnabled('email_password')) {
  return res.status(403).json({ error: 'Email/password auth is disabled' })
}
```

## Troubleshooting

### Migration Issues

- Ensure `DATABASE_URL` and `DIRECT_URL` are set
- Run `npm run db:generate` after schema changes
- Check Prisma migration files in `prisma/migrations/`

### Config Not Loading

- Check `AUTH_CONFIG_PATH` env var or default path
- Ensure `auth.json` is valid JSON
- Check file permissions

### Tests Failing

- Ensure env mocks are set up (see Test Structure section)
- Check that all dependencies are mocked
- Verify test data matches expected schema

## Next Steps

See the plan document for implementing additional auth methods:
- Method 2: Email OTP
- Method 3: Magic Link
- Method 4: Phone OTP
- Method 5: OAuth (Google, GitHub, Microsoft, etc.)

Each method follows the same E2E pattern: implementation → tests → Swagger → Postman → Developer Guide update.
