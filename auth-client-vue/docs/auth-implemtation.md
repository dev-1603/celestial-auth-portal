---
name: Auth implementation plan
overview: "Auth-client-vue implementation driven by apiRoutes.json and auth.json: methods (email_password through qr_login), signup, token abstraction, security headers, Git/PR workflow, and build verification."
isProject: true
todos: []
---

# Auth implementation plan (from apiRoutes.json + auth.json)

This plan is driven by:

- **Routes**: [config/apiRoutes.json](config/apiRoutes.json) – backend auth paths (versioned under `/api/v1`).
- **Config**: [config/auth.json](config/auth.json) – enabled methods, methodsConfig, providers, redirects, session.

Flow everywhere: **Component → Composable → Client service (BFF) → Nuxt server route → auth-core**. Visibility and validation come from config.

It also includes **token/session abstraction** (one-place change for proxy-without-client-token), **config-driven security headers** (Sections 6–9), and **Git branch/PR workflow** (Section 10).

---

## 1. Config and routes reference

### 1.1 apiRoutes.json – auth routes

| Method           | Keys / paths | Notes |
|-----------------|--------------|--------|
| **email_password** | login, logout, refresh, me, passwordResetRequest, passwordResetVerify | BFF proxies to these paths. |
| **email_otp**      | send, verify | |
| **phone_sms_otp**  | send, verify | |
| **magic_link**     | send, verify | |
| **oauth**          | providers, initiate (`:provider`), callback (`:provider`) | Dynamic provider in path. |
| **mfa**            | enable, verifySetup, verify, disable | Post-login MFA flows. |

auth.json also has **sso**, **qr_login**, **telegram**, **whatsapp**, **passkey** in `enabledMethods` but no corresponding group in apiRoutes.json yet; add route groups when backend supports them.

### 1.2 auth.json – what to read per method

- **enabledMethods** – list of method ids (for “is this method in the list”).
- **defaultMethod** – which method to show by default on login (e.g. email_password).
- **methodsConfig.<method>** – per method:
  - email_password: `enabled`, `allowSignup`
  - email_otp / phone_sms_otp: `enabled`, `digits`, `expiryMinutes`, `maxAttempts`
  - magic_link: `enabled`, `expiryMinutes`, `allowedDomains`
  - qr_login: `enabled`, `sessionExpirySeconds`
  - telegram / whatsapp / passkey: `enabled` (+ provider/botName etc.)
- **providers.oauth** – list of `{ id, enabled, displayName, logo, buttonVariant }`; filter `enabled === true` for buttons.
- **providers.sso** – list of `{ id, type, enabled, displayName, logo }`; filter `enabled === true`.
- **redirects** – afterLogin, afterLogout, firstLogin, signupComplete, afterMfaEnroll, afterPasswordReset.
- **session** – rememberMeMaxAgeDays, cookie options (for BFF when setting cookies).
- **mfa** – required, policy, methods (totp, sms, webauthn).
- **signupMode** – `"open"` | `"invite_only"` | `"closed"`. Controls whether signup is offered and in what form (see Section 2.10).

---

## 2. Implementation order and tasks

### Phase 1: email_password (done)

- [x] BFF: `POST /api/auth/email-password/login` → auth-core `auth/email/login`.
- [x] Service: `loginWithPassword(payload)`.
- [x] Composable: `useAuth().loginWithPassword`, loading, error, redirect from `redirects.afterLogin`, store token via `useAuthState`.
- [x] Component: EmailPasswordForm; layout shows only when `methodsConfig.email_password.enabled`.
- [ ] **Remaining**: logout, refresh, me, password reset (see below).

### Phase 2: email_password – logout, refresh, me, password reset

Use **auth.json** for redirects and **apiRoutes.json** for paths.

| Feature | Config | apiRoutes path | BFF route | Service fn | Composable | Component / usage |
|--------|--------|----------------|-----------|------------|------------|-------------------|
| Logout | redirects.afterLogout | auth.email_password.logout | POST /api/auth/email-password/logout | logout() | useAuth().logout | Navbar / layout |
| Refresh | session.* | auth.email_password.refresh | POST /api/auth/email-password/refresh | refreshToken() | useAuth().refresh (or plugin) | Plugin / interceptor |
| Me | – | auth.email_password.me | GET /api/auth/email-password/me | getMe() | useAuth().user or fetch once | App shell |
| Password reset request | redirects.afterPasswordReset | auth.email_password.passwordResetRequest | POST /api/auth/forgot-password | requestPasswordReset(email) | useForgotPassword() | ForgotPasswordForm |
| Password reset verify | redirects.afterPasswordReset | auth.email_password.passwordResetVerify | POST /api/auth/reset-password | verifyPasswordReset(token, password) | useResetPassword() | ResetPasswordForm |

