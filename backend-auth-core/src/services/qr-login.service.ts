/**
 * QR Login Service
 *
 * Provides helper functions for QR-based login:
 * - Cryptographically secure session token generation
 * - QR code image generation (data URL)
 * - Session expiry calculation from auth config
 */

import crypto from 'crypto'
import QRCode from 'qrcode'
import { getQRLoginConfig } from '../config/auth-config.loader'

export function generateQRSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function generateQRCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data)
}

export function getQRSessionExpiryDate(): Date {
  const config = getQRLoginConfig()
  const seconds = (config as any).sessionExpirySeconds || 120
  return new Date(Date.now() + seconds * 1000)
}
