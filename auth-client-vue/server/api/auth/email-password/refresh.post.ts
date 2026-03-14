/**
 * BFF: Email/password token refresh. Forwards cookies to auth-core, returns new tokens.
 */

import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "email_password", "refresh");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const cookieHeader = getHeader(event, "cookie");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));

  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Refresh failed";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data;
});
