/**
 * MFA Verify Handler
 * 
 * Verifies a TOTP code or backup code during login when MFA is required.
 * This is called after initial authentication (email/password, etc.) if MFA is enabled.
 */

import type { Request, Response, NextFunction } from 'express'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { updateAuthIdentity } from '../../../repositories/auth-identity.repository'
import { verifyTOTPCode, verifyBackupCode } from '../../../services/mfa.service'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload } from '../../../lib/jwt'
import { findGlobalUserById, findTenantUserLink } from '../../../repositories/user.repository'
import type { GlobalRole } from '../../../lib/jwt'

export const verifyMFA = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code, email, userId, tenantId } = req.body ?? {}

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'MFA code is required' })
      return
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Find user's auth identity
    const authIdentity = await findAuthIdentityByProvider('email', email)
    if (!authIdentity) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Check if MFA is enabled
    const metadata = (authIdentity.metadata as any) || {}
    if (!metadata.mfaEnabled || !metadata.totpVerified) {
      res.status(400).json({ error: 'MFA is not enabled for this account' })
      return
    }

    const totpSecret = metadata.totpSecret
    const backupCodes = metadata.totpBackupCodes || []

    // Try TOTP code first
    let isValid = verifyTOTPCode(totpSecret, code)

    // If TOTP fails, try backup code
    if (!isValid && backupCodes.length > 0) {
      const backupResult = verifyBackupCode(code, backupCodes)
      isValid = backupResult.valid

      // If backup code is valid, update stored backup codes
      if (isValid) {
        await updateAuthIdentity(authIdentity.id, {
          metadata: {
            ...metadata,
            totpBackupCodes: backupResult.remainingCodes,
          },
        })
      }
    }

    if (!isValid) {
      res.status(401).json({ error: 'Invalid MFA code' })
      return
    }

    // MFA verified - now issue tokens
    // Rebuild JWT payload (should be passed from login handler)
    const user = await findGlobalUserById(userId || authIdentity.userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Determine role
    const tenantLink = tenantId ? await findTenantUserLink(user.id, tenantId) : null
    let role: GlobalRole = 'USER'
    if ((user as any).isSuperAdmin) {
      role = 'ADMIN'
    } else if (tenantLink?.isTenantOwner) {
      role = 'OWNER'
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      tenantId: tenantId || '',
      role,
    }

    // Issue tokens
    const { accessToken, refreshCookie } = buildLoginTokens(payload)

    res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        tenantId: tenantId || '',
      },
    })
  } catch (error: any) {
    next(error)
  }
}
