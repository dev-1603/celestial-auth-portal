# App mount, config-driven UI, and permission enforcement

This doc explains how the Vue app boots, how the login UI and signup behavior are driven by `auth.json` config, and how “permission” (who can see what) is enforced.

---

## 1. App mount flow

### Entry

1. **`app/app.vue`**  
   Root component: `<NuxtLayout><NuxtPage /></NuxtLayout>`. No auth logic here.

2. **Nuxt**  
   Resolves route → page component → layout. Default layout is `layouts/default.vue` unless the page overrides it.

3. **Client plugin (on first client-side run)**  
   `plugins/common-api.client.ts` runs (`.client.ts` = browser only):

   - Calls `useAuthState()` and `useAuth()`.
   - Calls `initCommonApi({ getToken, refresh, getContext })`:
     - `getToken`: returns `accessToken` from the auth store.
     - `refresh`: calls BFF `/api/auth/email-password/refresh` with cookies; on success updates store via `setAuth`.
     - `getContext`: returns `{ userId, tenantId }` from store (for security headers, etc.).
   - **No** automatic `refresh()` or `getMe()` on app load. Session is **not** restored at mount time.

4. **Auth state**  
   Lives in `stores/authStore.ts`: two refs, `accessToken` and `user`. They are:
   - Set on login (and after a successful refresh when the common API gets a 401 and retries).
   - Cleared on logout.
   - **Not** persisted (no localStorage/sessionStorage). So a full reload starts with “logged out” state until the user logs in again or a 401 triggers refresh and repopulates the store.

### Summary

- **Mount**: `app.vue` → layout → page. Plugin only wires the common API to the auth store; it does **not** run refresh/getMe on init.
- **Session restore**: Only when an authenticated request returns 401 and the common API calls `refresh()`; after a successful refresh, the store is updated and the retried request succeeds.

---

## 2. Config-driven UI (auth.json → what the user sees)

The single source of truth for “what’s allowed” in the UI is **`app/config/auth.json`**, imported as **`authConfig`** in `app/config/authConfig.ts`.

### Where config is used

| Config area | Used in | Effect |
|-------------|--------|--------|
| **`methodsConfig.<method>.enabled`** | Composables | Show/hide login methods and signup options. |
| **`providers.oauth[]`** (and `.enabled`) | `useOauth()` | Which OAuth buttons appear on login/signup. |
| **`signupMode`** | `pages/signup.vue` | `open` → SignupForm; `invite_only` → RequestAccessForm; `closed` → redirect to login. |
| **`redirects.*`** | Composables | Where to send user after login, logout, MFA enroll, password reset, etc. |
| **`passwordPolicy`** (via `getAuthRules`) | `SignupForm` / validation | Min length, complexity rules for validation messages. |

### Login screen: which methods are shown

The **login layout** components (`LoginLayoutSplit.vue`, `LoginLayoutCard.vue`) render sections **only if** the corresponding composable says the method is enabled:

- **Email/password**: `useAuth().isEmailPasswordEnabled`  
  - `authConfig.methodsConfig?.email_password?.enabled === true`
- **Email OTP**: `useOtp().isEmailOtpEnabled`  
  - `authConfig.methodsConfig?.email_otp?.enabled === true`
- **Phone OTP**: `usePhoneOtp().isPhoneOtpEnabled`  
  - `authConfig.methodsConfig?.phone_sms_otp?.enabled === true`
- **Magic link**: `useMagicLink().isMagicLinkEnabled`  
  - `authConfig.methodsConfig?.magic_link?.enabled === true`
- **OAuth**: `useOauth().enabledProviders`  
  - `authConfig.providers?.oauth` filtered by `p.enabled === true`

So: **UI visibility is entirely config-driven**. If a method is disabled in `auth.json`, its block is not rendered and the composable may refuse to call the API (e.g. `useAuth().loginWithPassword` checks `isEmailPasswordEnabled`).

