/**
 * BFF: Magic link consume (GET) – token from query, verify with auth-core, set cookie, redirect.
 */

import { authConfig } from "~/config/authConfig";
import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token?.length) {
    throw createError({ statusCode: 400, statusMessage: "Missing token" });
  }

  const path = getPath("auth", "magic_link", "verify");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Invalid or expired link";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
  return sendRedirect(event, redirectTo, 302);
});
