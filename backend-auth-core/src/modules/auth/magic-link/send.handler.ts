/**
 * Magic Link Send Handler
 * 
 * Generates a magic link token and sends it to the user's email address.
 * The token is hashed and stored in VerificationCode table.
 * 
 * Flow:
 * 1. Validate email
 * 2. Check if magic_link is enabled in config
 * 3. Generate secure token
 * 4. Hash and store in VerificationCode (purpose=magic_link)
 * 5. Send email with magic link
 * 6. Return success
 */

import type { Request, Response, NextFunction } from 'express'
import { getMethodConfig, isMethodEnabled } from '../../../config/auth-config.loader'
import {
  createVerificationCode,
  hashVerificationCode,
} from '../../../repositories/verification-code.repository'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { sendEmail } from '../../../services/email.service'
import { env } from '../../../config/env.config'
import { logger } from '../../../lib/logger'
import * as crypto from 'crypto'

/**
 * Generate a secure random token for magic link
 */
function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const sendMagicLink = async (
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

    const { email } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Get config for magic_link
    const config = getMethodConfig('magic_link')
    const expiryMinutes = config.expiryMinutes || 20
    const allowedDomains = config.allowedDomains || []

    // Check domain restriction if configured
    if (allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1]?.toLowerCase()
      if (!emailDomain || !allowedDomains.includes(emailDomain)) {
        res.status(403).json({ error: 'Email domain not allowed' })
        return
      }
    }

    // Check if user exists (optional - can allow signup via magic link)
    // For now, require user to exist
    const authIdentity = await findAuthIdentityByProvider('email', email)
    if (!authIdentity) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Generate magic link token
    const token = generateMagicLinkToken()

    // Hash the token
    const tokenHash = await hashVerificationCode(token)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    // Store in database
    await createVerificationCode({
      channel: 'email',
      target: email,
      codeHash: tokenHash,
      purpose: 'magic_link',
      expiresAt,
      userId: authIdentity.userId,
    })

    // Build magic link URL
    const baseUrl = env.API_URL || 'http://localhost:5001'
    const magicLinkUrl = `${baseUrl}/api/v1/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(email)}`

    // Send email with magic link
    try {
      await sendEmail({
        to: email,
        subject: 'Your Magic Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sign in to your account</h2>
            <p>Click the link below to sign in. This link will expire in ${expiryMinutes} minutes.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${magicLinkUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Sign In
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${magicLinkUrl}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this link, please ignore this email.</p>
          </div>
        `,
        text: `Sign in to your account: ${magicLinkUrl}\n\nThis link will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this link, please ignore this email.`,
      })
    } catch (error: any) {
      logger.error('Failed to send magic link email', { error: error?.message ?? error })
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Magic link for development', { email, magicLinkUrl })
      }
    }

    // Return success (don't return the token in production)
    res.status(200).json({
      message: 'Magic link sent to email',
      // In development, return the link for testing
      ...(process.env.NODE_ENV === 'development' && { magicLink: magicLinkUrl }),
    })
  } catch (err) {
    next(err)
  }
}
