# Post-login authz and redirect flow

This document describes the implemented post-login behavior across BFF (`auth-client-vue`) and auth core (`backend-auth-core`).

## Goals

- Do not pass access/refresh tokens in browser URL redirects.
- Resolve authorization context (`roles`, `apps`) from DB on `/me`.
- Support fallback redirect to a main app URL when user has no app access.

## Implemented changes

### 1) BFF adds Bearer token when calling auth-core

- BFF stores access token server-side in session storage keyed by HttpOnly cookie.
- For authenticated backend calls, BFF injects:
  - `Authorization: Bearer <access-token-from-bff-session>`
- File: `auth-client-vue/server/utils/requestHeaders.ts`

### 2) `/me` now returns DB-resolved roles and app access

- Backend still validates JWT in middleware (`authenticate`).
- `/me` now enriches response using DB lookups:
  - tenant membership roles
  - app access list (client app + module metadata)
  - `defaultAppClientId` (first accessible app)
- Files:
  - `backend-auth-core/src/modules/auth/email/me.handler.ts`
  - `backend-auth-core/src/repositories/user.repository.ts`

### 3) Post-login redirect policy with fallback URL

- Added helper to resolve redirect target after login/magic-link:
  - If user has no accessible apps and fallback URL is configured -> redirect to fallback
  - Else -> redirect to portal route (`/app` or configured `afterLogin`)
- Files:
  - `auth-client-vue/server/utils/postLoginRedirect.ts`
  - `auth-client-vue/server/api/auth/callback/[provider].get.ts`
  - `auth-client-vue/server/api/auth/magic-link/consume.get.ts`
  - `auth-client-vue/server/api/auth/verify-link.get.ts`

### 4) Config for fallback main app URL

- Added runtime config:
  - `NUXT_PUBLIC_MAIN_APP_FALLBACK_URL`
- File:
  - `auth-client-vue/nuxt.config.ts`

## Current `/me` response shape (effective)

```json
{
  "userId": "string",
  "email": "string",
  "tenantId": "string",
  "tenantSlug": "string|null",
  "role": "USER|ADMIN|OWNER",
  "roles": ["..."],
  "apps": [
    {
      "clientId": "string",
      "appName": "string",
      "moduleKey": "string|null",
      "moduleName": "string|null",
      "appRole": "string|null"
    }
  ],
  "defaultAppClientId": "string|null"
}
```

## Security note

- The implementation avoids token-in-query redirect for BFF login flows.
- Existing direct auth-core OAuth callback routes may still contain legacy token redirect behavior; those should be migrated to the same handoff pattern in a separate cleanup pass.

