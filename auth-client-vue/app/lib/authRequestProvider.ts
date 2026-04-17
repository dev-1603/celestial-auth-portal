/**
 * Placeholder for optional client-only auth headers.
 * BFF session uses HttpOnly cookies; no Bearer token is sent from the browser.
 */

export function getAuthRequestOptions(_getToken: () => string | null): { headers: Record<string, string> } {
  return { headers: {} };
}
