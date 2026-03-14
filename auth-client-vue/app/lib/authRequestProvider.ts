/**
 * Single place for "what to attach to an authenticated request".
 * Today: returns Authorization Bearer if getToken() returns a token.
 * Later (proxy, no token on client): return {}; all API goes via BFF proxy.
 */

export function getAuthRequestOptions(getToken: () => string | null): { headers: Record<string, string> } {
  const token = getToken();
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
}
