/**
 * MFA Service
 * 
 * Handles Multi-Factor Authentication (MFA) operations:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - QR code generation for authenticator apps
 * - MFA secret management
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { getAuthConfig } from '../config/auth-config.loader'
import { env } from '../config/env.config'

export interface TOTPSecret {
  secret: string
  backupCodes?: string[]
}

export interface TOTPSetupResult {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(userEmail: string, userId: string): TOTPSetupResult {
  const config = getAuthConfig()
  const issuer = env.API_URL ? new URL(env.API_URL).hostname : 'Celestial Auth'
  const accountName = userEmail

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${issuer}:${accountName}`,
    length: 32,
  })

  // Generate backup codes (8 codes, 8 digits each)
  const backupCodes = generateBackupCodes(8)

  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!,
    manualEntryKey: secret.base32!,
    backupCodes,
  }
}

/**
 * Generate QR code data URL for TOTP setup
 */
export async function generateTOTPQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl)
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

/**
 * Verify a TOTP code
 */
export function verifyTOTPCode(secret: string, token: string, window: number = 2): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window, // Allow 2 time steps (60 seconds) of tolerance
    })
  } catch (error) {
    return false
  }
}

/**
 * Verify a backup code and mark it as used
 * Note: In production, backup codes should be hashed and stored in database
 */
export function verifyBackupCode(
  code: string,
  backupCodes: string[],
): { valid: boolean; remainingCodes: string[] } {
  const index = backupCodes.indexOf(code)
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes }
  }

  // Remove used backup code
  const remainingCodes = backupCodes.filter((_, i) => i !== index)
  
  return { valid: true, remainingCodes }
}

/**
 * Generate backup codes for MFA recovery
 */
function generateBackupCodes(count: number, length: number = 8): string[] {
  const codes: string[] = []
  const chars = '0123456789'
  
  for (let i = 0; i < count; i++) {
    let code = ''
    for (let j = 0; j < length; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    codes.push(code)
  }
  
  return codes
}

/**
 * Check if MFA is required for a user
 */
export function isMFARequired(): boolean {
  const config = getAuthConfig()
  return config.mfa?.required === true || config.mfa?.policy === 'required'
}

/**
 * Check if MFA is enabled (optional)
 */
export function isMFAEnabled(): boolean {
  const config = getAuthConfig()
  return config.mfa?.policy !== 'disabled'
}

/**
 * Get enabled MFA methods from config
 */
export function getEnabledMFAMethods(): string[] {
  const config = getAuthConfig()
  return config.mfa?.methods || ['totp', 'sms']
}
