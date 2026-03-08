# Database Schema and Auth Methods / Providers

This document describes the backend database schema (Prisma) and how it **stores auth methods and their providers**, and how that aligns with the frontend/auth config (`auth.json`).

---

## 1. Schema Overview

The schema is defined in **`backend-auth-core/prisma/schema.prisma`** and includes:

**Tables (17):** `GlobalUser`, `Tenant`, `TenantUserLink`, `Role`, `MembershipRole`, `Module`, `TenantModule`, `MembershipModule`, `RefreshToken`, `Session`, `PasswordReset`, `Invitation`, `ClientApp`, `AppAccess`, `AuthCode`, `AuthIdentity`, `VerificationCode`.

**Enums (2):** `ModuleType`, `AuthMethodType`.

| Area | Models | Purpose |
|------|--------|--------|
| **Core identity** | `GlobalUser`, `Tenant`, `TenantUserLink` | Users, tenants, multi-tenancy |
| **Roles & modules** | `Role`, `Module`, `MembershipRole`, `TenantModule`, `MembershipModule` | RBAC and feature access |
| **Auth tokens & sessions** | `RefreshToken`, `Session`, `PasswordReset` | Sessions and password reset |
| **Invitations** | `Invitation` | Tenant invite flow |
| **Client apps (AaaS)** | `ClientApp`, `AppAccess`, `AuthCode` | OAuth2 clients and authorization codes |
| **Multi-method auth** | `AuthIdentity`, `VerificationCode` | **Auth methods and providers** (see below) |

---

## 2. Complete Schema Reference

### 2.1 Core Identity

**GlobalUser** — Global user record (shared across tenants).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `email` | String | Unique; main identifier |
| `passwordHash` | String? | bcrypt hash for email/password (null for OAuth-only) |
| `isVerified` | Boolean | Email verification status |
| `createdAt`, `updatedAt` | DateTime | Timestamps |

**Tenant** — Organisation or workspace (multi-tenant).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `name` | String | Display name |
| `slug` | String | Unique URL-friendly identifier |
| `domain` | String? | Optional domain for routing |
| `createdAt`, `updatedAt` | DateTime | Timestamps |

**TenantUserLink** — Links user to tenant (membership); user can belong to many tenants.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `userId` | String | FK → GlobalUser |
| `tenantId` | String | FK → Tenant |
| `primary` | Boolean | Primary tenant for this user |
| `createdAt` | DateTime | Timestamps |

---

### 2.2 Roles & Modules

**Role** — Global role (e.g. USER, ADMIN).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `name` | String | Unique role name |
| `description` | String? | Optional description |
| `createdAt` | DateTime | Timestamps |

**MembershipRole** — Assigns role to a membership (user–tenant link). Unique on `(membershipId, roleId)`.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `membershipId` | String | FK → TenantUserLink |
| `roleId` | String | FK → Role |

**Module** — Application module or micro-frontend.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `key` | String | Unique identifier |
| `name` | String | Display name |
| `entryUrl` | String | URL to load the module |
| `type` | ModuleType | MFE or EXTERNAL |
| `createdAt` | DateTime | Timestamps |

**ModuleType** (enum): `MFE` | `EXTERNAL`.

**TenantModule** — Which modules a tenant has enabled. Unique on `(tenantId, moduleId)`.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `tenantId` | String | FK → Tenant |
| `moduleId` | String | FK → Module |
| `enabled` | Boolean | Whether module is on for tenant |
| `config` | Json? | Tenant-specific config |
| `createdAt` | DateTime | Timestamps |

**MembershipModule** — Module access for a specific user-in-tenant. Unique on `(membershipId, moduleId)`.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `membershipId` | String | FK → TenantUserLink |
| `moduleId` | String | FK → Module |
| `enabled` | Boolean | Whether user has access |

---

### 2.3 Auth Tokens & Sessions

**RefreshToken** — Long-lived token for refresh flow.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `token` | String | Unique token |
| `userId` | String | FK → GlobalUser |
| `clientId` | String? | Optional OAuth client |
| `expiresAt` | DateTime | Expiry |
| `revoked` | Boolean | If true, cannot be used |
| `createdAt` | DateTime | Timestamps |

