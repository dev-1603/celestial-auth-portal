/**
 * MFA Disable Handler
 * 
 * Disables MFA for a user. Requires password verification for security.
 */

import type { Request, Response, NextFunction } from 'express'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { updateAuthIdentity } from '../../../repositories/auth-identity.repository'
import { findGlobalUserByEmail } from '../../../repositories/user.repository'
import { comparePassword } from '../../../lib/bcrypt'
import { authenticate } from '../../../middleware/authenticate'

export const disableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { password } = req.body ?? {}

    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required to disable MFA' })
      return
    }

    // Get user from auth middleware
    const user = (req as any).user
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Verify password
    const dbUser = await findGlobalUserByEmail(user.email)
    if (!dbUser || !dbUser.passwordHash) {
      res.status(404).json({ error: 'User not found or password not set' })
      return
    }

    const isPasswordValid = await comparePassword(password, dbUser.passwordHash)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }

    // Find user's auth identity
    const authIdentity = await findAuthIdentityByProvider('email', user.email)
    if (!authIdentity) {
      res.status(404).json({ error: 'User identity not found' })
      return
    }

    // Check if MFA is enabled
    const metadata = (authIdentity.metadata as any) || {}
    if (!metadata.mfaEnabled) {
      res.status(400).json({ error: 'MFA is not enabled for this account' })
      return
    }

    // Remove MFA data
    const { totpSecret, totpBackupCodes, totpVerified, mfaEnabled, mfaEnabledAt, ...restMetadata } = metadata

    await updateAuthIdentity(authIdentity.id, {
      metadata: restMetadata,
    })

    res.status(200).json({
      message: 'MFA has been successfully disabled for your account',
    })
  } catch (error: any) {
    next(error)
  }
}
