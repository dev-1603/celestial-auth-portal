/**
 * OAuth Callback Handler
 * 
 * Handles OAuth callback from provider, exchanges code for user info, and logs user in.
 * 
 * Flow:
 * 1. Validate state (CSRF protection)
 * 2. Exchange authorization code for access token
 * 3. Get user info from provider
 * 4. Find or create AuthIdentity
 * 5. Find or create user
 * 6. Link accounts if user already exists with different auth method
 * 7. Build JWT tokens and return/redirect
 */

import type { Request, Response, NextFunction } from 'express'
import { isMethodEnabled, getOAuthProviderConfig, getMethodConfig } from '../../../config/auth-config.loader'
import { handleOAuthCallback as handleOAuthCallbackService } from '../../../services/oauth.service'
import {
  findAuthIdentityByProvider,
  createAuthIdentity,
  findAuthIdentityWithUser,
} from '../../../repositories/auth-identity.repository'
import { findGlobalUserByEmail, createGlobalUser } from '../../../repositories/user.repository'
import { findTenantUserLink } from '../../../repositories/user.repository'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload } from '../../../lib/jwt'
import type { GlobalRole } from '../../../lib/jwt'

export const handleOAuthCallback = async (
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
    const { code, state, error } = req.query

    // Handle OAuth errors
    if (error) {
      res.status(400).json({ error: `OAuth error: ${error}` })
      return
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Authorization code is required' })
      return
    }

    // Verify state (CSRF protection)
    const storedState = req.cookies?.oauth_state
    if (!storedState || storedState !== state) {
      res.status(400).json({ error: 'Invalid state parameter. Possible CSRF attack.' })
      return
    }

    // Clear state cookie
    res.clearCookie('oauth_state')

    // Check if provider is enabled
    const providerConfig = getOAuthProviderConfig(provider)
    if (!providerConfig || !providerConfig.enabled) {
      res.status(403).json({ error: `OAuth provider '${provider}' is not enabled` })
      return
    }

    // Build callback URL (must match the one used in initiate)
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
    const callbackUrl = `${baseUrl}/api/v1/auth/oauth/${provider}/callback`

    // Exchange code for user info
    const oauthUserInfo = await handleOAuthCallbackService(provider, code as string, callbackUrl)

    // Find existing AuthIdentity for this OAuth account
    let authIdentity = await findAuthIdentityByProvider(provider, oauthUserInfo.providerUserId)

    // If AuthIdentity exists, get user and log in
    if (authIdentity) {
      const authIdentityWithUser = await findAuthIdentityWithUser(provider, oauthUserInfo.providerUserId)
      if (authIdentityWithUser?.user) {
        const user = authIdentityWithUser.user
        const tenantId = user.tenantId || ''
        const tenantSlug = user.tenantSlug

        // Determine role
        let role: GlobalRole = 'USER'
        if (tenantId) {
          const tenantLink = await findTenantUserLink(user.id, tenantId)
          // Role determination logic can be enhanced here
        }

        // Build JWT payload
        const payload: JWTPayload = {
          userId: user.id,
          tenantId,
          tenantSlug,
          email: user.email,
          role,
        }

        const { accessToken, refreshCookie } = buildLoginTokens(payload)
        res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)

        // Redirect if redirect URL was stored
        const redirectUrl = req.cookies?.oauth_redirect
        if (redirectUrl) {
          res.clearCookie('oauth_redirect')
          res.redirect(`${redirectUrl}?token=${accessToken}`)
        } else {
          res.status(200).json({
            accessToken,
            user: {
              id: user.id,
              email: user.email,
              tenantId,
              tenantSlug,
            },
          })
        }
        return
      }
    }

    // New OAuth account - check if user exists with same email
    const existingUser = await findGlobalUserByEmail(oauthUserInfo.email)

    if (existingUser) {
      // User exists - link OAuth account to existing user
      const config = getMethodConfig('oauth')
      const allowLinking = config.allowLinking !== false // Default to true

      if (!allowLinking) {
        res.status(409).json({
          error: 'An account with this email already exists. Please use a different sign-in method.',
        })
        return
      }

      // Create AuthIdentity for existing user
      await createAuthIdentity({
        userId: existingUser.id,
        providerType: provider,
        providerUserId: oauthUserInfo.providerUserId,
        email: oauthUserInfo.email,
        displayName: oauthUserInfo.displayName,
        metadata: oauthUserInfo.metadata,
      })

      // Get updated auth identity with user
      const authIdentityWithUser = await findAuthIdentityWithUser(provider, oauthUserInfo.providerUserId)
      if (!authIdentityWithUser?.user) {
        res.status(500).json({ error: 'Failed to link OAuth account' })
        return
      }

      const user = authIdentityWithUser.user
      const tenantId = user.tenantId || ''
      const tenantSlug = user.tenantSlug

      let role: GlobalRole = 'USER'
      if (tenantId) {
        const tenantLink = await findTenantUserLink(user.id, tenantId)
      }

      const payload: JWTPayload = {
        userId: user.id,
        tenantId,
        tenantSlug,
        email: user.email,
        role,
      }

      const { accessToken, refreshCookie } = buildLoginTokens(payload)
      res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)

      const redirectUrl = req.cookies?.oauth_redirect
      if (redirectUrl) {
        res.clearCookie('oauth_redirect')
        res.redirect(`${redirectUrl}?token=${accessToken}`)
      } else {
        res.status(200).json({
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            tenantId,
            tenantSlug,
          },
        })
      }
      return
    }

    // New user - create account
    const config = getMethodConfig('oauth')
    const allowSignup = config.allowSignup !== false // Default to true

    if (!allowSignup) {
      res.status(403).json({ error: 'New user signup is not allowed via OAuth' })
      return
    }

    // Create new user (passwordHash is null for OAuth signup)
    const newUser = await createGlobalUser({
      email: oauthUserInfo.email,
      passwordHash: null, // OAuth users don't have passwords
    })

    // Create AuthIdentity
    await createAuthIdentity({
      userId: newUser.id,
      providerType: provider,
      providerUserId: oauthUserInfo.providerUserId,
      email: oauthUserInfo.email,
      displayName: oauthUserInfo.displayName,
      metadata: oauthUserInfo.metadata,
    })

    // Get the newly created auth identity with user
    const authIdentityWithUser = await findAuthIdentityWithUser(provider, oauthUserInfo.providerUserId)
    if (!authIdentityWithUser?.user) {
      res.status(500).json({ error: 'Failed to create user account' })
      return
    }

    const user = authIdentityWithUser.user
    const tenantId = user.tenantId || ''
    const tenantSlug = user.tenantSlug

    let role: GlobalRole = 'USER'

    const payload: JWTPayload = {
      userId: user.id,
      tenantId,
      tenantSlug,
      email: user.email,
      role,
    }

    const { accessToken, refreshCookie } = buildLoginTokens(payload)
    res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)

    const redirectUrl = req.cookies?.oauth_redirect
    if (redirectUrl) {
      res.clearCookie('oauth_redirect')
      res.redirect(`${redirectUrl}?token=${accessToken}`)
    } else {
      res.status(200).json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          tenantId,
          tenantSlug,
        },
      })
    }
  } catch (err) {
    next(err)
  }
}
