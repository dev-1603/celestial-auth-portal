/**
 * QR Login Confirm Handler
 *
 * POST /api/v1/auth/qr/confirm  (requires Bearer token via authenticate middleware)
 *
 * Called by the mobile device after scanning the QR code.
 * The authenticated user's identity is linked to the QR session so that
 * the web client's next status poll will receive login tokens.
 *
 * Flow:
 * 1. Validate sessionId in request body
 * 2. Look up the QR session
 * 3. Verify session is not expired and in a valid state (pending/scanned)
 * 4. Update session status to 'confirmed' with the authenticated user's ID
 */

import type { Request, Response, NextFunction } from 'express'
import {
  findQrSessionByToken,
  updateQrSessionStatus,
} from '../../../repositories/qr-session.repository'

export const confirmQRLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.body ?? {}
    const user = (req as any).user

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const session = await findQrSessionByToken(sessionId)

    if (!session) {
      res.status(404).json({ error: 'QR session not found' })
      return
    }

    if (session.expiresAt < new Date()) {
      res.status(400).json({ error: 'QR session has expired' })
      return
    }

    if (session.status !== 'pending' && session.status !== 'scanned') {
      res.status(400).json({ error: 'QR session already used or expired' })
      return
    }

    await updateQrSessionStatus(sessionId, 'confirmed', user.userId)

    res.status(200).json({ success: true, message: 'QR login confirmed' })
  } catch (err) {
    next(err)
  }
}
