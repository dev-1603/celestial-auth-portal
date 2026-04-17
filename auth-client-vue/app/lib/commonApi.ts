/**
 * Common API instance – single place for all BFF/API requests.
 * Authenticated calls use credentials (BFF session cookie); access JWT is never held in the client.
 * On 401 tries refresh once and retries.
 */

import { getSecurityHeaders } from "./securityHeaders";

export type CommonApiOptions = {
  refresh?: () => Promise<boolean>;
  getContext?: () => { tenantId?: string; userId?: string };
};

let refreshFn: (() => Promise<boolean>) | undefined;
let getContext: (() => { tenantId?: string; userId?: string }) | undefined;

export function initCommonApi(options: CommonApiOptions) {
  refreshFn = options.refresh;
  getContext = options.getContext;
}

export function resetToken() {
  refreshFn = undefined;
  getContext = undefined;
}

export type FetchGetRequestOptions = {
  headers?: Record<string, string>;
  auth?: boolean;
  queryParams?: Record<string, string | number | boolean | undefined>;
  credentials?: RequestCredentials;
};

export type FetchPostRequestOptions = {
  body?: Record<string, unknown> | unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  queryParams?: Record<string, string | number | boolean | undefined>;
  credentials?: RequestCredentials;
};

function buildUrl(url: string, queryParams?: Record<string, string | number | boolean | undefined>): string {
  if (!queryParams || Object.keys(queryParams).length === 0) return url;
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(queryParams)) {
    if (v !== undefined && v !== null) search.set(k, String(v));
  }
  const q = search.toString();
  return q ? `${url}?${q}` : url;
}

function mergeAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const securityHeaders = getSecurityHeaders(getContext?.());
  return { ...securityHeaders, ...headers };
}

async function handleResponseError<T>(err: unknown, retry: () => Promise<T>): Promise<T> {
  const status = (err as { response?: { status?: number }; data?: unknown })?.response?.status;
  if (status === 401 && refreshFn) {
    const ok = await refreshFn();
    if (ok) return retry();
  }
  throw err;
}

/**
 * GET request. When auth=true, sends same-origin credentials (BFF session cookie); on 401 tries refresh once.
 */
export async function fetchGetRequest<T = unknown>(
  url: string,
  options: FetchGetRequestOptions = {},
): Promise<T> {
  const { headers = {}, auth = false, queryParams, credentials: creds } = options;
  const mergedHeaders = auth ? mergeAuthHeaders(headers) : headers;
  const fullUrl = buildUrl(url, queryParams);
  const credentials = creds ?? (auth ? "include" : "omit");

  const doFetch = (h: Record<string, string>) =>
    $fetch<T>(fullUrl, {
      method: "GET",
      headers: h,
      credentials,
    });

  try {
    return await doFetch(mergedHeaders);
  } catch (err) {
    return handleResponseError(err, () => doFetch(auth ? mergeAuthHeaders(headers) : mergedHeaders));
  }
}

/**
 * POST request. When auth=true, sends same-origin credentials; on 401 tries refresh once.
 */
export async function fetchPostRequest<T = unknown>(
  url: string,
  options: FetchPostRequestOptions = {},
): Promise<T> {
  const { body, headers = {}, auth = false, queryParams, credentials: creds } = options;
  const mergedHeaders = auth ? mergeAuthHeaders(headers) : headers;
  const fullUrl = buildUrl(url, queryParams);
  const credentials = creds ?? (auth ? "include" : "omit");

  const doFetch = (h: Record<string, string>) =>
    $fetch<T>(fullUrl, {
      method: "POST",
      body: body ?? {},
      headers: h,
      credentials,
    });

  try {
    return await doFetch(mergedHeaders);
  } catch (err) {
    return handleResponseError(err, () => doFetch(auth ? mergeAuthHeaders(headers) : mergedHeaders));
  }
}
