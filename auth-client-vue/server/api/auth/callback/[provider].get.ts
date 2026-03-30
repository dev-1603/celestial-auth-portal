/**
 * BFF: OAuth callback – verify state, exchange code in Nuxt, get user info, create session via backend, redirect.
 * OAuth code exchange is done in Nuxt (oauthBff); backend only receives user info and returns JWT.
 */

import { getAndVerifyHandshake } from '../../../utils/handshakeCookie';
import { exchangeCodeForUserInfo } from '../../../utils/oauthBff';
import { createOAuthSession } from '../../../utils/backendClient';
import { authConfig } from '~/config/authConfig';

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider');
  const query = getQuery(event);
  const code = query.code as string;
  const state = query.state as string;

  if (!provider?.length || !code?.length || !state?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing provider, code, or state' });
  }

  const code_verifier = getAndVerifyHandshake(event, state);
  if (!code_verifier) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired state. Please try again.' });
  }

  const requestUrl = getRequestURL(event);
  const redirectUri = `${requestUrl.origin}/api/auth/callback/${provider}`;

  const userInfo = await exchangeCodeForUserInfo(provider, code, redirectUri, code_verifier);

  const session = await createOAuthSession(event, {
    provider: userInfo.providerId,
    providerUserId: userInfo.providerUserId,
    email: userInfo.email,
    displayName: userInfo.displayName,
    picture: userInfo.picture,
  });

  if (!session?.accessToken || !session?.user) {
    throw createError({ statusCode: 400, statusMessage: 'Failed to create OAuth session' });
  }

  const redirectTo = (authConfig as { redirects?: { afterLogin?: string } }).redirects?.afterLogin ?? '/app';
  // Redirect to /login/callback/[provider] (client-side route) with correct provider param
  return sendRedirect(event, `/login/callback/${provider}`, 302);
  // return sendRedirect(event, redirectTo, 302);
});
