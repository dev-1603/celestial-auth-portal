/**
 * BFF: Email/password signup. Stub – forward to auth-core when backend has register endpoint.
 */

import { signupSchema } from "~/schema/zod/authSchemas";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  // TODO: when backend has auth/email/register, forward and set cookie / return tokens
  throw createError({ statusCode: 501, statusMessage: "Signup not yet configured" });
});
