/**
 * Phone OTP Verify Handler
 * 
 * Verifies an OTP code sent to phone and logs the user in if valid.
 * 
 * Flow:
 * 1. Validate phone and code
 * 2. Normalize phone to E.164 format
 * 3. Find active verification code
 * 4. Verify code hash
 * 5. Check expiry and attempts
 * 6. Mark code as used
 * 7. Find user via AuthIdentity
 * 8. Build JWT tokens and return
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

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  if (cleaned.startsWith('+')) {
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
      return cleaned
    }
  }
  
  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}` // Default to US
  }
  
  return null
}

export const verifyPhoneOTP = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if phone_sms_otp is enabled
    if (!isMethodEnabled('phone_sms_otp')) {
      res.status(403).json({ error: 'Phone OTP authentication is disabled' })
      return
    }

    const { phone, code } = req.body ?? {}

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'OTP code is required' })
      return
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone) {
      res.status(400).json({ 
        error: 'Invalid phone number format. Please provide a valid phone number (E.164 format: +1234567890)' 
      })
      return
    }

    // Get config
    const config = getMethodConfig('phone_sms_otp')
    const maxAttempts = config.maxAttempts || 5

    // Find active verification code
    const verificationCode = await findActiveVerificationCode('phone', normalizedPhone, 'login')

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
    const authIdentity = await findAuthIdentityWithUser('phone', normalizedPhone)

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
