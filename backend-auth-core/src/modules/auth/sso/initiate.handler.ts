/**
 * SSO Initiate Handler
 *
 * Initiates the SSO flow by redirecting the user to the appropriate Identity
 * Provider. Supports both SAML and OIDC provider types.
 *
 * Flow:
 * 1. Validate provider param and check SSO is enabled
 * 2. Check provider is enabled in auth.json
 * 3. Generate CSRF state token
 * 4. Store state in httpOnly cookie
 * 5. SAML type  -> redirect to IdP via getSAMLLoginUrl
 *    OIDC types -> redirect via getOIDCAuthorizationUrl
 * 6. Optionally store post-login redirect URL in cookie
 */

import type { Request, Response, NextFunction } from 'express'
import { isMethodEnabled, getSSOProviderConfig } from '../../../config/auth-config.loader'
import {
  generateSSOState,
  getSAMLLoginUrl,
  getOIDCAuthorizationUrl,
} from '../../../services/sso.service'
import { env } from '../../../config/env.config'

export const initiateSSO = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if SSO is enabled
    if (!isMethodEnabled('sso')) {
      res.status(403).json({ error: 'SSO authentication is disabled' })
      return
    }

    const { provider } = req.params
    const { redirect } = req.query

    if (!provider || typeof provider !== 'string') {
      res.status(400).json({ error: 'SSO provider is required' })
      return
    }

    // Check if provider is enabled in auth.json
    const providerConfig = getSSOProviderConfig(provider)
    if (!providerConfig || !providerConfig.enabled) {
      res.status(403).json({ error: `SSO provider '${provider}' is not enabled` })
      return
    }

    // Generate state for CSRF protection
    const state = generateSSOState()

    // Store state in httpOnly cookie (secure in production)
    res.cookie('sso_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      signed: false,
    })

    // Store redirect URL in cookie if provided (for post-login redirect)
    if (redirect && typeof redirect === 'string') {
      res.cookie('sso_redirect', redirect, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
      })
    }

    // Build callback URL
    const baseUrl = env.API_URL || `http://localhost:${env.PORT || 5001}`
    const callbackUrl = `${baseUrl}/api/v1/auth/sso/${provider}/callback`

    // Determine provider type and redirect accordingly
    const providerType = providerConfig.type || provider

    if (providerType === 'saml') {
      // SAML: redirect to IdP login URL
      const loginUrl = await getSAMLLoginUrl(state)
      res.redirect(loginUrl)
    } else if (providerType === 'oidc' || providerType === 'okta' || providerType === 'auth0') {
      // OIDC-based: redirect to authorization URL
      const authUrl = await getOIDCAuthorizationUrl(providerType, callbackUrl, state)
      res.redirect(authUrl)
    } else {
      res.status(400).json({ error: `Unsupported SSO provider type: ${providerType}` })
    }
  } catch (err) {
    next(err)
  }
}
