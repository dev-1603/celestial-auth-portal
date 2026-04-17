/**
 * VerificationCode Repository Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createVerificationCode,
  findActiveVerificationCode,
  markVerificationCodeAsUsed,
  incrementVerificationCodeAttempts,
  hashVerificationCode,
  verifyVerificationCode,
  deleteExpiredVerificationCodes,
  findVerificationCodeById,
  type CreateVerificationCodeInput,
} from '../verification-code.repository'
import { prisma } from '../../lib/prisma'

vi.mock('../../lib/prisma', () => ({
  prisma: {
    verificationCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

const mockedPrisma = prisma as unknown as {
  verificationCode: {
    create: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
}

describe('verification-code.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createVerificationCode', () => {
    it('creates verification code with given data', async () => {
      const input: CreateVerificationCodeInput = {
        channel: 'email',
        target: 'user@example.com',
        codeHash: 'hashed-code',
        purpose: 'login',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }

      const created = {
        id: 'code-1',
        ...input,
        used: false,
        attempts: 0,
        userId: null,
        createdAt: new Date(),
      }

      mockedPrisma.verificationCode.create.mockResolvedValueOnce(created)

      const result = await createVerificationCode(input)

      expect(mockedPrisma.verificationCode.create).toHaveBeenCalledWith({
        data: {
          channel: 'email',
          target: 'user@example.com',
          codeHash: 'hashed-code',
          purpose: 'login',
          expiresAt: input.expiresAt,
          userId: null,
          used: false,
          attempts: 0,
        },
      })
      expect(result).toBe(created)
    })
  })

  describe('findActiveVerificationCode', () => {
    it('returns most recent unused, non-expired code', async () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

      const code = {
        id: 'code-1',
        channel: 'email',
        target: 'user@example.com',
        codeHash: 'hashed',
        purpose: 'login',
        expiresAt,
        used: false,
        attempts: 0,
        userId: null,
        createdAt: now,
      }

      mockedPrisma.verificationCode.findFirst.mockResolvedValueOnce(code)

      const result = await findActiveVerificationCode('email', 'user@example.com', 'login')

      expect(mockedPrisma.verificationCode.findFirst).toHaveBeenCalledWith({
        where: {
          channel: 'email',
          target: 'user@example.com',
          purpose: 'login',
          used: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      expect(result).toBe(code)
    })

    it('returns null when no active code found', async () => {
      mockedPrisma.verificationCode.findFirst.mockResolvedValueOnce(null)

      const result = await findActiveVerificationCode('email', 'user@example.com', 'login')

      expect(result).toBeNull()
    })
  })

  describe('markVerificationCodeAsUsed', () => {
    it('marks code as used', async () => {
      mockedPrisma.verificationCode.update.mockResolvedValueOnce({} as any)

      await markVerificationCodeAsUsed('code-1')

      expect(mockedPrisma.verificationCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { used: true },
      })
    })
  })

  describe('incrementVerificationCodeAttempts', () => {
    it('increments attempt count', async () => {
      mockedPrisma.verificationCode.update.mockResolvedValueOnce({} as any)

      await incrementVerificationCodeAttempts('code-1')

      expect(mockedPrisma.verificationCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: {
          attempts: {
            increment: 1,
          },
        },
      })
    })
  })

  describe('hashVerificationCode and verifyVerificationCode', () => {
    it('hashes and verifies code correctly', async () => {
      const code = '123456'
      const hash = await hashVerificationCode(code)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(code) // Should be hashed

      const isValid = await verifyVerificationCode(code, hash)
      expect(isValid).toBe(true)

      const isInvalid = await verifyVerificationCode('wrong', hash)
      expect(isInvalid).toBe(false)
    })
  })

  describe('deleteExpiredVerificationCodes', () => {
    it('deletes expired codes and returns count', async () => {
      mockedPrisma.verificationCode.deleteMany.mockResolvedValueOnce({ count: 5 })

      const result = await deleteExpiredVerificationCodes()

      expect(mockedPrisma.verificationCode.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
      expect(result).toBe(5)
    })
  })

  describe('findVerificationCodeById', () => {
    it('finds code by ID', async () => {
      const code = {
        id: 'code-1',
        channel: 'email',
        target: 'user@example.com',
        codeHash: 'hashed',
        purpose: 'login',
        expiresAt: new Date(),
        used: false,
        attempts: 0,
        userId: null,
        createdAt: new Date(),
      }

      mockedPrisma.verificationCode.findUnique.mockResolvedValueOnce(code)

      const result = await findVerificationCodeById('code-1')

      expect(mockedPrisma.verificationCode.findUnique).toHaveBeenCalledWith({
        where: { id: 'code-1' },
      })
      expect(result).toBe(code)
    })
  })
})
