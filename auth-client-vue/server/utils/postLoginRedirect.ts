import type { H3Event } from 'h3'
import { authConfig } from '~/config/authConfig'
import { getCurrentUserContext } from './backendClient'

/**
 * Post-login redirect policy:
 * - If user has no app access, redirect to configured main-app fallback URL (if present).
 * - Otherwise, send user to the portal dashboard (/app by default).
 */
export async function resolvePostLoginRedirect(event: H3Event): Promise<string> {
  const config = useRuntimeConfig()
  const fallbackUrl = (config.public.mainAppFallbackUrl as string) || ''
  const defaultPortalRoute = (authConfig as { redirects?: { afterLogin?: string } }).redirects?.afterLogin ?? '/app'

  const me = await getCurrentUserContext(event)
  const appCount = Array.isArray(me?.apps) ? me.apps.length : 0

  if (appCount === 0 && fallbackUrl.length > 0) {
    return fallbackUrl
  }

  return defaultPortalRoute
}
