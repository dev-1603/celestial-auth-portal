/**
 * OAuth Initiate Handler
 * 
 * Initiates OAuth flow by redirecting user to OAuth provider.
 * 
 * Flow:
 * 1. Validate provider ID
 * 2. Check if OAuth is enabled and provider is enabled
 * 3. Generate state parameter (CSRF protection)
 * 4. Store state in session/cookie (optional - can use signed cookie)
 * 5. Build authorization URL
 * 6. Redirect to OAuth provider
 */

import type { Request, Response, NextFunction } from 'express'
import { isMethodEnabled, getOAuthProviderConfig, getEnabledOAuthProviders } from '../../../config/auth-config.loader'
import { getOAuthAuthorizationUrl, generateOAuthState } from '../../../services/oauth.service'
import { env } from '../../../config/env.config'

export const initiateOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if OAuth is enabled
    if (!isMethodEnabled('oauth')) {
      res.status(403).json({ error: 'OAuth authentication is disabled' })
      return
    }

    const { provider } = req.params
    const { redirect } = req.query

    if (!provider || typeof provider !== 'string') {
      res.status(400).json({ error: 'OAuth provider is required' })
      return
    }

    // Check if provider is enabled
    const providerConfig = getOAuthProviderConfig(provider)
    if (!providerConfig || !providerConfig.enabled) {
      res.status(403).json({ error: `OAuth provider '${provider}' is not enabled` })
      return
    }

    // Generate state for CSRF protection
    const state = generateOAuthState()

    // Store state in signed cookie (httpOnly, secure in production)
    // This will be verified in the callback
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      signed: false, // Can use signed cookies if cookie-parser is configured with secret
    })

    // Build callback URL
    const baseUrl = env.API_URL || `http://localhost:${env.PORT || 5001}`
    const callbackUrl = `${baseUrl}/api/v1/auth/oauth/${provider}/callback`

    // Build authorization URL
    const authUrl = getOAuthAuthorizationUrl(provider, callbackUrl, state)

    // Store redirect URL in cookie if provided (for post-login redirect)
    if (redirect && typeof redirect === 'string') {
      res.cookie('oauth_redirect', redirect, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
      })
    }

    // Redirect to OAuth provider
    res.redirect(authUrl)
  } catch (err) {
    next(err)
  }
}

/**
 * Get list of enabled OAuth providers
 */
export const getOAuthProviders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isMethodEnabled('oauth')) {
      res.status(403).json({ error: 'OAuth authentication is disabled' })
      return
    }

    const providers = getEnabledOAuthProviders()

    res.status(200).json({
      providers: providers.map((p) => ({
        id: p.id,
        displayName: p.displayName || p.id,
        logo: p.logo,
        buttonVariant: p.buttonVariant,
      })),
    })
  } catch (err) {
    next(err)
  }
}
