# Auth Portal – Development Guide

## API routes and global API instance

The auth portal talks to the auth API (auth-core or BFF) using a **single base URL and version**. Paths are stored in config; you set base URL and version on a **global API instance** (e.g. `$fetch` baseURL or axios instance), then use only the **path** from config.

### Config: `config/apiRoutes.json`

- **Auth routes only** (no health or root routes). Nested by auth method:
  - `auth.email_password`: login, logout, refresh, me
  - `auth.email_otp`: send, verify
  - `auth.magic_link`: send, verify
- Top-level:
  - **baseUrlFromEnv**: env variable name for the API origin (e.g. `NUXT_PUBLIC_AUTH_API_URL`).
  - **apiVersion**: e.g. `v1`.
  - **versionedPrefix**: path segment for versioning (e.g. `/api/v1`).

Each route is stored as a **path string** (e.g. `auth/email/login`). No base URL in the JSON.

### Global API instance

Set **base URL** and **version** once on your HTTP client so every request uses them.

**Effective base URL for requests:**

```text
baseURL = baseUrl + versionedPrefix
```

Example: `http://localhost:5001` + `/api/v1` → `http://localhost:5001/api/v1`.  
So a path `auth/email/login` becomes `http://localhost:5001/api/v1/auth/email/login`.

**Where to set it:**

- **Nuxt `$fetch` / `useFetch`**: Set `baseURL` in a Nuxt plugin or in the call (e.g. from `useRuntimeConfig().public.authApiUrl` + `versionedPrefix` from config).
- **Axios**: Create a single axios instance with `baseURL: baseUrl + versionedPrefix`, use that instance for all auth API calls.
- **BFF (server)**: When the server calls auth-core, use the same idea: base URL from env + `versionedPrefix` + path from `apiRoutes.json`.

### Using paths from config

- **Helper**: `getPath("auth", "email_password", "login")` → `"auth/email/login"`.
- **Direct**: `apiRoutesConfig.auth.email_password.login` → `"auth/email/login"`.

Use the path with your global instance (no base URL in the path).

**Example with Nuxt `$fetch`:**

```ts
// In a plugin or composable: get base URL from runtime config
const config = useRuntimeConfig();
const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
const versionedPrefix = apiRoutesConfig.versionedPrefix; // "/api/v1"
const baseURL = `${baseUrl}${versionedPrefix}`;

// In auth client service:
const path = getPath("auth", "email_password", "login"); // "auth/email/login"
const res = await $fetch(path, {
  baseURL,
  method: "POST",
  body: { email, password },
});
```

**Example with axios:**

```ts
// Plugin or app setup: create instance once
const config = useRuntimeConfig();
const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
const authApi = axios.create({
  baseURL: `${baseUrl}${apiRoutesConfig.versionedPrefix}`,
});

// In auth client service:
const path = getPath("auth", "email_password", "login");
const { data } = await authApi.post(path, { email, password });
```

### Env and runtime config

- **Env**: Set `NUXT_PUBLIC_AUTH_API_URL` in `.env` (e.g. `http://localhost:5001`). No trailing slash.
- **Nuxt**: `nuxt.config.ts` exposes it as `runtimeConfig.public.authApiUrl` so server and client can use it.

### Adding new auth routes

1. Add the path under the right method in `config/apiRoutes.json` (e.g. under `auth.phone_sms_otp` when you add phone OTP).
2. Use `getPath("auth", "phone_sms_otp", "send")` or the direct config in your service.
3. No need to change the global instance; only paths and env may change.

### Summary

| Concern            | Where                                      |
|--------------------|--------------------------------------------|
| Base URL           | Env `NUXT_PUBLIC_AUTH_API_URL` / runtimeConfig |
| Version prefix     | `config/apiRoutes.json` → `versionedPrefix`   |
| Global API baseURL | baseUrl + versionedPrefix (plugin or axios)   |
| Request path       | `getPath("auth", method, action)` or config  |

Keep base URL and version in one place (global instance); keep paths in `apiRoutes.json` and use them via `getPath` or direct config.