- **Config**: Use `methodsConfig.email_password.enabled` and `allowSignup` where relevant; use `redirects.afterLogout`, `redirects.afterPasswordReset` after actions.
- **getPath**: `getPath("auth", "email_password", "logout")` etc. BFF builds auth-core URL from baseUrl + versionedPrefix + path.

### Phase 3: email_otp

- **Config**: `methodsConfig.email_otp.enabled`, `digits`, `expiryMinutes`, `maxAttempts` (for UI and validation).
- **Paths**: `auth.email_otp.send`, `auth.email_otp.verify`.
- **BFF**: POST /api/auth/email-otp/send, POST /api/auth/email-otp/verify (body validated with existing email OTP schemas); forward to auth-core; set cookie on verify.
- **Service**: `sendEmailOtp(email)`, `verifyEmailOtp({ email, code })`.
- **Composable**: `useOtp()` or extend `useAuth()` with sendEmailOtp, verifyEmailOtp; expose only when `methodsConfig.email_otp.enabled`.
- **Component**: EmailOtpForm (step 1: email + send; step 2: code input with `digits` from config + verify).
- **Layout**: Show EmailOtpForm when `methodsConfig.email_otp.enabled` (e.g. method switcher or conditional in LoginLayoutSplit).

### Phase 4: phone_sms_otp

- **Config**: `methodsConfig.phone_sms_otp.enabled`, `digits`, `expiryMinutes`, `maxAttempts`, `provider`, `fromNumber`.
- **Paths**: `auth.phone_sms_otp.send`, `auth.phone_sms_otp.verify`.
- **BFF**: POST /api/auth/phone-otp/send, POST /api/auth/phone-otp/verify; validate with phone OTP schemas; forward to auth-core; set cookie on verify.
- **Service**: `sendSmsOtp({ phone, countryCode })`, `verifySmsOtp({ phone, code })`.
- **Composable**: `usePhoneOtp()` or extend useAuth; guard by `methodsConfig.phone_sms_otp.enabled`.
- **Component**: PhoneOtpForm (phone + countryCode → send → code with `digits` → verify).

### Phase 5: magic_link

- **Config**: `methodsConfig.magic_link.enabled`, `expiryMinutes`, `allowedDomains`.
- **Paths**: `auth.magic_link.send`, `auth.magic_link.verify`.
- **BFF**: POST /api/auth/magic-link/request (forward to auth-core send), GET or POST /api/auth/magic-link/consume (forward verify; set cookie; redirect to redirects.afterLogin).
- **Service**: `requestMagicLink(email)`, `consumeMagicLink(token)` (or consume on callback page via BFF).
- **Composable**: `useMagicLink()`; guard by `methodsConfig.magic_link.enabled`.
- **Component**: MagicLinkForm (email + “Send link”); consume on page that handles `?token=...` (e.g. /login/magic-link/callback).

### Phase 6: oauth

- **Config**: `enabledMethods` includes oauth; `providers.oauth` with `enabled === true` for button list (id, displayName, logo, buttonVariant).
- **Paths**: `auth.oauth.initiate` (replace `:provider` with provider id), `auth.oauth.callback` (same). getPath returns path with `:provider`; BFF or client substitutes provider id.
- **BFF**: GET /api/auth/oauth/authorize-url?provider=:id (or POST) → return { url }; GET /api/auth/oauth/callback (handles redirect from IdP, exchanges code, sets cookie, redirects to redirects.afterLogin).
- **Service**: `getOauthAuthorizeUrl(providerId)` → returns URL; client does `window.location.href = url`.
- **Composable**: `useOauth()`: `enabledProviders` (from config), `redirectToProvider(providerId)`.
- **Component**: OauthButtons – v-for over `enabledProviders`, click → redirectToProvider(provider.id).
- **Helper**: Resolve path with provider: e.g. `getPath("auth", "oauth", "initiate")` returns path with `:provider`; replace with actual id when calling backend.

