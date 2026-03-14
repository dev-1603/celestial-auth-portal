/**
 * BFF: Email/password login. Validates body, forwards to auth-core, sets refresh cookie.
 */

import { loginWithPasswordSchema } from "~/schema/zod/authSchemas";
import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = loginWithPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  const { email, password } = parsed.data;
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "email_password", "login");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Login failed";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data;
});
