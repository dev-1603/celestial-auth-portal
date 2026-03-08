# Complete API Routes List - Celestial Auth Core

**Last Updated:** March 8, 2026  
**Base URL:** `http://localhost:5001` (development) or your production URL

---

## Route Structure

- **Unversioned Routes**: `/`, `/health/*` (for load balancers and health checks)
- **Versioned Routes**: `/api/v1/*` (all API endpoints)

---

## Unversioned Routes (No `/api/v1` prefix)

### Root
- `GET /` - API root message
  - **Response**: `{ message: "Celestial Auth Core API" }`

### Health Checks
- `GET /health` - Simple liveness check
  - **Response**: `{ status: "ok", service: "celestial-auth-core" }`
  
- `GET /health/live` - Liveness probe with database check
  - **Query Params**: `details=true` (optional, includes pool info)
  - **Response**: `{ status: "ok" | "degraded", dialect: "...", latencyMs: number, pool?: {...}, timestamp: "..." }`
  - **Status Codes**: `200` (ok) or `503` (degraded)
  
- `GET /health/ready` - Readiness probe with database check
  - **Query Params**: `details=true` (optional, includes pool info)
  - **Response**: `{ status: "ok" | "degraded", dialect: "...", latencyMs: number, pool?: {...}, timestamp: "..." }`
  - **Status Codes**: `200` (ok) or `503` (degraded)

---

## Versioned Routes (`/api/v1`)

### Authentication Routes (`/api/v1/auth/*`)

All authentication routes are conditionally mounted based on `auth.json` configuration.

---

#### Email Authentication (`/api/v1/auth/email/*`)

**Requires:** `email_password` method enabled in `auth.json`

##### Email/Password Login
- `POST /api/v1/auth/email/login` - Login with email and password
  - **Rate Limited**: ✅ Yes (5 attempts per 15 minutes per email+IP)
  - **Body**: `{ email: string, password: string }`
  - **Response**: `{ accessToken: string, user: {...} }`
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)

##### Email OTP
- `POST /api/v1/auth/email/otp/send` - Send OTP code to email
  - **Rate Limited**: ✅ Yes (5 requests per 15 minutes per email+IP)
  - **Body**: `{ email: string }`
  - **Response**: `{ message: "OTP sent to email" }`
  
- `POST /api/v1/auth/email/otp/verify` - Verify OTP code and login
  - **Body**: `{ email: string, code: string }`
  - **Response**: `{ accessToken: string, user: {...} }`
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)

##### Password Reset
- `POST /api/v1/auth/email/password-reset/request` - Request password reset
  - **Rate Limited**: ✅ Yes (3 requests per 60 minutes per email+IP)
  - **Body**: `{ email: string }`
  - **Response**: `{ message: "If an account with that email exists, a password reset link has been sent." }`
  
- `POST /api/v1/auth/email/password-reset/verify` - Complete password reset
- `GET /api/v1/auth/email/password-reset/verify` - Complete password reset (for email links)
  - **Body (POST)**: `{ token: string, email: string, password: string }`
  - **Query (GET)**: `?token=...&email=...&password=...`
  - **Response**: `{ message: "Password has been reset successfully" }`

##### Session Management
- `POST /api/v1/auth/email/logout` - Logout (clear refresh token cookie)
  - **Response**: `{ success: true }`
  
- `POST /api/v1/auth/email/refresh` - Refresh access token
  - **Requires**: `celestial_refresh_token` cookie
  - **Response**: `{ accessToken: string }`
  - **Sets Cookie**: New `celestial_refresh_token` (httpOnly)
  
- `GET /api/v1/auth/email/me` - Get current user
  - **Requires**: Bearer token in `Authorization` header
  - **Response**: `{ id: string, email: string, tenantId: string, role: string, apps: [...] }`

---

#### Magic Link Authentication (`/api/v1/auth/magic-link/*`)

**Requires:** `magic_link` method enabled in `auth.json`

