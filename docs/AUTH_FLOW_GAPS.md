# Auth flow gaps – what to look at

Suggested areas to review or fix across **auth-client-vue** and **backend-auth-core**. Ordered by impact (session/security first, then DX and consistency).

---

## 1. **Session not restored on app load (high impact)**

**What:** On full page load or refresh, the app never tries to restore the session from the refresh cookie. Auth state is in-memory only and starts empty.

**Why it matters:** A user with a valid refresh cookie who revisits the site (or refreshes) is treated as logged out: they hit `/` or `/app`, `user` is null, and they get sent to login. The refresh flow only runs when an authenticated request returns 401, but they never make one because the guard redirects first.

**Where:**
- `auth-client-vue/app/plugins/common-api.client.ts` – wires `getToken` and `refresh` but does not call `refresh()` on init.
- `auth-client-vue/app/pages/app.vue` – `onMounted` redirects if `!user.value`; no attempt to restore session first.

**Suggestions:**
- **Option A:** In the plugin (or an auth bootstrap plugin), after `initCommonApi`, call `refresh()` once. If it succeeds, the store is populated and the user stays on the current route; if it fails, they remain “logged out” and guards behave as today.
- **Option B:** On protected routes (e.g. `/app`), before redirecting in `onMounted`, call `refresh()` once and only redirect if still no user. Option A gives a single place and restores session for any route on load.

---

## 2. **MFA not enforced after password login (security / compliance)**

**What:** Backend email/password login always returns full access + refresh tokens after verifying the password. It does not check whether the user has MFA enabled.

**Where:**
- `backend-auth-core/src/modules/auth/email/login.handler.ts` – after password verification it calls `buildLoginTokens(payload)` and returns tokens. No read of user metadata / `mfaEnabled` and no `mfa_required` / step-up flow.

**Why it matters:** If MFA is enabled for a user, they should be required to complete the MFA step before getting a full session. Today they can log in with only password.

**Suggestions:**
- After password verification, if MFA is enabled in config and the user has MFA set up (e.g. metadata / AuthIdentity or user metadata), return a different response, e.g. `{ mfaRequired: true, temporaryToken: "..." }` (or equivalent) and do not set the refresh cookie or return a full access token.
- Client: when login response has `mfaRequired`, redirect to the MFA verify page and use the temporary token only for `POST /mfa/verify`. After successful MFA verify, backend sets refresh cookie and returns full tokens; client updates store and redirects to app.

---

## 3. **Frontend and backend auth config can drift**

**What:** Vue app uses `app/config/auth.json`; backend uses its own config (e.g. `backend-auth-core/config/auth.json` via `auth-config.loader.ts`). There is no single source of truth or validation that they match.

**Why it matters:** You can enable a method only on the frontend (e.g. magic link) and get 404 from the BFF, or disable on frontend but leave backend mounted and still callable.

**Where:**
- `auth-client-vue/app/config/auth.json` and `authConfig.ts`
- `backend-auth-core/src/config/auth-config.loader.ts` and `backend-auth-core/config/auth.json`

**Suggestions:**
- Document that both must be kept in sync, and/or
- Have the BFF or a build step fetch backend config (or a shared config service) and expose a minimal “enabled methods” to the client, or
- Serve a single `auth.json` from the backend and have the frontend load it at runtime (with caching) so there is one source of truth.

---

## 4. **No global auth guard – easy to forget on new pages**

**What:** There is no Nuxt middleware or global guard. Protection is per-page in `onMounted` (e.g. `/app` redirects if `!user`). New protected pages must remember to add the same check.

**Where:**
- `auth-client-vue/app/pages/app.vue` – `onMounted` redirect.
- No `middleware/` or `definePageMeta` for auth.

**Why it matters:** Adding a new route under “workspace” (e.g. `/app/settings`) without the same check would leave it open. Also, protected content can flash before redirect.

**Suggestions:**
- Add a Nuxt route middleware (e.g. `auth`) that runs on routes that require login: try restore (e.g. one `refresh()` if no user), then redirect to login if still unauthenticated. Use `definePageMeta({ middleware: ['auth'] })` on `/app` and any other protected pages.
- Optionally a `guest` middleware for login/signup that redirects authenticated users to `/app`, so logic lives in one place.

---

## 5. **401 error shape and refresh trigger**

**What:** `commonApi` treats a request as 401 by reading `(err as any).response?.status === 401`. The actual `$fetch`/ofetch error shape in Nuxt can differ (e.g. `statusCode`, or nested under `data`).

**Where:**
- `auth-client-vue/app/lib/commonApi.ts` – `handleResponseError` uses `err?.response?.status`.

**Why it matters:** If the thrown error uses a different property (e.g. `statusCode`), 401 would not be detected, refresh would not run, and the user would see a generic error instead of being silently re-authenticated.

**Suggestion:** Log or test the real error shape when the BFF returns 401 (and 403), and normalize: e.g. `const status = err?.response?.status ?? err?.statusCode ?? err?.status;` so refresh is triggered reliably. Optionally handle 403 (e.g. “session invalid”) by clearing store and redirecting to login.

---

## 6. **No redirect to login after refresh fails**

