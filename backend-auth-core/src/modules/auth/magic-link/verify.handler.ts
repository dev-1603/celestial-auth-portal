/**
 * Magic Link Verify Handler
 * 
 * Verifies a magic link token and logs the user in if valid.
 * 
 * Flow:
 * 1. Validate email and token (from query params or body)
 * 2. Find active verification code (purpose=magic_link)
 * 3. Verify token hash
 * 4. Check expiry
 * 5. Mark code as used
 * 6. Find or create user via AuthIdentity
 * 7. Build JWT tokens and return
 */

import type { Request, Response, NextFunction } from 'express'
import { getMethodConfig, isMethodEnabled } from '../../../config/auth-config.loader'
import {
  findActiveVerificationCode,
  verifyVerificationCode,
  markVerificationCodeAsUsed,
} from '../../../repositories/verification-code.repository'
import { findAuthIdentityWithUser, createAuthIdentity } from '../../../repositories/auth-identity.repository'
import { findTenantUserLink, createGlobalUser } from '../../../repositories/user.repository'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload } from '../../../lib/jwt'
import type { GlobalRole } from '../../../lib/jwt'

export const verifyMagicLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if magic_link is enabled
    if (!isMethodEnabled('magic_link')) {
      res.status(403).json({ error: 'Magic link authentication is disabled' })
      return
    }

    // Accept token and email from query params (GET) or body (POST)
    const token = (req.query.token as string) || req.body?.token
    const email = (req.query.email as string) || req.body?.email

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Magic link token is required' })
      return
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Find active verification code
    const verificationCode = await findActiveVerificationCode('email', email, 'magic_link')

    if (!verificationCode) {
      res.status(401).json({ error: 'Invalid or expired magic link' })
      return
    }

    // Verify token
    const isValid = await verifyVerificationCode(token, verificationCode.codeHash)

    if (!isValid) {
      res.status(401).json({ error: 'Invalid magic link token' })
      return
    }

    // Mark code as used
    await markVerificationCodeAsUsed(verificationCode.id)

    // Find user via AuthIdentity
    let authIdentity = await findAuthIdentityWithUser('email', email)

    // If user doesn't exist and signup is allowed, create user
    if (!authIdentity) {
      const config = getMethodConfig('magic_link')
      const allowSignup = config.allowSignup !== false // Default to true if not specified

      if (!allowSignup) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Create new user
      const newUser = await createGlobalUser({
        email,
        passwordHash: null, // No password for magic link signup
      })

      // Create AuthIdentity
      await createAuthIdentity({
        userId: newUser.id,
        providerType: 'email',
        providerUserId: email,
        email,
      })

      // Get the newly created auth identity with user
      authIdentity = await findAuthIdentityWithUser('email', email)
    }

    if (!authIdentity || !authIdentity.user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = authIdentity.user
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
    
    // For GET requests (browser redirect), can redirect to frontend
    // For POST/API, return JSON
    if (req.method === 'GET' && req.query.redirect) {
      const redirectUrl = req.query.redirect as string
      // Redirect with token in query or set cookie and redirect
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