**Session** — Active session record.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `userId` | String | FK → GlobalUser |
| `clientId` | String? | Optional OAuth client |
| `userAgent`, `ip` | String? | Client context |
| `expiresAt` | DateTime | Expiry |
| `createdAt` | DateTime | Timestamps |

**PasswordReset** — One-time password reset token.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `token` | String | Unique token |
| `userId` | String | FK → GlobalUser |
| `expiresAt` | DateTime | Expiry |
| `used` | Boolean | One-time flag |
| `createdAt` | DateTime | Timestamps |

---

### 2.4 Invitations

**Invitation** — Invite a user to a tenant.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `email` | String | Invitee email |
| `tenantId` | String | FK → Tenant |
| `invitedBy` | String? | FK → GlobalUser (inviter) |
| `token` | String | Unique invite token |
| `expiresAt` | DateTime | Expiry |
| `accepted` | Boolean | Whether accepted |
| `createdAt` | DateTime | Timestamps |

---

### 2.5 Client Apps (AaaS)

**ClientApp** — OAuth2 / API client per tenant.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `tenantId` | String | FK → Tenant |
| `name` | String | Display name |
| `clientId` | String | Unique client id |
| `clientSecret` | String | Secret for confidential clients |
| `redirectUris` | String[] | Allowed redirect URIs |
| `createdAt` | DateTime | Timestamps |

**AppAccess** — User’s access to a client app (optional module scoping). Unique on `(userId, clientId)`.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `userId` | String | FK → GlobalUser |
| `clientId` | String | FK → ClientApp |
| `moduleId` | String? | Optional module restriction |

**AuthCode** — OAuth2 authorization code (short-lived).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | cuid | Primary key |
| `code` | String | Unique code |
| `clientId` | String | FK → ClientApp |
| `userId` | String | User who authorized |
| `redirectUri` | String | Used redirect URI |
| `expiresAt` | DateTime | Expiry |
| `used` | Boolean | One-time flag |
| `createdAt` | DateTime | Timestamps |

---

### 2.6 Entity Relationship Summary

```
GlobalUser ←── TenantUserLink ──→ Tenant
     │                │
     │                ├── MembershipRole ──→ Role
     │                └── MembershipModule ──→ Module ←── TenantModule ←── Tenant
     │
     ├── RefreshToken, Session, PasswordReset
     ├── AuthIdentity (multi-method auth)
     ├── AppAccess ──→ ClientApp ←── Tenant
     │                     └── AuthCode
     └── Invitation (as inviter) ←── Invitation (tenant)
```

---

## 3. How Auth Methods and Providers Are Stored

### 3.1 `AuthIdentity` — The Central Table

**`AuthIdentity`** is the table that stores **which auth method (and provider)** a user has linked. One user can have **multiple** AuthIdentity rows (e.g. email+password, Google, SSO).

| Column | Type | Purpose |
|--------|------|--------|
| `id` | cuid | Primary key |
| `userId` | String | FK → `GlobalUser.id` |
| **`providerType`** | String | **Provider identifier** (e.g. `"email"`, `"google"`, `"github"`, `"magic_link"`, `"phone"`, `"saml"`, `"oidc"`) |
| **`providerUserId`** | String | **Stable id from that provider** (e.g. email, Google `sub`, phone E.164) — used for login lookup |
| **`authMethodType`** | Enum? | **Category of auth method**: `PASSWORD`, `OAUTH`, `SSO`, `MAGIC_LINK`, `OTP`, `PHONE` |
| `email` | String? | Email from provider or for email-based identity |
| `displayName` | String? | Display name from provider |
| `metadata` | Json? | Provider-specific claims |
| `createdAt`, `updatedAt` | DateTime | Timestamps |

- **Unique constraint:** `(providerType, providerUserId)` — one global identity per provider-specific id (e.g. one row per Google `sub`).
- **Indexes:** `userId`, `authMethodType` for fast “list my methods” and “filter by type”.

**Distinction:**