### Phase 7: mfa (post-login)

- **Config**: `mfa.required`, `mfa.policy`, `mfa.methods`; `redirects.afterMfaEnroll`.
- **Paths**: `auth.mfa.enable`, `auth.mfa.verifySetup`, `auth.mfa.verify`, `auth.mfa.disable`.
- **BFF**: Proxies to auth-core mfa endpoints; use authRequestProvider / cookie for Bearer.
- **Service**: `enableMfa()`, `verifyMfaSetup(code)`, `verifyMfa(code)`, `disableMfa()` (all use authFetch so token is sent).
- **Composable**: `useMfa()`; show MFA UI when backend returns requiresMfa.
- **Component**: MfaForm (TOTP code input, verify); MFA enrollment flow when config allows.

### Phase 8: sso (when backend has routes)

- **Config**: `providers.sso` with `enabled === true`.
- **Routes**: Add to apiRoutes.json when backend exposes them (e.g. auth.sso.initiate, auth.sso.callback).
- **BFF**: Start SSO (return URL or redirect); callback handler sets cookie and redirects to redirects.afterLogin.
- **Service**: `startSso(providerId)`.
- **Composable**: `useSso()`, `enabledSsoProviders`.
- **Component**: SsoButton(s) from config.

### Phase 9: qr_login, telegram, whatsapp, passkey (when backend has routes)

- **Config**: `methodsConfig.qr_login.enabled`, `sessionExpirySeconds`; telegram/whatsapp/passkey enabled flags.
- **Routes**: Add to apiRoutes.json when backend supports (e.g. qr session create/poll, social init/callback).
- **BFF / service / composable / components**: Same pattern (config-driven visibility, path from apiRoutes, BFF proxies and sets cookie).

---

## 2.10 Signup for available methods

Signup is driven by **signupMode** and per-method **allowSignup** (where applicable). Use **redirects.signupComplete** after successful signup.

**Global signup mode (auth.json)**  
- **signupMode**: `"open"` – show signup for methods that have signup enabled; `"invite_only"` – show "Request access" (no self-service registration); `"closed"` – hide all signup UI.  
- **redirects.signupComplete** – where to send the user after signup (e.g. `/verify-email`).

**Per-method signup**

| Method | Config | Signup flow | BFF / apiRoutes | Service | Composable | Component |
|--------|--------|-------------|------------------|---------|------------|-----------|
| email_password | methodsConfig.email_password.allowSignup | Register email + password; redirect signupComplete | Add auth/email/register when backend has it; BFF POST /api/auth/signup/email-password | signupEmailPassword(payload) | useAuth().signupEmailPassword when allowSignup and signupMode open | SignupForm (email, password, confirm) |
| email_otp | signupMode open | Email → send OTP → verify; backend may create account on verify | Reuse email_otp send/verify | sendEmailOtp, verifyEmailOtp | useOtp(); "Sign up" mode | EmailOtpForm or signup step |
| phone_sms_otp | signupMode open | Phone → send OTP → verify; backend may create account | Reuse phone_otp send/verify | sendSmsOtp, verifySmsOtp | usePhoneOtp() | PhoneOtpForm signup mode |
| magic_link | signupMode open | Email → send link → consume; backend creates if new | Reuse magic_link send/verify | requestMagicLink, consumeMagicLink | useMagicLink() | MagicLinkForm signup variant |
| oauth | signupMode open + provider enabled | Same "Sign up with Google" etc.; backend creates on first callback | Same oauth initiate/callback | getOauthAuthorizeUrl | useOauth() | OauthButtons on signup page |
| sso | signupMode open + provider enabled | Same SSO; backend may provision on first login | Same sso start/callback | startSso | useSso() | SsoButton on signup page |

**Checklist**  
1. Read signupMode and methodsConfig.email_password.allowSignup; show signup page/method only when allowed.  
2. Signup page (/signup): if open show SignupForm + OTP/magic/phone/oauth/sso options; if invite_only show RequestAccessForm; if closed redirect to login.  
3. email_password signup: SignupForm with password policy from getAuthRules; BFF register route; redirect to redirects.signupComplete. Add register path to apiRoutes when backend has it.  
4. OTP/magic_link/phone: reuse send/verify; backend decides create-on-verify.  
5. OAuth/SSO: same buttons on signup page; backend creates account on first callback when signupMode open.  
6. After any signup success use redirects.signupComplete.