### Signup page: open / invite_only / closed

- **`signup.vue`**  
  - `signupMode = authConfig.signupMode ?? 'open'`.
  - **`closed`**: `watch(signupMode)` redirects to `/auth/login` (immediate).
  - **`invite_only`**: Renders `RequestAccessForm` only.
  - **`open`**: Renders `SignupForm` plus OAuth buttons if any providers are enabled.

So **permission to see signup vs “request access” vs nothing** is enforced by config and a watcher, not by a route guard.

### Backend alignment

- **backend-auth-core** does **not** read the Vue app’s `auth.json`. It has its own config (e.g. `config/auth.json` loaded by `auth-config.loader.ts`).
- **Route mounting** in `backend-auth-core/src/modules/auth/routes.ts` is config-driven:
  - `isMethodEnabledToMount('email_password')` → mount `/email` (email auth).
  - Same for `magic_link`, `phone_sms_otp`, `oauth`.
  - `isMFAEnabled()` → mount `/mfa`.
- So if a method is disabled in the **backend** config, that route is not mounted and the BFF will get 404 for that method. Frontend and backend config should be kept in sync so the UI doesn’t offer methods the backend rejects.

---

## 3. Permission enforcement (who can see which page)

There is **no** global auth middleware in the Vue app. “Permission” is enforced in two ways:

### A. Per-page redirect in `onMounted`

- **`pages/app.vue`** (workspace):  
  `onMounted` → if `!user`, `router.replace('/auth/login')`. So only users with a populated `user` (from store) see the app; others are sent to login.

- **`pages/index.vue`** (landing):  
  `onMounted` → if `user`, `router.replace('/app')`. Logged-in users are sent to the app instead of the landing page.

So:

- **Guest**: can open `/`, `/auth/login`, `/signup`, etc. Whether signup is open or invite-only or closed is from config (see above).
- **Authenticated**: landing redirects to `/app`; `/app` is only shown if `user` is set (and 401 → refresh can repopulate it).

### B. 401 handling and refresh

- Any authenticated request (e.g. `getMe()`, or a future API call with `auth: true`) uses the store’s `accessToken` in `Authorization: Bearer ...`.
- If the backend returns **401**, `commonApi` calls `refresh()`. If refresh succeeds (refresh cookie valid), it updates the store and retries the request. If refresh fails, the request fails and the user remains “logged out” in the store; the next visit to `/app` will redirect to login in `onMounted`.

So “permission” to stay on `/app` is effectively: **has valid session in store**, which is either from a recent login or from a successful refresh after 401. There is no role-based route guard in the current code; `user.role` is available but not used to hide or show routes.

### C. Layout

- **`layouts/default.vue`**  
  Shows a header with user email and “Log out” only when `user` is truthy (`v-if="user"`). So “see the header” is again driven by store state, not by a separate permission config.

---

## 4. End-to-end picture

```
App mount
  → app.vue (NuxtLayout + NuxtPage)
  → Plugin: initCommonApi(getToken, refresh, getContext)  // no refresh/getMe on init
  → Auth state: in-memory only (accessToken, user); empty until login or 401+refresh

Config (auth.json)
  → authConfig
  → Composables: isEmailPasswordEnabled, isEmailOtpEnabled, enabledProviders, signupMode, etc.
  → Login layouts: v-if on each method (email form, OTP, magic link, OAuth)
  → Signup page: RequestAccessForm vs SignupForm vs redirect to login

Permission
  → No global middleware
  → /app: onMounted → if !user → replace('/auth/login')
  → /: onMounted → if user → replace('/app')
  → 401 on any auth request → refresh() once → retry; if refresh fails, user stays logged out
```

If you want, next step can be a short sequence diagram for “first load → login → visit /app” and “first load with refresh cookie → 401 → refresh → retry” so the exact order of mount, config read, and permission checks is visible in one place.
