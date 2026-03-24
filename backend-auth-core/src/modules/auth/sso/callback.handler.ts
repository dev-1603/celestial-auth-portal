/**
 * SSO Callback Handler
 *
 * Handles SSO callbacks from Identity Providers (both SAML POST binding and
 * OIDC GET/POST callbacks). Exchanges the response/code for user information,
 * then finds or creates the user account following the same pattern as the
 * OAuth callback handler.
 *
 * Flow:
 * 1. Validate state (CSRF protection)
 * 2. SAML: validateSAMLResponse  /  OIDC: handleOIDCCallback
 * 3. Find or create AuthIdentity
 * 4. Find or create user (link if same email exists)
 * 5. Enforce signupMode (closed / invite_only / open)
 * 6. Build JWT tokens and return or redirect
 */

import type { Request, Response, NextFunction } from 'express'
import {
  getAuthConfig,
  isMethodEnabled,
  getSSOProviderConfig,
  getMethodConfig,
} from '../../../config/auth-config.loader'
import {
  validateSAMLResponse,
  handleOIDCCallback as handleOIDCCallbackService,
} from '../../../services/sso.service'
import type { SSOUserInfo } from '../../../services/sso.service'
import {
  createAuthIdentity,
  findAuthIdentityWithUser,
} from '../../../repositories/auth-identity.repository'
import { findGlobalUserByEmail, createGlobalUser } from '../../../repositories/user.repository'
import { buildLoginTokens } from '../../../services/token.service'
import { prisma } from '../../../lib/prisma'
import type { JWTPayload, GlobalRole } from '../../../lib/jwt'

// ---------------------------------------------------------------------------
// Helpers – token response / redirect (shared by all branches)
// ---------------------------------------------------------------------------

function sendTokenResponse(
  req: Request,
  res: Response,
  accessToken: string,
  user: { id: string; email: string; tenantId: string; tenantSlug?: string },
): void {
  const redirectUrl = req.cookies?.sso_redirect
  if (redirectUrl) {
    res.clearCookie('sso_redirect')
    res.redirect(`${redirectUrl}?token=${accessToken}`)
  } else {
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        tenantSlug: user.tenantSlug,
      },
    })
  }
}

