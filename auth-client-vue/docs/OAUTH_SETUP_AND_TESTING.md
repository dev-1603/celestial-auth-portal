## OAuth setup and testing guide

This guide describes the **manual steps** required to get OAuth and SSO
providers working end‑to‑end between:

- `auth-client-vue` (Nuxt BFF + UI), and
- `backend-auth-core` (auth API).

It focuses on **what you must configure by hand** (env vars, provider
dashboards, URLs) so that you can reliably test sign‑in flows.

**Where do OAuth provider secrets live?**  
Only in **backend-auth-core**. The Nuxt app initiates the flow and receives the IdP callback, then forwards the authorization `code` to the backend. The backend exchanges the code for tokens (using `client_id` and `client_secret`) and issues your JWT. The Nuxt app never needs `client_secret`.

---

### 1. Frontend (auth-client-vue) environment variables

Create `auth-client-vue/.env` based on `auth-client-vue/env.example`.
The important variables for OAuth are:

- **`NUXT_PUBLIC_AUTH_API_URL`**
  - URL of the backend auth API (`backend-auth-core`).
  - Local dev example:
    - `NUXT_PUBLIC_AUTH_API_URL=http://localhost:5001`

- **`APP_BASE_URL`**
  - Public URL where the Nuxt app is served.
  - Used when you configure redirect URLs in provider dashboards.
  - Local dev example:
    - `APP_BASE_URL=http://localhost:5000`

- **`AUTH_HANDSHAKE_SECRET`**
  - Required for the encrypted `auth_handshake` cookie in
    `server/utils/handshakeCookie.ts`.
  - Must be **at least 16 characters** and should be random.
  - Example (do **not** commit real values):
    - `AUTH_HANDSHAKE_SECRET="local-dev-handshake-secret-123"`

You can leave the multi‑tenant fields (`APP_MODE`, `TENANT_*`, etc.) at
their defaults for a simple single‑tenant local setup.

---

### 2. Backend (backend-auth-core) environment variables

In `backend-auth-core`, copy `.env.example` to `.env` and fill in:

- **Core settings**
  - `DATABASE_URL` – dev DB connection string.
  - Other required core vars as indicated in `.env.example`.

- **Per‑provider OAuth credentials**
  For each provider you enable in config, set:

  ```bash
  # Set these in backend-auth-core/.env (not in Nuxt)
  OAUTH_GOOGLE_CLIENT_ID=...
  OAUTH_GOOGLE_CLIENT_SECRET=...

  OAUTH_GITHUB_CLIENT_ID=...
  OAUTH_GITHUB_CLIENT_SECRET=...

  OAUTH_MICROSOFT_CLIENT_ID=...
  OAUTH_MICROSOFT_CLIENT_SECRET=...

  # ...and so on for FACEBOOK, TWITTER, APPLE, DISCORD, LINKEDIN, SLACK,
  # SPOTIFY, TWITCH, GITLAB, BITBUCKET, DROPBOX, REDDIT, ZOOM, etc.
  ```

  These are read by `src/services/oauth.service.ts` using the pattern
  `OAUTH_${UPPER_ID}_CLIENT_ID/SECRET`. If they are missing, the backend
  will throw a descriptive error when you try to initiate that provider.

- **Optional: `AUTH_CONFIG_PATH`**
  - If unset, backend uses the shared `auth-client-vue/app/config/auth.json`.
  - Set this only if you want a different `auth.json` location.

---

### 3. Shared config: `auth.json`

The shared `auth.json` (in `auth-client-vue/app/config/auth.json` and
referenced by `backend-auth-core`) controls **non‑secret behavior**:

- which methods are enabled: `enabledMethods`, `defaultMethod`
- password + MFA policies
- rate limits
- redirect behavior (`redirects` block)
- which OAuth / SSO providers are visible:
  - `providers.oauth` and `providers.sso`
  - each provider’s `id`, `displayName`, `logo`, `buttonVariant`,
    `color`, `iconOnly`, etc.

To test a provider end‑to‑end, make sure:

- the provider entry has `"enabled": true` in `auth.json`
- any UI‑related settings are configured as desired (icon behavior, label, etc.)

No secrets should be added to `auth.json`.

---

### 4. Provider dashboard configuration

For each provider you want to test (Google, GitHub, LinkedIn, etc.):

1. **Create an OAuth application** in the provider’s developer console.
2. Set the **redirect URI** to the Nuxt BFF callback URL:

   ```text
   {APP_BASE_URL}/api/auth/callback/{providerId}
   ```

   Examples (for `APP_BASE_URL=http://localhost:5000`):
   - Google `id: "google"` → `http://localhost:5000/api/auth/callback/google`
   - GitHub `id: "github"` → `http://localhost:5000/api/auth/callback/github`
   - LinkedIn `id: "linkedin"` → `http://localhost:5000/api/auth/callback/linkedin`

3. Copy the **client ID** and **client secret** into the backend `.env`:

   ```bash
   OAUTH_GOOGLE_CLIENT_ID=...
   OAUTH_GOOGLE_CLIENT_SECRET=...
   ```

4. Ensure the provider’s `id` in `auth.json` matches the suffix used in the
   env variables (e.g. `"google"` → `OAUTH_GOOGLE_*`).

---

### 5. Running and testing locally

1. **Start backend-auth-core**
   - From `backend-auth-core`, run the dev server (see its README).
   - Confirm it is listening on the port you used for
     `NUXT_PUBLIC_AUTH_API_URL` (e.g. `http://localhost:5001`).

2. **Start auth-client-vue**
   - From `auth-client-vue`, start Nuxt (e.g. `pnpm dev`).
   - Visit `APP_BASE_URL` in the browser (e.g. `http://localhost:5000`).

3. **Test providers**
   - On the login page, confirm providers are visible per `auth.json`.
   - Click a provider:
     - You should be redirected to the IdP.
     - After consent, the IdP should redirect back to:
       - `{APP_BASE_URL}/api/auth/callback/{providerId}`
     - Nuxt BFF exchanges the code with backend and sets auth cookies.
     - You should finally land on the `redirects.afterLogin` path
       (e.g. `/app`).

---

### 6. Common errors and how to fix them

- **`AUTH_HANDSHAKE_SECRET must be set and at least 16 characters`**
  - Set `AUTH_HANDSHAKE_SECRET` in `auth-client-vue/.env` to a
    long random string.
  - Restart the Nuxt dev server.

- **OAuth provider error: redirect URI mismatch**
  - Check that the redirect URI in the provider dashboard exactly matches:
    `{APP_BASE_URL}/api/auth/callback/{providerId}`.
  - Ensure `APP_BASE_URL` and the actual URL in your browser are the same
    (scheme, host, port).

- **Backend error: `OAuth provider X not configured`**
  - Set `OAUTH_{PROVIDER}_CLIENT_ID` and `OAUTH_{PROVIDER}_CLIENT_SECRET`
    in `backend-auth-core/.env`.
  - Restart the backend server.

Use this checklist whenever you add a new provider or set up a new
environment (dev, staging, prod) to ensure OAuth flows work end‑to‑end.

