/**
 * BFF: OAuth callback – IdP redirects here with code. Exchange with auth-core, set cookie, redirect to afterLogin.
 */

import { getPathWithParams } from "~/config/apiRoutes";
import { authConfig } from "~/config/authConfig";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const provider = query.provider as string;
  const code = query.code as string;
  const state = query.state as string | undefined;

  if (!provider?.length || !code?.length) {
    throw createError({ statusCode: 400, statusMessage: "Missing provider or code" });
  }

  const path = getPathWithParams("auth", "oauth", "callback", { provider });
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }

  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const versionedPrefix = "/api/v1";
  const authCoreUrl = `${baseUrl}${versionedPrefix}/${path}`;

  const searchParams = new URLSearchParams({ code });
  if (state) searchParams.set("state", state);
  const urlWithQuery = `${authCoreUrl}?${searchParams.toString()}`;

  const response = await fetch(urlWithQuery, {
    method: "GET",
    redirect: "manual",
  });

  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }

  const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
  return sendRedirect(event, redirectTo, 302);
});