---

## 3. Cross-cutting rules

1. **Visibility**: For every method, only expose composable methods and show components when the corresponding `methodsConfig.<method>.enabled` (or, for oauth/sso, provider.enabled) is true. Use `enabledMethods` and `defaultMethod` for login method switcher.
2. **Paths**: All BFF→auth-core URLs come from apiRoutes.json via getPath; baseUrl from env (runtimeConfig.public.authApiUrl). For dynamic segments (e.g. oauth `:provider`), add a small helper that substitutes the segment.
3. **Redirects**: After login, logout, password reset, MFA enroll use `authConfig.redirects.*`.
4. **Validation**: Keep using getAuthRules() and existing Zod schemas; add per-method rules from methodsConfig (digits, expiry) where needed.
5. **Cookies**: BFF sets/clears HTTP-only cookies from auth-core response or from auth.json session/rememberMe settings.
6. **Signup**: Respect signupMode (open | invite_only | closed) and per-method allowSignup; show signup UI and method-specific signup only when allowed; after signup redirect to redirects.signupComplete.

---

## 4. apiRoutes.ts updates (if needed)

- **OAuth dynamic path**: If getPath("auth", "oauth", "initiate") returns `auth/oauth/:provider/initiate`, add e.g. `getPathWithParams("auth", "oauth", "initiate", { provider: "google" })` that substitutes `:provider`.
- **New groups**: When backend adds sso, qr_login, etc., add them under `auth` in apiRoutes.json and extend the TypeScript type in apiRoutes.ts. When backend adds register/signup endpoints (e.g. auth/email/register), add them under the relevant method (e.g. email_password.register) and use getPath in BFF signup routes.

---

## 5. Summary checklist

| Phase | Method          | Config keys                    | apiRoutes keys              | Status   |
|-------|-----------------|---------------------------------|-----------------------------|----------|
| 1     | email_password login | methodsConfig, redirects       | email_password.login        | Done     |
| 2     | email_password logout/refresh/me/reset | redirects, session        | logout, refresh, me, passwordReset* | Pending  |
| 3     | email_otp       | methodsConfig.email_otp        | email_otp.send, verify      | Pending  |
| 4     | phone_sms_otp   | methodsConfig.phone_sms_otp    | phone_sms_otp.send, verify  | Pending  |
| 5     | magic_link      | methodsConfig.magic_link       | magic_link.send, verify     | Pending  |
| 6     | oauth           | providers.oauth                | oauth.initiate, callback     | Pending  |
| 7     | mfa             | mfa.*, redirects.afterMfaEnroll | mfa.enable, verify, etc.   | Pending  |
| 8–9   | sso, qr, social, passkey | methodsConfig.*, providers   | Add when backend ready     | Planned  |
| signup | All methods with signup | signupMode, allowSignup, redirects.signupComplete | register/signup paths when backend has them | Section 2.10 | Pending  |

Use this as the single reference: implement in order, and for each feature read config from auth.json and paths from apiRoutes.json so the app stays config-driven and route-driven.

---

## 6. Token/session abstraction (one-place change for proxy later)

**Goal**: When you move to "no access token on client; use proxy", the change is **one place** on the client and one on the server.

- **Client – single module**: `app/lib/authRequestProvider.ts`. It exports `getAuthRequestOptions(getToken: () => string | null)`. Today: return `{ headers: { Authorization: "Bearer " + token } }` when token exists; else `{}`. Later (proxy): return `{}`; all authenticated API calls go to BFF proxy; BFF adds the token from the refresh cookie. No component or service should build `Authorization` elsewhere; only this provider.
- **Single call site**: One Nuxt plugin or `$fetch` interceptor (or composables like `useAuthFetch`) that calls `getAuthRequestOptions(() => useAuthState().accessToken.value)` and merges the returned headers into the request. When you switch to proxy, only the **implementation** of `getAuthRequestOptions` (and BFF proxy) changes; the plugin/composable stays the same.
- **Token storage**: Store access token and user only in one place (e.g. `useAuthState()` / authStore). Auth request provider receives a getter that reads from that store.
- **BFF – one place for proxy**: Later add a single BFF proxy route (e.g. `server/api/proxy/[...].ts`) that reads the refresh cookie, gets the access token server-side, and forwards the client request to auth-core with `Authorization: Bearer <token>`.