function buildTokensAndRespond(
  req: Request,
  res: Response,
  user: { id: string; email: string; tenantId: string; tenantSlug?: string; role: GlobalRole },
): void {
  const payload: JWTPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
    email: user.email,
    role: user.role,
  }

  const { accessToken, refreshCookie } = buildLoginTokens(payload)
  res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)

  sendTokenResponse(req, res, accessToken, {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
  })
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export const handleSSOCallback = async (
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

    // Validate state (CSRF protection)
    const storedState = req.cookies?.sso_state
    // For SAML POST binding the state comes back as RelayState; for OIDC it is a query param
    const incomingState =
      req.body?.RelayState || req.query?.state || req.body?.state
    if (!storedState || storedState !== incomingState) {
      res.status(400).json({ error: 'Invalid state parameter. Possible CSRF attack.' })
      return
    }

    // Clear state cookie
    res.clearCookie('sso_state')

    // Check if provider is enabled
    const providerConfig = getSSOProviderConfig(provider)
    if (!providerConfig || !providerConfig.enabled) {
      res.status(403).json({ error: `SSO provider '${provider}' is not enabled` })
      return
    }

    const providerType = providerConfig.type || provider

    // Build callback URL (must match the one used in initiate)
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
    const callbackUrl = `${baseUrl}/api/v1/auth/sso/${provider}/callback`

    // -------------------------------------------------------------------
    // Exchange response/code for user info
    // -------------------------------------------------------------------
    let ssoUserInfo: SSOUserInfo

    if (providerType === 'saml') {
      // SAML POST binding: SAMLResponse is in the POST body
      if (!req.body?.SAMLResponse) {
        res.status(400).json({ error: 'SAMLResponse is required' })
        return
      }
      ssoUserInfo = await validateSAMLResponse(req.body, storedState)
    } else if (providerType === 'oidc' || providerType === 'okta' || providerType === 'auth0') {
      // OIDC: authorization code is in query params
      const code = (req.query?.code || req.body?.code) as string | undefined
      const error = req.query?.error || req.body?.error

      if (error) {
        res.status(400).json({ error: `SSO error: ${error}` })
        return
      }
      if (!code) {
        res.status(400).json({ error: 'Authorization code is required' })
        return
      }

      ssoUserInfo = await handleOIDCCallbackService(providerType, code, callbackUrl)
    } else {
      res.status(400).json({ error: `Unsupported SSO provider type: ${providerType}` })
      return
    }

    // Use the provider id from config as the providerType key for AuthIdentity
    const authProviderKey = `sso_${provider}`

    // -------------------------------------------------------------------
    // Find existing AuthIdentity → log in
    // -------------------------------------------------------------------
    const existingIdentity = await findAuthIdentityWithUser(authProviderKey, ssoUserInfo.providerUserId)

    if (existingIdentity?.user) {
      const user = existingIdentity.user

      // Check email verification requirement
      const authConfig = getAuthConfig()
      if (authConfig.requireVerifiedEmail === true && !user.isVerified) {
        res.status(403).json({ error: 'Email not verified. Please verify your email before signing in.' })
        return
      }

      const tenantId = user.tenantId || ''
      const tenantSlug = user.tenantSlug

      // Determine role from already-loaded memberships
      let role: GlobalRole = 'USER'
      if (tenantId) {
        const memberships = (existingIdentity as any).user?.memberships || []
        const tenantLink = memberships.find((m: any) => m.tenantId === tenantId)
        if (tenantLink?.isTenantOwner) {
          role = 'OWNER'
        }
      }

      buildTokensAndRespond(req, res, {
        id: user.id,
        email: user.email,
        tenantId,
        tenantSlug,
        role,
      })
      return
    }

    // -------------------------------------------------------------------
    // No AuthIdentity – check if a user with the same email already exists
    // -------------------------------------------------------------------
    const existingUser = await findGlobalUserByEmail(ssoUserInfo.email)

    if (existingUser) {
      const config = getMethodConfig('sso')
      const allowLinking = config.allowLinking !== false // Default to true

      if (!allowLinking) {
        res.status(409).json({
          error: 'An account with this email already exists. Please use a different sign-in method.',
        })
        return
      }

      // Create AuthIdentity linking SSO to existing user
      await createAuthIdentity({
        userId: existingUser.id,
        providerType: authProviderKey,
        providerUserId: ssoUserInfo.providerUserId,
        authMethodType: 'SSO',
        email: ssoUserInfo.email,
        displayName: ssoUserInfo.displayName,
        metadata: ssoUserInfo.metadata,
      })

      // Re-fetch with user + tenant info
      const linkedIdentity = await findAuthIdentityWithUser(authProviderKey, ssoUserInfo.providerUserId)
      if (!linkedIdentity?.user) {
        res.status(500).json({ error: 'Failed to link SSO account' })
        return
      }

      const user = linkedIdentity.user

      // Check email verification requirement for linked user
      const authConfig = getAuthConfig()
      if (authConfig.requireVerifiedEmail === true && !user.isVerified) {
        res.status(403).json({ error: 'Email not verified. Please verify your email before signing in.' })
        return
      }

      const tenantId = user.tenantId || ''
      const tenantSlug = user.tenantSlug

      let role: GlobalRole = 'USER'
      if (tenantId) {
        const memberships = (linkedIdentity as any).user?.memberships || []
        const tenantLink = memberships.find((m: any) => m.tenantId === tenantId)
        if (tenantLink?.isTenantOwner) {
          role = 'OWNER'
        }
      }

      buildTokensAndRespond(req, res, {
        id: user.id,
        email: user.email,
        tenantId,
        tenantSlug,
        role,
      })
      return
    }

    // -------------------------------------------------------------------
    // New user – enforce signupMode then create
    // -------------------------------------------------------------------
    const authConfig = getAuthConfig()
    const methodConfig = getMethodConfig('sso')
    const allowSignup = methodConfig.allowSignup !== false // Default to true

    const signupMode = authConfig.signupMode || 'open'
    if (signupMode === 'closed') {
      res.status(403).json({ error: 'New user signup is not allowed' })
      return
    }

    if (signupMode === 'invite_only') {
      const invitation = await prisma.invitation.findFirst({
        where: {
          email: ssoUserInfo.email.toLowerCase(),
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      })

      if (!invitation) {
        res.status(403).json({ error: 'Signup requires a valid invitation' })
        return
      }
    }

    if (!allowSignup) {
      res.status(403).json({ error: 'New user signup is not allowed via SSO' })
      return
    }

    // Create new user (no password for SSO users)
    const newUser = await createGlobalUser({
      email: ssoUserInfo.email,
      passwordHash: null,
    })

    // Create AuthIdentity
    await createAuthIdentity({
      userId: newUser.id,
      providerType: authProviderKey,
      providerUserId: ssoUserInfo.providerUserId,
      authMethodType: 'SSO',
      email: ssoUserInfo.email,
      displayName: ssoUserInfo.displayName,
      metadata: ssoUserInfo.metadata,
    })

    // Fetch the newly created identity with user + tenant info
    const newIdentity = await findAuthIdentityWithUser(authProviderKey, ssoUserInfo.providerUserId)
    if (!newIdentity?.user) {
      res.status(500).json({ error: 'Failed to create user account' })
      return
    }

    const user = newIdentity.user
    const tenantId = user.tenantId || ''
    const tenantSlug = user.tenantSlug
    const role: GlobalRole = 'USER'

    buildTokensAndRespond(req, res, {
      id: user.id,
      email: user.email,
      tenantId,
      tenantSlug,
      role,
    })
  } catch (err) {
    next(err)
  }
}
