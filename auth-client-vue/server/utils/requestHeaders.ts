/**
 * BFF request headers for backend calls.
 * Adds X-Correlation-ID, X-Platform-ID, X-Source-Type, X-Tenant-ID, Authorization from BFF session only.
 */

import type { H3Event } from "h3";
import { getBffSessionAccessToken } from "./bffSession";

export type BackendHeaderOptions = {
  authenticated?: boolean;
  tenantId?: string;
};

/** Build headers for BFF → Backend requests (async: resolves access token from HttpOnly BFF session). */
export async function buildBackendHeaders(
  event: H3Event,
  options: BackendHeaderOptions = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-ID": crypto.randomUUID(),
    "X-Platform-ID": "celestial-auth-web",
    "X-Source-Type": "bff-portal",
  };

  if (options.authenticated) {
    const token = await getBffSessionAccessToken(event);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (options.tenantId) {
    headers["X-Tenant-ID"] = options.tenantId;
  }

  return headers;
}

/** Minimal Authorization header for routes that build fetch manually (e.g. MFA). */
export async function getBffAuthorizationHeader(
  event: H3Event,
): Promise<Record<string, string>> {
  const token = await getBffSessionAccessToken(event);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
