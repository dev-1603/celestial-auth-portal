/**
 * Password Reset Complete Handler
 * 
 * Verifies the password reset token and updates the user's password.
 * 
 * Flow:
 * 1. Validate token and new password
 * 2. Find active password reset token
 * 3. Verify token is valid and not expired
 * 4. Hash new password
 * 5. Update user password
 * 6. Mark token as used
 * 7. Delete all reset tokens for user
 * 8. Return success
 */

import type { Request, Response, NextFunction } from 'express'
import {
  findActivePasswordResetByToken,
  markPasswordResetAsUsed,
  deleteUserPasswordResets,
} from '../../../repositories/password-reset.repository'
import { updateUserPassword } from '../../../repositories/user.repository'
import { hashPassword } from '../../../lib/bcrypt'
import { getAuthConfig } from '../../../config/auth-config.loader'

export const completePasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, email, password } = req.body ?? {}

    // Support both query params (GET) and body (POST)
    const resetToken = token || req.query?.token
    const userEmail = email || req.query?.email
    const newPassword = password || req.body?.password

    if (!resetToken || typeof resetToken !== 'string') {
      res.status(400).json({ error: 'Reset token is required' })
      return
    }

    if (!userEmail || typeof userEmail !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'New password is required' })
      return
    }

    // Validate password policy
    const config = getAuthConfig()
    const passwordPolicy = config.passwordPolicy || {}
    const minLength = passwordPolicy.minLength || 8

    if (newPassword.length < minLength) {
      res.status(400).json({
        error: `Password must be at least ${minLength} characters long`,
      })
      return
    }

    // Check password requirements
    if (passwordPolicy.requireUpper && !/[A-Z]/.test(newPassword)) {
      res.status(400).json({
        error: 'Password must contain at least one uppercase letter',
      })
      return
    }

    if (passwordPolicy.requireLower && !/[a-z]/.test(newPassword)) {
      res.status(400).json({
        error: 'Password must contain at least one lowercase letter',
      })
      return
    }

    if (passwordPolicy.requireNumber && !/[0-9]/.test(newPassword)) {
      res.status(400).json({
        error: 'Password must contain at least one number',
      })
      return
    }

    if (passwordPolicy.requireSpecial && !/[^a-zA-Z0-9]/.test(newPassword)) {
      res.status(400).json({
        error: 'Password must contain at least one special character',
      })
      return
    }

    // Find active password reset token
    const passwordReset = await findActivePasswordResetByToken(resetToken)

    if (!passwordReset) {
      res.status(401).json({
        error: 'Invalid or expired password reset token',
      })
      return
    }

    // Verify email matches
    if (passwordReset.user.email.toLowerCase() !== userEmail.toLowerCase()) {
      res.status(401).json({
        error: 'Email does not match reset token',
      })
      return
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await updateUserPassword(passwordReset.userId, passwordHash)

    // Mark token as used
    await markPasswordResetAsUsed(passwordReset.id)

    // Delete all reset tokens for this user (cleanup)
    await deleteUserPasswordResets(passwordReset.userId)

    // Return success
    res.status(200).json({
      message: 'Password has been reset successfully',
    })
  } catch (error: any) {
    next(error)
  }
}
