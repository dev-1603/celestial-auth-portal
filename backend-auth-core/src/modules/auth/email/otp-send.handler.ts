/**
 * Email OTP Send Handler
 * 
 * Generates and sends an OTP code to the user's email address.
 * The code is hashed and stored in VerificationCode table.
 * 
 * Flow:
 * 1. Validate email
 * 2. Check if email_otp is enabled in config
 * 3. Generate OTP code
 * 4. Hash and store in VerificationCode
 * 5. Send email with OTP (TODO: integrate email service)
 * 6. Return success (don't return the code for security)
 */

import type { Request, Response, NextFunction } from 'express'
import { getMethodConfig, isMethodEnabled } from '../../../config/auth-config.loader'
import {
  createVerificationCode,
  hashVerificationCode,
} from '../../../repositories/verification-code.repository'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { sendEmail } from '../../../services/email.service'

/**
 * Generate a random OTP code
 */
function generateOTP(digits: number): string {
  const min = Math.pow(10, digits - 1)
  const max = Math.pow(10, digits) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

export const sendEmailOTP = async (
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

    const { email } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Get config for email_otp
    const config = getMethodConfig('email_otp')
    const digits = config.digits || 6
    const expiryMinutes = config.expiryMinutes || 10

    // Check if user exists (optional - can allow signup via OTP)
    // For now, require user to exist
    const authIdentity = await findAuthIdentityByProvider('email', email)
    if (!authIdentity) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Generate OTP
    const otpCode = generateOTP(digits)

    // Hash the code
    const codeHash = await hashVerificationCode(otpCode)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    // Store in database
    await createVerificationCode({
      channel: 'email',
      target: email,
      codeHash,
      purpose: 'login',
      expiresAt,
      userId: authIdentity.userId,
    })

    // Send email with OTP
    try {
      await sendEmail({
        to: email,
        subject: 'Your OTP Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your OTP Code</h2>
            <p>Your one-time password (OTP) code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This code will expire in ${expiryMinutes} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        text: `Your OTP code is: ${otpCode}\n\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this code, please ignore this email.`,
      })
    } catch (error: any) {
      // Log error but don't fail the request (OTP is already stored)
      console.error('Failed to send OTP email:', error)
      // In development, still log the code
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${email}: ${otpCode}`)
      }
    }

    // Return success (don't return the code)
    res.status(200).json({
      message: 'OTP sent to email',
      // In development, you might want to return the code for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
    })
  } catch (err) {
    next(err)
  }
}
