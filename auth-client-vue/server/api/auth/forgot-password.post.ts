/**
 * BFF: Request password reset. Sends email to auth-core.
 */

import { forgotPasswordSchema } from "~/schema/zod/authSchemas";
import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  const { email } = parsed.data;
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "email_password", "passwordResetRequest");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Password reset request failed";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data ?? { ok: true };
});
