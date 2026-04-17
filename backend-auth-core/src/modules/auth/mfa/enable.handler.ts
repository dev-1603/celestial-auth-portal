/**
 * MFA Enable Handler
 * 
 * Generates a TOTP secret and QR code for the user to set up MFA.
 * Stores the secret in AuthIdentity metadata.
 */

import type { Request, Response, NextFunction } from 'express'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { updateAuthIdentity } from '../../../repositories/auth-identity.repository'
import { generateTOTPSecret, generateTOTPQRCode, isMFAEnabled } from '../../../services/mfa.service'
import { authenticate } from '../../../middleware/authenticate'

export const enableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if MFA is enabled in config
    if (!isMFAEnabled()) {
      res.status(403).json({ error: 'MFA is disabled' })
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

    // Check if MFA is already enabled
    const metadata = (authIdentity.metadata as any) || {}
    if (metadata.totpSecret) {
      res.status(400).json({ error: 'MFA is already enabled for this account' })
      return
    }

    // Generate TOTP secret
    const totpSetup = generateTOTPSecret(user.email, user.id)

    // Generate QR code
    const qrCodeDataUrl = await generateTOTPQRCode(totpSetup.qrCodeUrl)

    // Store secret in AuthIdentity metadata (temporarily, until verified)
    // We'll mark it as verified after user confirms setup
    await updateAuthIdentity(authIdentity.id, {
      metadata: {
        ...metadata,
        totpSecret: totpSetup.secret,
        totpBackupCodes: totpSetup.backupCodes,
        totpVerified: false, // Will be set to true after verification
      },
    })

    // Return setup info (secret is included for manual entry)
    res.status(200).json({
      secret: totpSetup.secret,
      qrCode: qrCodeDataUrl,
      manualEntryKey: totpSetup.manualEntryKey,
      backupCodes: totpSetup.backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code to complete setup.',
    })
  } catch (error: any) {
    next(error)
  }
}
