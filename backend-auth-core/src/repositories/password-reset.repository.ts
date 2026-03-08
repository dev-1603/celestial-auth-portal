/**
 * Password Reset Repository
 * 
 * Handles data access for PasswordReset model.
 * Used for password reset token management.
 */

import { prisma } from '../lib/prisma'
import type { PasswordReset as PrismaPasswordReset } from '@prisma/client'

export type PasswordReset = PrismaPasswordReset

export interface CreatePasswordResetInput {
  userId: string
  token: string
  expiresAt: Date
}

/**
 * Create a new password reset token
 */
export const createPasswordReset = async (
  data: CreatePasswordResetInput,
): Promise<PasswordReset> => {
  return prisma.passwordReset.create({
    data: {
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      used: false,
    },
  })
}

/**
 * Find password reset by token
 */
export const findPasswordResetByToken = async (
  token: string,
): Promise<PasswordReset | null> => {
  return prisma.passwordReset.findUnique({
    where: { token },
    include: {
      user: true,
    },
  })
}

/**
 * Find active (unused and not expired) password reset by token
 */
export const findActivePasswordResetByToken = async (
  token: string,
): Promise<PasswordReset | null> => {
  const reset = await findPasswordResetByToken(token)
  
  if (!reset) return null
  
  // Check if expired or used
  if (reset.used || reset.expiresAt < new Date()) {
    return null
  }
  
  return reset
}

/**
 * Mark password reset token as used
 */
export const markPasswordResetAsUsed = async (
  tokenId: string,
): Promise<PasswordReset> => {
  return prisma.passwordReset.update({
    where: { id: tokenId },
    data: { used: true },
  })
}

/**
 * Delete expired password reset tokens (cleanup)
 */
export const deleteExpiredPasswordResets = async (): Promise<number> => {
  const result = await prisma.passwordReset.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  
  return result.count
}

/**
 * Delete all password reset tokens for a user (cleanup after successful reset)
 */
export const deleteUserPasswordResets = async (
  userId: string,
): Promise<number> => {
  const result = await prisma.passwordReset.deleteMany({
    where: { userId },
  })
  
  return result.count
}