- `POST /api/v1/auth/magic-link/send` - Send magic link to email
  - **Rate Limited**: ✅ Yes (5 requests per 15 minutes per email+IP)
  - **Body**: `{ email: string }`
  - **Response**: `{ message: "Magic link sent to email" }`
  - **Dev Mode**: Returns `magicLink` URL in response for testing
  
- `GET /api/v1/auth/magic-link/verify` - Verify magic link (browser redirect)
  - **Query**: `?token=...&email=...`
  - **Response**: Redirects to frontend or returns JSON
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)
  
- `POST /api/v1/auth/magic-link/verify` - Verify magic link (API)
  - **Body**: `{ token: string, email: string }`
  - **Response**: `{ accessToken: string, user: {...} }`
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)

---

#### Phone OTP Authentication (`/api/v1/auth/phone/*`)

**Requires:** `phone_sms_otp` method enabled in `auth.json`

- `POST /api/v1/auth/phone/otp/send` - Send OTP code to phone via SMS
  - **Rate Limited**: ✅ Yes (5 requests per 15 minutes per phone+IP)
  - **Body**: `{ phone: string }` (E.164 format or 10-digit US)
  - **Response**: `{ message: "OTP sent to phone" }`
  
- `POST /api/v1/auth/phone/otp/verify` - Verify OTP code and login
  - **Body**: `{ phone: string, code: string }`
  - **Response**: `{ accessToken: string, user: {...} }`
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)

---

#### OAuth Authentication (`/api/v1/auth/oauth/*`)

**Requires:** `oauth` method enabled in `auth.json`

**Supported Providers (16):** Google, GitHub, Microsoft, Facebook, Twitter/X, Apple, Discord, LinkedIn, Slack, Spotify, Twitch, GitLab, Bitbucket, Dropbox, Reddit, Zoom

- `GET /api/v1/auth/oauth/providers` - Get list of enabled OAuth providers
  - **Response**: `{ providers: [{ id: string, displayName: string, ... }] }`
  
- `GET /api/v1/auth/oauth/:provider/initiate` - Initiate OAuth flow
  - **Rate Limited**: ✅ Yes (50 requests per 15 minutes per IP+provider)
  - **Query Params**: `redirect?` (optional, frontend URL to redirect after login)
  - **Response**: Redirects to OAuth provider authorization page
  - **Sets Cookie**: `oauth_state` (httpOnly, for CSRF protection)
  
- `GET /api/v1/auth/oauth/:provider/callback` - Handle OAuth callback
  - **Query Params**: `code` (from provider), `state` (CSRF token)
  - **Response**: Redirects to frontend or returns JSON
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)
  - **Note**: Called by OAuth provider, not directly by frontend

**Example Providers:**
- `/api/v1/auth/oauth/google/initiate`
- `/api/v1/auth/oauth/github/initiate`
- `/api/v1/auth/oauth/microsoft/initiate`
- ... (all 16 providers)

---

#### Multi-Factor Authentication (MFA) (`/api/v1/auth/mfa/*`)

**Requires:** `mfa.policy !== "disabled"` in `auth.json`

- `POST /api/v1/auth/mfa/enable` - Generate TOTP secret and QR code
  - **Requires**: Bearer token (authenticated user)
  - **Response**: `{ secret: string, qrCode: string (data URL), manualEntryKey: string, backupCodes: string[], message: string }`
  
- `POST /api/v1/auth/mfa/verify-setup` - Verify TOTP code during setup
  - **Requires**: Bearer token (authenticated user)
  - **Body**: `{ code: string }` (6-digit TOTP code)
  - **Response**: `{ message: string, backupCodes: string[] }`
  
- `POST /api/v1/auth/mfa/verify` - Verify MFA code during login
  - **Body**: `{ code: string, email: string, userId?: string, tenantId?: string }`
  - **Response**: `{ accessToken: string, user: {...} }`
  - **Sets Cookie**: `celestial_refresh_token` (httpOnly)
  - **Note**: Accepts TOTP code or backup code
  
- `POST /api/v1/auth/mfa/disable` - Disable MFA
  - **Requires**: Bearer token (authenticated user) + password
  - **Body**: `{ password: string }`
  - **Response**: `{ message: "MFA has been successfully disabled for your account" }`

