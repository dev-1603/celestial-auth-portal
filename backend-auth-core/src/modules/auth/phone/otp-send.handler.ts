/**
 * Phone OTP Send Handler
 * 
 * Generates and sends an OTP code to the user's phone number via SMS.
 * The code is hashed and stored in VerificationCode table.
 * 
 * Flow:
 * 1. Validate phone number (E.164 format)
 * 2. Check if phone_sms_otp is enabled in config
 * 3. Generate OTP code
 * 4. Hash and store in VerificationCode
 * 5. Send SMS with OTP
 * 6. Return success (don't return the code for security)
 */

import type { Request, Response, NextFunction } from 'express'
import { getMethodConfig, isMethodEnabled } from '../../../config/auth-config.loader'
import {
  createVerificationCode,
  hashVerificationCode,
} from '../../../repositories/verification-code.repository'
import { findAuthIdentityByProvider } from '../../../repositories/auth-identity.repository'
import { sendSMS } from '../../../services/sms.service'

/**
 * Generate a random OTP code
 */
function generateOTP(digits: number): string {
  const min = Math.pow(10, digits - 1)
  const max = Math.pow(10, digits) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Validate and normalize phone number to E.164 format
 * E.164 format: +[country code][number] (e.g., +1234567890)
 */
function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // If it starts with +, validate it's E.164
  if (cleaned.startsWith('+')) {
    // E.164: + followed by 1-15 digits
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
      return cleaned
    }
  }
  
  // If no +, try to add default country code (US: +1)
  // This is a simple fallback - in production, you might want more sophisticated handling
  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}` // Default to US
  }
  
  return null
}

export const sendPhoneOTP = async (
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

    const { phone } = req.body ?? {}

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone) {
      res.status(400).json({ 
        error: 'Invalid phone number format. Please provide a valid phone number (E.164 format: +1234567890)' 
      })
      return
    }

    // Get config for phone_sms_otp
    const config = getMethodConfig('phone_sms_otp')
    const digits = config.digits || 6
    const expiryMinutes = config.expiryMinutes || 10

    // Check if user exists (optional - can allow signup via OTP)
    // For now, require user to exist
    const authIdentity = await findAuthIdentityByProvider('phone', normalizedPhone)
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
      channel: 'phone',
      target: normalizedPhone,
      codeHash,
      purpose: 'login',
      expiresAt,
      userId: authIdentity.userId,
    })

    // Send SMS with OTP
    try {
      const fromNumber = config.fromNumber || process.env.TWILIO_FROM_NUMBER
      await sendSMS({
        to: normalizedPhone,
        message: `Your OTP code is: ${otpCode}. This code will expire in ${expiryMinutes} minutes.`,
        from: fromNumber,
      })
    } catch (error: any) {
      // Log error but don't fail the request (OTP is already stored)
      console.error('Failed to send OTP SMS:', error)
      // In development, still log the code
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${normalizedPhone}: ${otpCode}`)
      }
    }

    // Return success (don't return the code)
    res.status(200).json({
      message: 'OTP sent to phone',
      // In development, you might want to return the code for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
    })
  } catch (err) {
    next(err)
  }
}
