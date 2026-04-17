/**
 * Password Reset Request Handler
 * 
 * Generates a password reset token and sends it to the user's email address.
 * The token is stored in PasswordReset table.
 * 
 * Flow:
 * 1. Validate email
 * 2. Find user by email
 * 3. Generate secure token
 * 4. Store token in PasswordReset table
 * 5. Send email with reset link
 * 6. Return success (don't reveal if user exists)
 */

import type { Request, Response, NextFunction } from 'express'
import { findGlobalUserByEmail } from '../../../repositories/user.repository'
import {
  createPasswordReset,
  deleteUserPasswordResets,
} from '../../../repositories/password-reset.repository'
import { sendEmail } from '../../../services/email.service'
import { env } from '../../../config/env.config'
import * as crypto from 'crypto'

/**
 * Generate a secure random token for password reset
 */
function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Find user by email
    const user = await findGlobalUserByEmail(email)
    
    // Don't reveal if user exists (security best practice)
    // Always return success, but only send email if user exists
    if (!user) {
      // Return success to prevent email enumeration
      res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
      return
    }

    // Delete any existing password reset tokens for this user
    await deleteUserPasswordResets(user.id)

    // Generate reset token
    const token = generatePasswordResetToken()

    // Set expiry (default: 1 hour)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Store token
    await createPasswordReset({
      userId: user.id,
      token,
      expiresAt,
    })

    // Build reset URL
    const resetUrl = `${env.API_URL || 'http://localhost:5001'}/api/v1/auth/email/password-reset/verify?token=${token}&email=${encodeURIComponent(email)}`

    // Send email
    const emailSubject = 'Reset Your Password'
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #333; margin-top: 0;">Reset Your Password</h1>
          </div>
          
          <p>Hello,</p>
          
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </body>
      </html>
    `

    const emailText = `
Reset Your Password

We received a request to reset your password. Click the link below to reset it:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `

    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    // Return success (don't reveal if user exists)
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error: any) {
    next(error)
  }
}
