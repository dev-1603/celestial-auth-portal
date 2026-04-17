/**
 * BFF: OAuth initiation – generate state + PKCE, store in auth_handshake cookie, redirect to IdP.
 * OAuth is handled entirely in Nuxt (no backend call); provider secrets in Nuxt .env.
 */

import { generatePKCE } from '../../../../utils/oauthPkce';
import { setHandshakeCookie } from '../../../../utils/handshakeCookie';
import { getBffOAuthAuthorizationUrl } from '../../../../utils/oauthBff';

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider');
  if (!provider?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing provider' });
  }

  const state = crypto.randomUUID();
  const { code_verifier, code_challenge } = generatePKCE();

  const requestUrl = getRequestURL(event);
  const redirectUri = `${requestUrl.origin}/api/auth/callback/${provider}`;

  setHandshakeCookie(event, state, code_verifier);

  const authUrl = getBffOAuthAuthorizationUrl(provider, redirectUri, state, code_challenge);

  return sendRedirect(event, authUrl, 302);
});
