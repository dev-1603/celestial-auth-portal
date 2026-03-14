/**
 * BFF: Magic link consume (GET) – token from query, verify with auth-core via backendClient, set cookie, redirect.
 */

import { validateMagicToken } from "../../../utils/backendClient";
import { authConfig } from "~/config/authConfig";

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string;

  if (!token?.length) {
    throw createError({ statusCode: 400, statusMessage: "Missing token" });
  }

  await validateMagicToken(event, { token });

  const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
  return sendRedirect(event, redirectTo, 302);
});
