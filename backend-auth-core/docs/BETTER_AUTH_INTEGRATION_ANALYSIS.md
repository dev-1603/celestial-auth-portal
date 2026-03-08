# Better Auth Integration Analysis

## Overview

This document analyzes what changes would be required to integrate **Better Auth** library into the current custom authentication implementation.

## Current Implementation vs Better Auth

### Current Implementation
- **Custom OAuth service** (`src/services/oauth.service.ts`)
- **Custom handlers** for OAuth flow (initiate, callback)
- **Manual OAuth flow** implementation
- **3 providers** hardcoded (Google, GitHub, Microsoft)
- **Custom user info normalization**

### Better Auth Approach
- **Full authentication framework** (not just OAuth)
- **Built-in OAuth support** with many providers
- **Automatic OAuth flow handling**
- **Pre-configured providers** (Google, GitHub, Microsoft, Facebook, Twitter, etc.)
- **Generic OAuth plugin** for custom providers

## Required Changes for Better Auth Integration

### 1. **Architecture Decision**

**Option A: Replace Current Implementation**
- Remove custom OAuth service and handlers
- Replace with Better Auth framework
- **Impact:** Major refactoring, lose custom control

**Option B: Hybrid Approach (Recommended)**
- Keep existing methods (Email/Password, Email OTP, Magic Link, Phone OTP)
- Replace only OAuth implementation with Better Auth
- **Impact:** Moderate changes, maintain existing functionality

**Option C: Keep Current, Add Better Auth as Alternative**
- Run both systems in parallel
- **Impact:** Minimal changes, but complexity increases

### 2. **Dependencies**

```json
{
  "dependencies": {
    "better-auth": "^1.0.0"  // Latest version
  }
}
```

### 3. **Database Schema Changes**

Better Auth requires specific tables. Current schema may need:

**New Tables (Better Auth):**
- `session` - Better Auth session management
- `account` - OAuth account linking (similar to our `AuthIdentity`)
- `verification` - Email/phone verification (similar to our `VerificationCode`)
- `user` - May conflict with our `GlobalUser`

**Migration Strategy:**
- Map `GlobalUser` → Better Auth `user` table
- Map `AuthIdentity` → Better Auth `account` table
- Map `VerificationCode` → Better Auth `verification` table
- Keep `TenantUserLink` and other tenant-specific tables

### 4. **Configuration Changes**

**Current:** Environment variables per provider
```bash
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
```

**Better Auth:** Centralized config
```typescript
// better-auth.config.ts
export default {
  providers: {
    google: {
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    },
    github: { ... },
    microsoft: { ... },
    // Add more providers easily
  }
}
```

### 5. **Code Changes**

#### A. Replace OAuth Service
**Current:** `src/services/oauth.service.ts` (custom implementation)
**Better Auth:** Use Better Auth's built-in OAuth handling

**Changes:**
- Remove `oauth.service.ts`
- Remove manual OAuth flow logic
- Use Better Auth's OAuth methods

#### B. Replace OAuth Handlers
**Current:** 
- `src/modules/auth/oauth/initiate.handler.ts`
- `src/modules/auth/oauth/callback.handler.ts`

**Better Auth:**
- Better Auth handles these automatically
- May need adapter/wrapper to match current API structure

#### C. Update Routes
**Current:** Custom Express routes
```typescript
oauthRouter.get('/:provider/initiate', initiateOAuth)
oauthRouter.get('/:provider/callback', handleOAuthCallback)
```

**Better Auth:** Better Auth provides its own routes
- May need to mount Better Auth routes
- Or create adapter routes that call Better Auth

### 6. **Provider Support**

**Current Implementation:** 3 providers (Google, GitHub, Microsoft)

**Better Auth Built-in Providers:**
- Google ✅
- GitHub ✅
- Microsoft ✅
- Facebook
- Twitter/X
- Apple
- Discord
- Slack
- And more...

**Additional Providers via Generic OAuth Plugin:**
- Any OAuth 2.0/OIDC provider
- Auth0, Keycloak, Okta, etc.

### 7. **Integration Points**

#### A. User Management
**Current:** `GlobalUser` with `AuthIdentity`
**Better Auth:** `user` with `account`

**Required:** Migration/adapter layer to map between systems

#### B. Token Management
**Current:** Custom JWT tokens via `token.service.ts`
**Better Auth:** Built-in session/token management

**Required:** Decide whether to:
- Use Better Auth's token system
- Keep custom JWT system
- Bridge between both

#### C. Multi-Tenant Support
**Current:** Tenant-aware via `TenantUserLink`
**Better Auth:** May not have built-in multi-tenant support

**Required:** Custom extension/adapter for tenant functionality

### 8. **Testing Changes**

**Current:** Unit tests for custom OAuth handlers
**Better Auth:** 
- May need to mock Better Auth
- Or test Better Auth integration end-to-end
- Update test suite accordingly

### 9. **API Compatibility**

**Current API:**
```
GET /api/v1/auth/oauth/providers
GET /api/v1/auth/oauth/{provider}/initiate
GET /api/v1/auth/oauth/{provider}/callback
```

