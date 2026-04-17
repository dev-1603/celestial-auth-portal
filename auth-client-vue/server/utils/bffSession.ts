/**
 * BFF-only access token storage: opaque session id in HttpOnly cookie,
 * JWT in Nitro storage. Never expose access token in JSON to the browser.
 */

import type { H3Event } from "h3";
import { deleteCookie, getCookie, setCookie } from "h3";

export const BFF_SESSION_COOKIE = "celestial_bff_session";
const STORAGE_KEY_PREFIX = "bff:sess:";

function getSessionStorage() {
  return useStorage("bffSessions");
}

export function extractAccessToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const a = o.accessToken ?? o.access_token;
  return typeof a === "string" && a.length > 0 ? a : null;
}

export function stripTokensFromPublicResponse<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>;
  delete out.accessToken;
  delete out.access_token;
  delete out.refreshToken;
  delete out.refresh_token;
  return out as T;
}

/** Save new BFF session and HttpOnly cookie (replaces any existing session). */
export async function persistAccessToken(event: H3Event, accessToken: string): Promise<void> {
  await clearBffSession(event);
  const sessionId = crypto.randomUUID();
  const storage = getSessionStorage();
  await storage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify({ accessToken }));

  setCookie(event, BFF_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Update stored access token for current session (e.g. after refresh). */
export async function updateSessionAccessToken(event: H3Event, accessToken: string): Promise<void> {
  const sessionId = getCookie(event, BFF_SESSION_COOKIE);
  const storage = getSessionStorage();
  if (sessionId) {
    await storage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify({ accessToken }));
    return;
  }
  await persistAccessToken(event, accessToken);
}

export async function getBffSessionAccessToken(event: H3Event): Promise<string | null> {
  const sessionId = getCookie(event, BFF_SESSION_COOKIE);
  if (!sessionId) return null;
  const storage = getSessionStorage();
  const raw = await storage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
  if (raw == null) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return typeof (parsed as { accessToken?: string }).accessToken === "string"
      ? (parsed as { accessToken: string }).accessToken
      : null;
  } catch {
    return null;
  }
}

export async function clearBffSession(event: H3Event): Promise<void> {
  const sessionId = getCookie(event, BFF_SESSION_COOKIE);
  if (sessionId) {
    await getSessionStorage().removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
  }
  deleteCookie(event, BFF_SESSION_COOKIE, { path: "/" });
}

/**
 * Persist access token from backend JSON, strip secrets from payload returned to the client.
 * @param mode - `login` always creates a new session; `refresh` updates token for existing session when cookie present.
 */
export async function finalizeAuthResponseForClient(
  event: H3Event,
  data: Record<string, unknown>,
  mode: "login" | "refresh" | "default" = "default",
): Promise<Record<string, unknown>> {
  const token = extractAccessToken(data);
  const cleaned = stripTokensFromPublicResponse({ ...data });
  if (!token) return cleaned;

  if (mode === "refresh") {
    await updateSessionAccessToken(event, token);
  } else if (mode === "login") {
    await persistAccessToken(event, token);
  } else {
    await persistAccessToken(event, token);
  }
  return cleaned;
}