**What:** When refresh fails (e.g. cookie expired), the common API just rethrows. Nothing clears the store or redirects the user to the login page. They only get redirected when they navigate to a protected page that checks `user` in `onMounted`.

**Where:**
- `auth-client-vue/app/lib/commonApi.ts` – no `clearAuth()` or router redirect on refresh failure.
- `auth-client-vue/app/composables/useAuth.ts` – `refresh()` returns `false`; callers may not redirect.

**Why it matters:** A user on a page that doesn’t run the guard (e.g. a long-lived tab or a page that only uses auth for API calls) can stay on the page with a failed session and keep seeing errors until they hit `/app` or similar.

**Suggestion:** In the plugin (or in `refresh()`), when refresh returns `false`, call `clearAuth()`. Optionally, from a central place (e.g. plugin or commonApi), trigger a redirect to `authConfig.redirects.afterLogout` so any tab that loses session ends up on login.

---

## 7. **Role not used for UI or routes**

**What:** Backend returns `user.role` (e.g. USER, OWNER); the client stores it but does not use it for route guards or hiding UI.

**Where:**
- `auth-client-vue/app/stores/authStore.ts` – `user` type includes `role?: string`.
- No `role`-based middleware or `v-if` on sensitive actions.

**Why it matters:** If you later add admin-only or owner-only routes/actions, the pattern is not in place.

**Suggestion:** Low priority until you need it. When you do, add a small helper (e.g. `requireRole('OWNER')`) used in middleware or composables, and document that backend must enforce the same roles on API routes.

---

## 8. **Signup “closed” still loads the page then redirects**

**What:** When `signupMode === 'closed'`, `signup.vue` uses a watcher with `immediate: true` to redirect to `/auth/login`. The signup page still mounts and may flash before redirect.

**Where:**
- `auth-client-vue/app/pages/signup.vue` – `watch(signupMode, ..., { immediate: true })`.

**Suggestion:** Use a route middleware that reads config and redirects before the page renders, or a layout that redirects when `signupMode === 'closed'`, so the signup route is never painted when signup is closed.

---

## 9. **BFF does not forward cookies on login**

**What:** Backend auth-core sets the refresh token via `Set-Cookie`. The BFF login handler forwards `set-cookie` from the auth-core response to the client. That is correct. One thing to confirm: the BFF uses `fetch()` without `credentials: 'include'` when calling auth-core, so it does not send the browser’s cookies to auth-core (which is correct for login). No change needed unless you have a different setup (e.g. BFF-owned cookie domain).

**Where:**
- `auth-client-vue/server/api/auth/email-password/login.post.ts` – forwards `set-cookie` if present.

**Suggestion:** Just verify in deployment that cookie domain/path and `secure`/`sameSite` match your host (e.g. BFF and app on same site). If BFF is on a subdomain, ensure `cookieDomain` in backend config is set so the cookie is sent to the BFF.

---

## 10. **SSR / hydration**

**What:** Auth store is in-memory refs; plugin is `.client.ts`. On SSR, the store is empty, so any page that renders based on `user` will show “logged out” on first paint, then after hydration might still show the same unless session is restored (see gap 1). So far there’s no obvious hydration mismatch because protected content is behind client-only redirects.

**Suggestion:** When you add session restore (gap 1), keep it client-only (e.g. in the plugin or in a client-only middleware). Avoid rendering different HTML on server vs client based on auth until you have a clear strategy (e.g. “always render logged-out shell on server, then upgrade on client”).

---

## Known gaps (tracking)

| # | Gap | Priority | Status |
|---|-----|----------|--------|
| 1 | Session not restored on app load (no refresh() on init) | High | Open |
| 2 | MFA not enforced after password login (backend) | High | Open |
| 3 | Frontend vs backend config drift | Medium | Open |
| 4 | No global auth middleware | Medium | Open |
| 5 | 401 detection in commonApi (statusCode vs response.status) | Medium | Open |
| 6 | No redirect to login when refresh fails | Medium | Open |
| 7 | Role not used for UI/guards | Low | Open |
| 8 | Signup closed flashes page before redirect | Low | Open |
| 9 | Cookie domain in prod | Verify | In progress |
| 10 | SSR/hydration (auth-dependent HTML) | When relevant | In progress |

---

## Summary table (by area)

| # | Gap | Area | Priority |
|---|-----|------|----------|
| 1 | No session restore on load | Vue plugin / app.vue | High |
| 2 | MFA not enforced after password login | Backend login handler | High (security) |
| 3 | Frontend vs backend config drift | Config / BFF | Medium |
| 4 | No global auth middleware | Vue middleware | Medium |
| 5 | 401 detection in commonApi | commonApi.ts | Medium |
| 6 | No redirect when refresh fails | commonApi / useAuth | Medium |
| 7 | Role not used | Client guards / UI | Low (when needed) |
| 8 | Signup closed flashes page | signup.vue / middleware | Low |
| 9 | Cookie domain in prod | Backend config / deployment | Verify |
| 10 | SSR/hydration if auth-dependent HTML | When adding SSR content | When relevant |

If you tell me which of these you want to tackle first (e.g. 1 + 2, or 4 + 6), I can outline concrete code changes step by step.
