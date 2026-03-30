/**
 * Server middleware: restore session on app load to prevent client-side flicker.
 * If the refresh_token cookie is present, pre-fetch the user session and populate
 * event.context for the auth hydration plugin. Forwards Set-Cookie from BFF refresh
 * (including BFF session) to the page response.
 */

import type { AuthUser } from "~/stores/authStore";

const REFRESH_COOKIE_NAME = "celestial_refresh_token";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (path.startsWith("/api/") || path.startsWith("/_nuxt/")) {
    return;
  }

  const cookieHeader = getHeader(event, "cookie") ?? "";
  const hasRefreshToken = cookieHeader.includes(`${REFRESH_COOKIE_NAME}=`);

  if (!hasRefreshToken) {
    return;
  }

  try {
    const baseUrl = getRequestURL(event).origin;
    const url = `${baseUrl}/api/auth/email-password/refresh`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({}),
    });

    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie")
          ? [res.headers.get("set-cookie") as string]
          : [];

    for (const c of setCookies) {
      if (c) appendHeader(event, "set-cookie", c);
    }

    const data = (await res.json().catch(() => ({}))) as { user?: AuthUser };

    if (res.ok && data?.user) {
      event.context.authRestore = {
        user: data.user,
      };
    }
  } catch {
    // Refresh failed – no restore
  }
});
