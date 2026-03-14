/**
 * BFF: Get current user (me). Forwards Authorization Bearer to auth-core.
 */

import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "email_password", "me");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const authHeader = getHeader(event, "authorization");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Failed to get user";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data;
});
