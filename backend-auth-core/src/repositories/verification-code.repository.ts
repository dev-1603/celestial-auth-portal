/**
 * VerificationCode Repository
 * 
 * Handles data access for VerificationCode model.
 * Used for OTP codes (email/phone) and magic link tokens.
 */

import { prisma } from '../lib/prisma'
import type { VerificationCode as PrismaVerificationCode } from '@prisma/client'
import { hashPassword, comparePassword } from '../lib/bcrypt'

export type VerificationCode = PrismaVerificationCode

export interface CreateVerificationCodeInput {
  channel: string // "email" | "phone"
  target: string // email address or E.164 phone
  codeHash: string // hashed OTP or token
  purpose: string // "login" | "signup" | "mfa" | "magic_link"
  expiresAt: Date
  userId?: string | null
}

export interface FindVerificationCodeInput {
  channel: string
  target: string
  purpose: string
}

/**
 * Create a new verification code
 * Code should be hashed before calling this function
 */
export const createVerificationCode = async (
  data: CreateVerificationCodeInput,
): Promise<VerificationCode> => {
  return prisma.verificationCode.create({
    data: {
      channel: data.channel,
      target: data.target,
      codeHash: data.codeHash,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
      userId: data.userId ?? null,
      used: false,
      attempts: 0,
    },
  })
}

/**
 * Find the most recent unused verification code for a channel/target/purpose
 * Used for OTP verification
 */
export const findActiveVerificationCode = async (
  channel: string,
  target: string,
  purpose: string,
): Promise<VerificationCode | null> => {
  const now = new Date()

  return prisma.verificationCode.findFirst({
    where: {
      channel,
      target,
      purpose,
      used: false,
      expiresAt: {
        gt: now, // Not expired
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  })
}

/**
 * Mark a verification code as used
 */
export const markVerificationCodeAsUsed = async (id: string): Promise<void> => {
  await prisma.verificationCode.update({
    where: { id },
    data: { used: true },
  })
}

/**
 * Increment attempt count for a verification code
 * Used for rate limiting failed attempts
 */
export const incrementVerificationCodeAttempts = async (id: string): Promise<void> => {
  await prisma.verificationCode.update({
    where: { id },
    data: {
      attempts: {
        increment: 1,
      },
    },
  })
}

/**
 * Hash a verification code/token for storage
 * Uses bcrypt (same as passwords) for consistency
 */
export const hashVerificationCode = async (code: string): Promise<string> => {
  return hashPassword(code)
}

/**
 * Verify a verification code against stored hash
 */
export const verifyVerificationCode = async (
  code: string,
  codeHash: string,
): Promise<boolean> => {
  return comparePassword(code, codeHash)
}

/**
 * Clean up expired verification codes
 * Can be run as a periodic job
 */
export const deleteExpiredVerificationCodes = async (): Promise<number> => {
  const now = new Date()
  const result = await prisma.verificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  })
  return result.count
}

/**
 * Find verification code by ID
 */
export const findVerificationCodeById = async (
  id: string,
): Promise<VerificationCode | null> => {
  return prisma.verificationCode.findUnique({
    where: { id },
  })
}