- **`providerType`** = concrete provider (e.g. `"google"`, `"saml"`, `"email"`). This maps to **provider `id`** in `auth.json` (e.g. `providers.oauth[].id`, `providers.sso[].id`).
- **`authMethodType`** = category for UX and policy (e.g. show “Social” vs “Enterprise SSO”, or “require at least one PASSWORD method”).

### 3.2 `AuthMethodType` Enum

Used to **categorise** auth methods in the DB and in logic:

| Value | Meaning | Typical `providerType` examples |
|-------|--------|----------------------------------|
| `PASSWORD` | Email/password, passkey | `email` |
| `OAUTH` | Social / OAuth2 | `google`, `github`, `microsoft`, `apple`, … |
| `SSO` | Enterprise SSO (SAML, OIDC) | `saml`, `oidc`, `okta`, `azure_ad`, `keycloak`, … |
| `MAGIC_LINK` | Email magic link | `magic_link` |
| `OTP` | Email OTP, SMS OTP | `email` (when used as OTP), `phone` (SMS OTP) |
| `PHONE` | Phone number auth | `phone` |

### 3.3 `VerificationCode` — OTP and Magic Links

Used for **one-time codes** (email OTP, SMS OTP, magic link tokens). Not for “which provider the user has linked”, but for **fulfilling** a login/signup/MFA step.

| Column | Type | Purpose |
|--------|------|--------|
| `id` | cuid | Primary key |
| `channel` | String | `"email"` or `"phone"` |
| `target` | String | Email or E.164 phone |
| `codeHash` | String | Hashed OTP or token |
| `purpose` | String | `"login"`, `"signup"`, `"mfa"`, `"magic_link"` |
| `expiresAt` | DateTime | Expiry |
| `used` | Boolean | One-time flag |
| `attempts` | Int | Attempt count (rate limiting) |
| `userId` | String? | Set when claimed (e.g. magic link used) |
| `createdAt` | DateTime | Timestamps |

Config for expiry, digits, etc. comes from **`auth.json` → `methodsConfig`** (e.g. `email_otp`, `phone_sms_otp`, `magic_link`).

### 3.4 Password and Email on `GlobalUser`

- **`GlobalUser.passwordHash`** — used for **email/password** login (one password per user).
- **`GlobalUser.email`** — primary email; also used as `providerUserId` for the `providerType: "email"` AuthIdentity when `authMethodType` is `PASSWORD` or `OTP`.

So: **auth method = how they can log in** (stored in `AuthIdentity` + `authMethodType`); **password** is stored once on `GlobalUser`; **OTP/magic-link** flow uses `VerificationCode` and optionally creates/updates `AuthIdentity`.

---

## 4. Mapping: `auth.json` → Database

The frontend/auth config **`auth.json`** (e.g. in `auth-client-vue/config/auth.json`) drives **which methods and providers are offered** in the UI and in tenant config. The **database** stores **which of those the user has actually linked**.

### 4.1 `enabledMethods` → Auth method categories

`auth.json` has:

```json
"enabledMethods": [
  "email_password", "email_otp", "magic_link", "phone_sms_otp",
  "oauth", "sso", "qr_login", "telegram", "whatsapp", "passkey"
]
```

Rough mapping to **DB concepts**:

| `enabledMethods` entry | DB / behaviour |
|------------------------|-----------------|
| `email_password` | `AuthIdentity` with `providerType: "email"`, `authMethodType: PASSWORD`; password on `GlobalUser.passwordHash` |
| `email_otp` | Same or new `AuthIdentity` (e.g. `providerType: "email"`); codes in `VerificationCode` (`purpose: "login"` etc.) |
| `magic_link` | `AuthIdentity` with `providerType: "magic_link"` (or `email`); tokens in `VerificationCode` (`purpose: "magic_link"`) |
| `phone_sms_otp` | `AuthIdentity` with `providerType: "phone"`, `authMethodType: PHONE` or `OTP`; codes in `VerificationCode` (`channel: "phone"`) |
| `oauth` | `AuthIdentity` per provider: `providerType: "google"` etc., `authMethodType: OAUTH` |
| `sso` | `AuthIdentity` per IdP: `providerType: "saml"`, `"oidc"`, `"okta"`, etc., `authMethodType: SSO` |
| `qr_login`, `telegram`, `whatsapp`, `passkey` | Can be stored as additional `providerType` values and a suitable `authMethodType` (e.g. passkey → `PASSWORD` or a future enum); config in `auth.json`, linkage in `AuthIdentity`. |