**Better Auth API:**
- Different route structure
- May need adapter/wrapper to maintain current API

### 10. **Configuration Sync**

**Current:** `auth.json` config file
**Better Auth:** TypeScript config file

**Required:** 
- Sync provider configs between `auth.json` and Better Auth config
- Or migrate to Better Auth's config system

## Recommended Integration Approach

### Phase 1: Assessment
1. ✅ Analyze Better Auth's API and features
2. ✅ Map current OAuth flow to Better Auth's flow
3. ✅ Identify compatibility points
4. ✅ Plan migration strategy

### Phase 2: Hybrid Integration (Recommended)
1. **Keep existing methods** (Email/Password, OTP, Magic Link, Phone)
2. **Replace OAuth module** with Better Auth
3. **Create adapter layer** to bridge Better Auth with:
   - Current user model (`GlobalUser`)
   - Current token system (`token.service.ts`)
   - Current tenant system
4. **Maintain API compatibility** (same endpoints)

### Phase 3: Implementation Steps

1. **Install Better Auth**
   ```bash
   npm install better-auth
   ```

2. **Create Better Auth Config**
   ```typescript
   // src/config/better-auth.config.ts
   import { betterAuth } from "better-auth"
   
   export const auth = betterAuth({
     database: {
       provider: "prisma",
       url: process.env.DATABASE_URL,
     },
     emailAndPassword: {
       enabled: false, // We handle this separately
     },
     socialProviders: {
       google: {
         clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
         clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
       },
       github: { ... },
       microsoft: { ... },
       // Add all providers from auth.json
     },
   })
   ```

3. **Create Adapter Layer**
   ```typescript
   // src/modules/auth/oauth/better-auth-adapter.ts
   // Wraps Better Auth to match current API structure
   ```

4. **Update Routes**
   - Mount Better Auth routes
   - Or create wrapper routes that call Better Auth

5. **Update Handlers**
   - Replace custom handlers with Better Auth calls
   - Maintain same request/response format

6. **Database Migration**
   - Add Better Auth tables
   - Migrate existing OAuth data
   - Keep tenant tables

## Pros and Cons

### Pros of Better Auth Integration
✅ **More Providers:** Built-in support for many providers
✅ **Less Code:** No need to maintain custom OAuth implementation
✅ **Better Maintained:** Library is actively maintained
✅ **Security:** Battle-tested OAuth implementation
✅ **Features:** Additional features (account linking, token refresh, etc.)
✅ **Generic OAuth:** Easy to add custom providers

### Cons of Better Auth Integration
❌ **Dependency:** Adds external dependency
❌ **Architecture Change:** Significant refactoring required
❌ **Learning Curve:** Team needs to learn Better Auth
❌ **Flexibility:** Less control over OAuth flow
❌ **Migration Effort:** Need to migrate existing OAuth users
❌ **API Changes:** May need to adapt to Better Auth's API structure
❌ **Multi-Tenant:** May need custom extensions for tenant support

## Alternative: Extend Current Implementation

Instead of integrating Better Auth, you could:

1. **Add More Providers** to current `oauth.service.ts`
   - Follow the same pattern (Google, GitHub, Microsoft)
   - Add Facebook, Twitter, Apple, etc.
   - Each provider needs ~20 lines of config

2. **Create Provider Registry**
   - Move provider configs to a separate file
   - Load from `auth.json` config
   - More flexible and maintainable

3. **Generic OAuth Handler**
   - Support any OAuth 2.0/OIDC provider via config
   - No code changes needed for new providers

## Recommendation

**For Current Project:** 
- **Keep custom implementation** if you need:
  - Full control over OAuth flow
  - Custom multi-tenant integration
  - Specific API structure
  - Minimal dependencies

**Consider Better Auth if:**
- You want many providers quickly
- You're okay with framework-level changes
- You want to reduce maintenance burden
- You don't need deep customization

## Next Steps (If Proceeding with Better Auth)

1. **Proof of Concept**
   - Create a test branch
   - Integrate Better Auth for one provider (Google)
   - Test compatibility with current system

2. **Migration Plan**
   - Document all required changes
   - Create migration scripts for existing OAuth users
   - Plan rollback strategy

3. **Gradual Migration**
   - Start with new providers via Better Auth
   - Keep existing providers on current system
   - Migrate one provider at a time

4. **Testing**
   - Comprehensive testing of Better Auth integration
   - Ensure all existing functionality works
   - Test with real OAuth providers

## Estimated Effort

- **Full Integration:** 2-3 weeks
- **Hybrid Approach:** 1-2 weeks
- **Adding More Providers to Current:** 1-2 days per provider

## Conclusion

Better Auth is a powerful library, but integrating it requires significant architectural changes. The current custom implementation is working well and is extensible. 

**Recommendation:** 
- **Short term:** Extend current implementation to add more providers (faster, less risk)
- **Long term:** Consider Better Auth if you need many providers or want to reduce maintenance
