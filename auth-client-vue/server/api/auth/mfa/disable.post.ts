/**
 * BFF: MFA disable – forward to auth-core with Bearer.
 */

import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");
  const path = getPath("auth", "mfa", "disable");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader ? { authorization: authHeader } : {}) },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: (data && data.error) || "MFA disable failed" });
  }
  return data;
});
