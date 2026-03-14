/**
 * BFF: Phone SMS OTP send – validate phone/countryCode, forward to auth-core.
 */

import { smsOtpRequestSchema } from "~/schema/zod/authSchemas";
import { getPath } from "~/config/apiRoutes";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = smsOtpRequestSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  const { phone, countryCode } = parsed.data;
  const config = useRuntimeConfig();
  const baseUrl = (config.public.authApiUrl as string).replace(/\/$/, "");
  const path = getPath("auth", "phone_sms_otp", "send");
  if (!path) throw createError({ statusCode: 500, statusMessage: "Route config missing" });

  const versionedPrefix = "/api/v1";
  const url = `${baseUrl}${versionedPrefix}/${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, countryCode }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && typeof data.error === "string") ? data.error : "Send OTP failed";
    throw createError({ statusCode: response.status, statusMessage: message });
  }

  return data ?? { ok: true };
});