So: **enabledMethods** = which **categories** of auth are allowed; **DB** stores the **per-user, per-provider** linkage in `AuthIdentity` (and `authMethodType`).

### 4.2 `providers.oauth` → OAUTH identities

`auth.json` lists OAuth providers with an `id`:

```json
"providers": {
  "oauth": [
    { "id": "google", "enabled": true, "displayName": "Google", ... },
    { "id": "github", "enabled": true, ... },
    ...
  ]
}
```

- **`id`** (e.g. `"google"`, `"github"`) = **`AuthIdentity.providerType`** when creating/looking up an OAuth-linked identity.
- **`authMethodType`** = `OAUTH` for all of these.
- **`providerUserId`** = stable id from the provider (e.g. Google `sub`).
- **Display name/logo** stay in config; DB can store `displayName` and extra in `metadata` if needed.

So: **providers.oauth** = list of **allowed OAuth providers**; **DB** stores one **AuthIdentity per user per provider** with that `providerType` and `authMethodType: OAUTH`.

### 4.3 `providers.sso` → SSO identities

`auth.json` lists SSO providers with `id` and `type`:

```json
"sso": [
  { "id": "saml", "type": "saml", "enabled": true, "displayName": "SAML SSO", ... },
  { "id": "oidc", "type": "oidc", ... },
  { "id": "okta", "type": "okta", ... },
  ...
]
```

- **`id`** (e.g. `"saml"`, `"oidc"`, `"okta"`) = **`AuthIdentity.providerType`** for that SSO IdP.
- **`authMethodType`** = `SSO`.
- **`providerUserId`** = stable subject/id from the IdP (SAML nameid, OIDC sub, etc.).

So: **providers.sso** = **allowed SSO providers**; **DB** stores one **AuthIdentity per user per SSO IdP** with that `providerType` and `authMethodType: SSO`.

### 4.4 `methodsConfig` → Behaviour, not identity storage

`methodsConfig` (e.g. `email_password`, `email_otp`, `magic_link`, `phone_sms_otp`, `qr_login`, …) configures **how** each method works (enabled, expiry, digits, provider). It does **not** have a 1:1 table; it drives:

- **Login/signup flows** and **VerificationCode** usage (expiry, attempts).
- **Which providers to show** in the UI (together with `providers.oauth` / `providers.sso`).
- **Creating/updating** `AuthIdentity` and `VerificationCode` when a user completes a step (e.g. OTP verified → ensure AuthIdentity exists for that email/phone).

---

## 5. Summary: Does the DB Support Storing Auth Methods and Providers?

**Yes.**

- **Auth methods** are represented by **`AuthIdentity.authMethodType`** (PASSWORD, OAUTH, SSO, MAGIC_LINK, OTP, PHONE) and by the presence of rows (e.g. password on `GlobalUser`, codes in `VerificationCode`).
- **Providers** are represented by **`AuthIdentity.providerType`** (e.g. `email`, `google`, `github`, `saml`, `oidc`, `okta`), aligned with **`auth.json`** `providers.oauth[].id` and `providers.sso[].id`.
- **One user** can have **multiple** AuthIdentity rows (e.g. email, Google, Okta), so multiple methods and multiple providers per user are supported.
- **`auth.json`** defines which methods and providers are **allowed and how they behave**; the **database** stores **which of those the user has actually linked** and the data needed to perform login (e.g. `providerUserId`, `email`, `metadata`).

For a full list of tables and relations, see **`backend-auth-core/prisma/schema.prisma`**. For migration and backfill steps, see **MIGRATION_RUN_GUIDE.md** and **STEP0_DB_SCHEMA.md**.
