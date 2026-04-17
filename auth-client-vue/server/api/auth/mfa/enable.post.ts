/**
 * BFF: MFA enable – forward to auth-core with Bearer from BFF session.
 */

import { getPath } from "~/config/apiRoutes";
import { getBffAuthorizationHeader } from "../../../utils/requestHeaders";

export default defineEventHandler(async (event) => {
  const path = getPath("auth", "mfa", "enable");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/${path}`;

  const authHeaders = await getBffAuthorizationHeader(event);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: (data && data.error) || "MFA enable failed" });
  }
  return data;
});