**Document**: To switch to proxy: (1) Change `authRequestProvider.getAuthRequestOptions` to return `{}`; (2) Point client API calls to BFF proxy URL; (3) Implement BFF proxy that adds token from cookie.

---

## 7. Config-driven request headers for security

**Goal**: Optional request headers (e.g. X-Request-ID, X-Tenant-ID, X-Client-Version) set **from config** so they can be turned on/off without code changes.

- **Config**: Add `security.requestHeaders` to auth.json (or a dedicated security config). Shape: object mapping header name to value or source, e.g. `"X-Request-ID": "generate-uuid"`, `"X-Tenant-ID": "from-context"`, `"X-Client-Version": "1.0"`. Or array of `{ name, value?, source?: "static" | "generate-uuid" | "from-context" | "from-env" }`. "from-context" = value from auth state (tenantId, userId); "from-env" = runtime config.
- **Single place**: Implement `getSecurityHeaders(context?: { tenantId?, userId? })` that reads config, resolves each header (static, generate-uuid, from-context, from-env), and returns `Record<string, string>`. The **same** plugin/interceptor that uses the auth request provider should call `getSecurityHeaders(context)` and merge with auth headers (one place for all request headers).
- **Context**: Pass the same store/composable that holds user/tenantId after login so "from-context" headers can be resolved.

**Checklist**: Add `security.requestHeaders` to config; implement `getSecurityHeaders`; merge in plugin/interceptor; document which headers you use.

---

## 8. One-place change summary

| Future change | Single place (client) | Single place (server) |
|---------------|------------------------|------------------------|
| No access token on client; use proxy | `authRequestProvider`: return no Bearer header; all API via BFF proxy | BFF proxy route: read refresh cookie, get token, forward with Authorization |
| Add/remove/change security headers | Config only (`security.requestHeaders`). Merging code is already one place (plugin/interceptor) | If BFF adds server-side security headers: one proxy/middleware |

---

## 9. Files to introduce (reference)

- **Client**: `app/lib/authRequestProvider.ts`; Nuxt plugin (or useAuthFetch) that uses it + getSecurityHeaders; one store/composable for session (e.g. `app/stores/authStore.ts` / useAuthState).
- **Config**: auth.json extended with `security.requestHeaders` when you implement security headers.
- **Server**: Later, single BFF proxy route (e.g. `server/api/proxy/[...].ts`) for proxy-only auth and optional server-side security headers.

---

## 10. Git branch creation and PR workflow

- **Branch naming**: Create feature branches in this format:  
  `frontend-nuxt/feature/<featurename>`  
  Example: `frontend-nuxt/feature/email-password-login`, `frontend-nuxt/feature/email-otp`.

- **Before creating a branch**: Pull latest from `origin/development`:  
  `git checkout development && git pull origin development`  
  Then create your branch from `development`:  
  `git checkout -b frontend-nuxt/feature/<featurename>`.

- **Before every commit**: Pull from `origin/development` to keep the branch up to date:  
  `git pull origin development`  
  Resolve any conflicts, then commit.

## 10. Git branch creation and PR workflow

- **Branch naming**: Create feature branches in this format:  
  `frontend-nuxt/feature/<featurename>`  
  Example: `frontend-nuxt/feature/email-password-login`, `frontend-nuxt/feature/email-otp`.

- **Before creating a branch**: Pull latest from `origin/development`:  
  `git checkout development && git pull origin development`  
  Then create your branch from `development`:  
  `git checkout -b frontend-nuxt/feature/<featurename>`.

- **Before every commit**: Pull from `origin/development` to keep the branch up to date:  
  `git pull origin development`  
  Resolve any conflicts, then commit.

- **Pull request**: Open the PR **into** `origin/development` (target branch = `development`). Do not merge into `main` or other branches unless your process specifies otherwise.

### Build and verify

- Run the app build before opening a PR (and optionally after each implementation phase):
  - From repo root: `cd auth-client-vue && pnpm run build`
  - From `auth-client-vue`: `pnpm run build`
- Fix any build or type errors before pushing. This ensures the PR does not break the production build.