---

## Route Summary

### Total Endpoints: 23

#### Unversioned (4)
- `GET /` - Root
- `GET /health` - Simple health
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

#### Email Auth (9)
- `POST /api/v1/auth/email/login`
- `POST /api/v1/auth/email/otp/send`
- `POST /api/v1/auth/email/otp/verify`
- `POST /api/v1/auth/email/password-reset/request`
- `POST /api/v1/auth/email/password-reset/verify`
- `GET /api/v1/auth/email/password-reset/verify`
- `POST /api/v1/auth/email/logout`
- `POST /api/v1/auth/email/refresh`
- `GET /api/v1/auth/email/me`

#### Magic Link (3)
- `POST /api/v1/auth/magic-link/send`
- `GET /api/v1/auth/magic-link/verify`
- `POST /api/v1/auth/magic-link/verify`

#### Phone OTP (2)
- `POST /api/v1/auth/phone/otp/send`
- `POST /api/v1/auth/phone/otp/verify`

#### OAuth (3 base + 16 providers = dynamic)
- `GET /api/v1/auth/oauth/providers`
- `GET /api/v1/auth/oauth/:provider/initiate` (16 providers)
- `GET /api/v1/auth/oauth/:provider/callback` (16 providers)

#### MFA (4)
- `POST /api/v1/auth/mfa/enable`
- `POST /api/v1/auth/mfa/verify-setup`
- `POST /api/v1/auth/mfa/verify`
- `POST /api/v1/auth/mfa/disable`

---

## Rate Limiting

The following endpoints have rate limiting applied (configurable via `auth.json`):

- ✅ `POST /api/v1/auth/email/login` - 5 attempts per 15 minutes
- ✅ `POST /api/v1/auth/email/otp/send` - 5 requests per 15 minutes
- ✅ `POST /api/v1/auth/email/password-reset/request` - 3 requests per 60 minutes
- ✅ `POST /api/v1/auth/magic-link/send` - 5 requests per 15 minutes
- ✅ `POST /api/v1/auth/phone/otp/send` - 5 requests per 15 minutes
- ✅ `GET /api/v1/auth/oauth/:provider/initiate` - 50 requests per 15 minutes

---

## Authentication Requirements

### No Authentication Required
- All health endpoints
- All login/authentication endpoints (login, OTP send/verify, magic link, OAuth, MFA verify)
- Password reset endpoints

### Bearer Token Required
- `GET /api/v1/auth/email/me`
- `POST /api/v1/auth/mfa/enable`
- `POST /api/v1/auth/mfa/verify-setup`
- `POST /api/v1/auth/mfa/disable`

### Cookie Required
- `POST /api/v1/auth/email/refresh` (requires `celestial_refresh_token` cookie)

---

## Response Format

### Success Responses
- **200 OK**: Successful operations
- **JSON**: `{ accessToken?: string, user?: {...}, message?: string, ... }`

### Error Responses
- **400 Bad Request**: Validation errors, missing fields
- **401 Unauthorized**: Invalid credentials, expired tokens, invalid OTP
- **403 Forbidden**: Method disabled, email not verified
- **404 Not Found**: User not found, route not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server errors

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

---

## Configuration

All routes are conditionally mounted based on `auth.json`:

```json
{
  "enabledMethods": ["email_password", "email_otp", "magic_link", "phone_sms_otp", "oauth"],
  "mfa": {
    "policy": "optional"
  }
}
```

If a method is not in `enabledMethods`, its routes return `403 Forbidden`.

---

## Swagger Documentation

All endpoints are documented in Swagger/OpenAPI:
- **Swagger UI**: `http://localhost:5001/docs`
- **OpenAPI JSON**: `http://localhost:5001/docs/spec`

---

## Postman Collection

All endpoints are available in the Postman collection:
- **File**: `postman/Celestial Auth Core.postman_collection.json`
- **Folders**: Health, Email/Password Auth, Email OTP Auth, Magic Link Auth, Phone OTP Auth, OAuth Auth, MFA, Password Reset

---

**Last Updated**: March 8, 2026
