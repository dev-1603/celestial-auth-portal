/**
 * Auth-aware fetch using the common API instance.
 * On 401, the common API tries refresh once and retries (see commonApi.ts).
 */

import { fetchGetRequest, fetchPostRequest } from "../lib/commonApi";

type AuthFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined>;
};

export function useAuthFetch() {
  function authFetch<T>(url: string, options: AuthFetchOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, queryParams } = options;
    if (method === "GET") {
      return fetchGetRequest<T>(url, { headers, auth: true, queryParams });
    }
    return fetchPostRequest<T>(url, { body, headers, auth: true, queryParams });
  }

  return { authFetch };
}
