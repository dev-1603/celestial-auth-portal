/**
 * QR Login Status Handler
 *
 * GET /api/v1/auth/qr/status/:sessionId
 *
 * Polls the current status of a QR login session. The web client calls this
 * endpoint repeatedly after displaying a QR code to detect when the mobile
 * device has confirmed the login.
 *
 * Possible statuses returned:
 * - pending   : QR code generated, awaiting scan
 * - scanned   : Mobile device acknowledged the QR code
 * - confirmed : User confirmed login; tokens are issued in the response
 * - expired   : Session TTL elapsed without confirmation
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../../lib/prisma'
import { findQrSessionByToken, updateQrSessionStatus } from '../../../repositories/qr-session.repository'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload, GlobalRole } from '../../../lib/jwt'

export const getQRSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params

    const session = await findQrSessionByToken(sessionId)

    if (!session) {
      res.status(404).json({ error: 'QR session not found' })
      return
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      await updateQrSessionStatus(sessionId, 'expired')
      res.status(200).json({ status: 'expired' })
      return
    }

    // If confirmed and user is attached, issue tokens
    if (session.status === 'confirmed' && session.userId) {
      const user = await prisma.globalUser.findUnique({
        where: { id: session.userId },
        include: {
          memberships: {
            where: { primary: true },
            include: { tenant: { select: { slug: true } } },
            take: 1,
          },
        },
      })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      const primaryMembership = user.memberships[0]
      const tenantId = primaryMembership?.tenantId || ''
      const tenantSlug = primaryMembership?.tenant?.slug

      // Determine role
      let role: GlobalRole = 'USER'
      if (primaryMembership?.isTenantOwner) {
        role = 'OWNER'
      }

      const payload: JWTPayload = {
        userId: user.id,
        tenantId,
        tenantSlug,
        email: user.email,
        role,
      }

      const { accessToken, refreshCookie } = buildLoginTokens(payload)

      res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
      res.status(200).json({
        status: 'confirmed',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          tenantId,
          tenantSlug,
        },
      })
      return
    }

    // Return current status (pending or scanned)
    res.status(200).json({ status: session.status })
  } catch (err) {
    next(err)
  }
}
