/**
 * BFF: Phone SMS OTP verify – validate code, forward to auth-core, set cookie on success.
 */

import { smsOtpVerifySchema } from "~/schema/zod/authSchemas";
import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = smsOtpVerifySchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  const { phone, code } = parsed.data;
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "phone_sms_otp", "verify");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.headers.get("set-cookie")) {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) setHeader(event, "set-cookie", setCookie);
  }

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Verify OTP failed";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data;
});
