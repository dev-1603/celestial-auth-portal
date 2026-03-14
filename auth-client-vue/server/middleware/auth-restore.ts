/**
 * Server middleware: restore session on app load to prevent client-side flicker.
 * If the refresh_token cookie is present, pre-fetch the user session and populate
 * event.context for the auth hydration plugin.
 */

import type { AuthUser } from '~/stores/authStore';

const REFRESH_COOKIE_NAME = 'celestial_refresh_token';

export default defineEventHandler(async (event) => {
  // Only run for page requests (HTML), not for API or asset requests
  const path = getRequestURL(event).pathname;
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/')) {
    return;
  }

  const cookieHeader = getHeader(event, 'cookie') ?? '';
  const hasRefreshToken = cookieHeader.includes(`${REFRESH_COOKIE_NAME}=`);

  if (!hasRefreshToken) {
    return;
  }

  try {
    const baseUrl = getRequestURL(event).origin;
    const response = await $fetch<{ accessToken: string; user: AuthUser }>(
      `${baseUrl}/api/auth/email-password/refresh`,
      {
        method: 'POST',
        headers: cookieHeader ? { cookie: cookieHeader } : {},
      },
    );

    if (response?.accessToken && response?.user) {
      event.context.authRestore = {
        accessToken: response.accessToken,
        user: response.user,
      };
    }
  } catch {
    // Refresh failed (expired token, etc.) – no restore, user remains logged out
  }
});
