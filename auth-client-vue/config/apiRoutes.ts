/**
 * Auth API routes – path-only config for use with a global API instance.
 * Set base URL and version (versionedPrefix) on axios/$fetch; use these paths as the request path.
 * Source: backend-auth-core/postman/routes.json (auth routes only).
 */

import routesJson from "./apiRoutes.json";

export type ApiRoutesConfig = {
  baseUrlFromEnv: string;
  apiVersion: string;
  versionedPrefix: string;
  unversioned: {
    root: string;
    health: string;
    healthLive: string;
    healthReady: string;
  };
  auth: {
    email_password: Record<string, string>;
    email_otp: Record<string, string>;
    phone_sms_otp: Record<string, string>;
    oauth: Record<string, string>;
    mfa: Record<string, string>;
    magic_link: Record<string, string>;
  };
};

const config = routesJson as ApiRoutesConfig;

export const apiRoutesConfig = config;

/** Env key for base URL (e.g. NUXT_PUBLIC_AUTH_API_URL). Use in global API instance. */
export const baseUrlEnvKey = config.baseUrlFromEnv;

/** Version prefix for API (e.g. /api/v1). Combine with base URL in global instance. */
export const versionedPrefix = config.versionedPrefix;

/**
 * Get path for an auth route. Use with global API instance (path only).
 * Example: getPath("auth", "email_password", "login") => "auth/email/login"
 */
export function getPath(...keys: string[]): string | undefined {
  if (keys.length < 2) return undefined;
  const [domain, method, ...rest] = keys;
  if (domain !== "auth") return undefined;
  const authMethods = config.auth as Record<string, Record<string, string>>;
  const methodRoutes = authMethods[method];
  if (!methodRoutes) return undefined;
  const key = rest[0];
  if (!key) return undefined;
  return methodRoutes[key];
}

/**
 * Get path with dynamic segments substituted (e.g. :provider => "google").
 * Use for oauth initiate/callback and any route with placeholders.
 */
export function getPathWithParams(
  domain: string,
  method: string,
  action: string,
  params: Record<string, string>
): string | undefined {
  const path = getPath(domain, method, action);
  if (!path) return undefined;
  let out = path;
  for (const [key, value] of Object.entries(params)) {
    out = out.replace(new RegExp(`:${key}`, "g"), value);
  }
  return out;
}
