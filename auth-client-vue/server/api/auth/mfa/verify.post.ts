/**
 * BFF: MFA verify (login challenge) – forward to auth-core with Bearer from BFF session.
 */

import { getPath } from "~/config/apiRoutes";
import { getBffAuthorizationHeader } from "../../../utils/requestHeaders";
import { finalizeAuthResponseForClient } from "../../../utils/bffSession";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const path = getPath("auth", "mfa", "verify");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/${path}`;

  const authHeaders = await getBffAuthorizationHeader(event);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body ?? {}),
  });

  const data = await response.json().catch(() => ({}));
  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }
  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: (data && data.error) || "MFA verify failed" });
  }
  return finalizeAuthResponseForClient(event, data as Record<string, unknown>, "default");
});
