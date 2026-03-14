/**
 * BFF: Request access (invite_only signup). Stub – forwards to auth-core when backend has endpoint.
 */

import { signupRequestSchema } from "~/schema/zod/authSchemas";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = signupRequestSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    throw createError({ statusCode: 400, statusMessage: msg });
  }

  // TODO: when backend has request-access endpoint, forward to auth-core
  // For now accept and return ok
  return { ok: true };
});
