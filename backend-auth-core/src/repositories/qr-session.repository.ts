/**
 * QR Login Session Repository
 *
 * Handles data access for QrLoginSession model.
 * Manages the lifecycle of QR-based login sessions: create, lookup,
 * status transitions, and cleanup of expired sessions.
 */

import { prisma } from '../lib/prisma'

export const createQrSession = async (data: {
  sessionToken: string
  qrData: string
  expiresAt: Date
}) => {
  return prisma.qrLoginSession.create({ data })
}

export const findQrSessionByToken = async (sessionToken: string) => {
  return prisma.qrLoginSession.findUnique({
    where: { sessionToken },
    include: { user: true },
  })
}

export const updateQrSessionStatus = async (
  sessionToken: string,
  status: string,
  userId?: string,
) => {
  return prisma.qrLoginSession.update({
    where: { sessionToken },
    data: { status, ...(userId ? { userId } : {}) },
  })
}

export const deleteExpiredQrSessions = async () => {
  return prisma.qrLoginSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
