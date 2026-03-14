/**
 * BFF: Magic link verification – validate token with backend, set session cookie, redirect.
 * Intercepts token from email redirect; no sensitive data reaches the client.
 */

import { validateMagicToken } from '../../utils/backendClient';
import { authConfig } from '~/config/authConfig';

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string;

  if (!token?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' });
  }

  await validateMagicToken(event, { token });

  const redirectTo = (authConfig as { redirects?: { afterLogin?: string } }).redirects?.afterLogin ?? '/app';
  return sendRedirect(event, redirectTo, 302);
});
