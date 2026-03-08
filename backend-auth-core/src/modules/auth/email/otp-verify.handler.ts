/**
 * Email OTP Verify Handler
 * 
 * Verifies an OTP code and logs the user in if valid.
 * 
 * Flow:
 * 1. Validate email and code
 * 2. Find active verification code
 * 3. Verify code hash
 * 4. Check expiry and attempts
 * 5. Mark code as used
 * 6. Find user via AuthIdentity
 * 7. Build JWT tokens and return
 */

import type { Request, Response, NextFunction } from 'express'
import { getMethodConfig, isMethodEnabled } from '../../../config/auth-config.loader'
import {
  findActiveVerificationCode,
  verifyVerificationCode,
  markVerificationCodeAsUsed,
  incrementVerificationCodeAttempts,
} from '../../../repositories/verification-code.repository'
import { findAuthIdentityWithUser } from '../../../repositories/auth-identity.repository'
import { findTenantUserLink } from '../../../repositories/user.repository'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload } from '../../../lib/jwt'
import type { GlobalRole } from '../../../lib/jwt'

export const verifyEmailOTP = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if email_otp is enabled
    if (!isMethodEnabled('email_otp')) {
      res.status(403).json({ error: 'Email OTP authentication is disabled' })
      return
    }

    const { email, code } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'OTP code is required' })
      return
    }

    // Get config
    const config = getMethodConfig('email_otp')
    const maxAttempts = config.maxAttempts || 5

    // Find active verification code
    const verificationCode = await findActiveVerificationCode('email', email, 'login')

    if (!verificationCode) {
      res.status(401).json({ error: 'Invalid or expired OTP code' })
      return
    }

    // Check attempts
    if (verificationCode.attempts >= maxAttempts) {
      res.status(401).json({ error: 'Maximum attempts exceeded. Please request a new code.' })
      return
    }

    // Verify code
    const isValid = await verifyVerificationCode(code, verificationCode.codeHash)

    if (!isValid) {
      // Increment attempts
      await incrementVerificationCodeAttempts(verificationCode.id)
      res.status(401).json({ error: 'Invalid OTP code' })
      return
    }

    // Mark code as used
    await markVerificationCodeAsUsed(verificationCode.id)

    // Find user via AuthIdentity
    const authIdentity = await findAuthIdentityWithUser('email', email)

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
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        tenantId,
        tenantSlug,
      },
    })
  } catch (err) {
    next(err)
  }
}
