/**
 * Protocol-agnostic BFF → Backend client.
 * OAuth: BFF does code exchange in Nuxt (oauthBff); backend only receives user info via POST /auth/oauth/session and returns JWT.
 */

import { getPath, getPathWithParams } from '~/config/apiRoutes';
import { buildBackendHeaders } from './requestHeaders';
import { forwardSetCookie } from './responseCookies';
import type { H3Event } from 'h3';

type BackendResponse = {
  accessToken?: string;
  user?: { id: string; email: string; tenantId?: string; tenantSlug?: string; role?: string };
};

export type BackendMeResponse = {
  userId: string;
  email: string;
  tenantId?: string;
  tenantSlug?: string | null;
  role?: string;
  roles?: string[];
  apps?: Array<{
    clientId: string;
    appName: string;
    moduleKey?: string | null;
    moduleName?: string | null;
    appRole?: string | null;
  }>;
  defaultAppClientId?: string | null;
};

type AuthProtocol = 'rest' | 'grpc' | 'trpc';

function getAuthProtocol(): AuthProtocol {
  const config = useRuntimeConfig();
  const protocol = (config.authProtocol as string) || 'rest';
  return protocol === 'grpc' || protocol === 'trpc' ? protocol : 'rest';
}

function getBaseUrl(): string {
  const config = useRuntimeConfig();
  return ((config.public.authApiUrl as string) || 'http://localhost:5001').replace(/\/$/, '');
}

function buildUrl(path: string): string {
  return `${getBaseUrl()}/api/v1/${path}`;
}

function unsupportedProtocol(protocol: AuthProtocol): never {
  throw createError({
    statusCode: 501,
    statusMessage: `Auth protocol "${protocol}" not implemented. Use AUTH_PROTOCOL=rest.`,
  });
}

/** REST strategy implementation */
async function restGetOAuthAuthorizationUrl(
  event: H3Event,
  provider: string,
  state: string,
  _codeChallenge: string,
  redirectUri: string,
): Promise<string> {
  const path = getPathWithParams('auth', 'oauth', 'initiate', { provider });
  if (!path) throw createError({ statusCode: 400, statusMessage: 'Unknown provider' });

  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, {});

  const res = await fetch(url, {
    method: 'GET',
    headers,
    redirect: 'manual',
  });

  const location = res.headers.get('location');
  if (!location) {
    const data = await res.json().catch(() => ({}));
    throw createError({ statusCode: res.status || 500, statusMessage: (data?.error as string) || 'No redirect URL' });
  }

  const parsed = new URL(location);
  parsed.searchParams.set('redirect_uri', redirectUri);
  parsed.searchParams.set('state', state);
  return parsed.toString();
}

/**
 * Get OAuth IdP authorization URL. Delegates to protocol strategy (REST default).
 */
export async function getOAuthAuthorizationUrl(
  event: H3Event,
  provider: string,
  state: string,
  codeChallenge: string,
  redirectUri: string,
): Promise<string> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restGetOAuthAuthorizationUrl(event, provider, state, codeChallenge, redirectUri);
  return unsupportedProtocol(protocol);
}

/** REST strategy implementation */
async function restExchangeOAuthCode(
  event: H3Event,
  payload: { provider: string; code: string; code_verifier: string; redirectUri: string },
): Promise<BackendResponse> {
  const { provider, code, code_verifier, redirectUri } = payload;
  const path = getPathWithParams('auth', 'oauth', 'callback', { provider });
  if (!path) throw createError({ statusCode: 400, statusMessage: 'Unknown provider' });

  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, {});

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.headers.get('set-cookie')) {
    forwardSetCookie(event, res);
  }

  if (!res.ok) {
    const msg = (data?.error as string) || 'OAuth exchange failed';
    throw createError({ statusCode: res.status, statusMessage: msg });
  }

  return data as BackendResponse;
}

/**
 * Exchange OAuth code for tokens. Delegates to protocol strategy (REST default).
 */
export async function exchangeOAuthCode(
  event: H3Event,
  payload: { provider: string; code: string; code_verifier: string; redirectUri: string },
): Promise<BackendResponse> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restExchangeOAuthCode(event, payload);
  return unsupportedProtocol(protocol);
}

/** REST: create session from OAuth user info (BFF flow: Nuxt exchanged code, sends user info). */
async function restCreateOAuthSession(
  event: H3Event,
  payload: { provider: string; providerUserId: string; email: string; displayName?: string; picture?: string },
): Promise<BackendResponse> {
  const path = getPath('auth', 'oauth', 'session');
  if (!path) throw createError({ statusCode: 500, statusMessage: 'Route config missing' });
  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, {});

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.headers.get('set-cookie')) {
      forwardSetCookie(event, res);
    }
    if (!res.ok) {
      const msg = (data?.error as string) || 'OAuth session failed';
      throw createError({ statusCode: res.status, statusMessage: msg });
    }
    return data as BackendResponse;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to reach auth service for OAuth session',
      cause: error,
    });
  }
}

export async function createOAuthSession(
  event: H3Event,
  payload: { provider: string; providerUserId: string; email: string; displayName?: string; picture?: string },
): Promise<BackendResponse> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restCreateOAuthSession(event, payload);
  return unsupportedProtocol(protocol);
}

/** REST strategy implementation */
async function restValidateMagicToken(event: H3Event, payload: { token: string }): Promise<BackendResponse> {
  const path = getPath('auth', 'magic_link', 'verify');
  if (!path) throw createError({ statusCode: 500, statusMessage: 'Route config missing' });

  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, {});

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token: payload.token }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.headers.get('set-cookie')) {
    forwardSetCookie(event, res);
  }

  if (!res.ok) {
    const msg = (data?.error as string) || 'Invalid or expired link';
    throw createError({ statusCode: res.status, statusMessage: msg });
  }

  return data as BackendResponse;
}

/**
 * Validate magic link token with backend. Delegates to protocol strategy.
 */
export async function validateMagicToken(event: H3Event, payload: { token: string }): Promise<BackendResponse> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restValidateMagicToken(event, payload);
  return unsupportedProtocol(protocol);
}

/** REST strategy implementation */
async function restGetProviderConfig(
  event: H3Event,
  tenantId?: string,
): Promise<{ id: string; displayName: string; logo?: string }[]> {
  const path = getPath('auth', 'oauth', 'providers');
  if (!path) return [];

  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, tenantId ? { tenantId } : {});

  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) return [];

  const list = data?.providers;
  return Array.isArray(list) ? list : [];
}

/**
 * Get OAuth/SSO provider config for tenant. Delegates to protocol strategy.
 */
export async function getProviderConfig(
  event: H3Event,
  tenantId?: string,
): Promise<{ id: string; displayName: string; logo?: string }[]> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restGetProviderConfig(event, tenantId);
  return unsupportedProtocol(protocol);
}

/** REST: fetch current authenticated user context from auth-core /me. */
async function restGetCurrentUserContext(event: H3Event): Promise<BackendMeResponse | null> {
  const path = getPath('auth', 'email_password', 'me');
  if (!path) return null;

  const url = buildUrl(path);
  const headers = await buildBackendHeaders(event, { authenticated: true });
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data as BackendMeResponse | null;
}

export async function getCurrentUserContext(event: H3Event): Promise<BackendMeResponse | null> {
  const protocol = getAuthProtocol();
  if (protocol === 'rest') return restGetCurrentUserContext(event);
  return unsupportedProtocol(protocol);
}
