/**
 * MFA Verify Setup Handler
 * 
 * Verifies the TOTP code during MFA setup to confirm the user has configured their authenticator app correctly.
 * Marks MFA as verified and enabled.
 */

import type { Request, Response, NextFunction } from 'express'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { updateAuthIdentity } from '../../../repositories/auth-identity.repository'
import { verifyTOTPCode } from '../../../services/mfa.service'
import { authenticate } from '../../../middleware/authenticate'

export const verifyMFASetup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.body ?? {}

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'TOTP code is required' })
      return
    }

    // Get user from auth middleware
    const user = (req as any).user
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Find user's email auth identity
    const authIdentity = await findAuthIdentityByProvider('email', user.email)
    if (!authIdentity) {
      res.status(404).json({ error: 'User identity not found' })
      return
    }

    // Check if MFA setup is in progress
    const metadata = (authIdentity.metadata as any) || {}
    if (!metadata.totpSecret) {
      res.status(400).json({ error: 'MFA setup not started. Please enable MFA first.' })
      return
    }

    if (metadata.totpVerified) {
      res.status(400).json({ error: 'MFA is already verified and enabled' })
      return
    }

    // Verify TOTP code
    const isValid = verifyTOTPCode(metadata.totpSecret, code)

    if (!isValid) {
      res.status(401).json({ error: 'Invalid TOTP code. Please try again.' })
      return
    }

    // Mark MFA as verified and enabled
    await updateAuthIdentity(authIdentity.id, {
      metadata: {
        ...metadata,
        totpVerified: true,
        mfaEnabled: true,
        mfaEnabledAt: new Date().toISOString(),
      },
    })

    res.status(200).json({
      message: 'MFA has been successfully enabled for your account',
      backupCodes: metadata.totpBackupCodes, // Return backup codes one more time
    })
  } catch (error: any) {
    next(error)
  }
}
