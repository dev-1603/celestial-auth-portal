/**
 * BFF request headers for backend calls.
 * Adds X-Correlation-ID, X-Platform-ID, X-Source-Type, X-Tenant-ID, optionally Authorization.
 */

import type { H3Event } from 'h3';

export type BackendHeaderOptions = {
  authenticated?: boolean;
  tenantId?: string;
};

/** Build headers for BFF → Backend requests */
export function buildBackendHeaders(event: H3Event, options: BackendHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': crypto.randomUUID(),
    'X-Platform-ID': 'celestial-auth-web',
    'X-Source-Type': 'bff-portal',
  };

  if (options.authenticated) {
    const auth = getHeader(event, 'authorization');
    if (auth) headers['Authorization'] = auth;
  }

  if (options.tenantId) {
    headers['X-Tenant-ID'] = options.tenantId;
  }

  return headers;
}
