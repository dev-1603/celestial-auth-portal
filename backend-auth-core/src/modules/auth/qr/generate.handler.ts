/**
 * QR Login Generate Handler
 *
 * POST /api/v1/auth/qr/generate
 *
 * Creates a new QR login session with a unique session token,
 * generates the QR code data URL, and persists the session in the database.
 * The client displays the QR code for a mobile device to scan.
 *
 * Flow:
 * 1. Verify QR login is enabled in config
 * 2. Generate cryptographic session token
 * 3. Build QR data payload (confirmation URL)
 * 4. Generate QR code image as data URL
 * 5. Persist session in DB with expiry
 * 6. Return sessionId, QR image, and expiry to caller
 */

import type { Request, Response, NextFunction } from 'express'
import { isQRLoginEnabled } from '../../../config/auth-config.loader'
import {
  generateQRSessionToken,
  generateQRCodeDataUrl,
  getQRSessionExpiryDate,
} from '../../../services/qr-login.service'
import { createQrSession } from '../../../repositories/qr-session.repository'
import { resolveServiceUrl } from '../../../utils/serviceUrl'

export const generateQRSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isQRLoginEnabled()) {
      res.status(403).json({ error: 'QR login is disabled' })
      return
    }

    const sessionToken = generateQRSessionToken()

    const apiUrl = resolveServiceUrl({
      SERVICE_URL: process.env.SERVICE_URL,
      PORT: process.env.PORT,
    })
    const qrData = `${apiUrl}/api/v1/auth/qr/confirm?session=${sessionToken}`

    const qrDataUrl = await generateQRCodeDataUrl(qrData)
    const expiresAt = getQRSessionExpiryDate()

    await createQrSession({ sessionToken, qrData, expiresAt })

    res.status(201).json({
      sessionId: sessionToken,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    next(err)
  }
}
