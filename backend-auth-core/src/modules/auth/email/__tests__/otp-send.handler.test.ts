/**
 * Email OTP Send Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env config
vi.mock('../../../../config/env.config', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    DIRECT_URL: 'postgresql://test',
    NODE_ENV: 'test',
  },
}))

// Mock prisma
vi.mock('../../../../lib/prisma', () => ({
  prisma: {},
}))

import { sendEmailOTP } from '../otp-send.handler'
import * as authConfig from '../../../../config/auth-config.loader'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as verificationCodeRepo from '../../../../repositories/verification-code.repository'

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('sendEmailOTP', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const findAuthIdentityByProvider = vi.spyOn(authIdentityRepo, 'findAuthIdentityByProvider')
  const createVerificationCode = vi.spyOn(verificationCodeRepo, 'createVerificationCode')
  const hashVerificationCode = vi.spyOn(verificationCodeRepo, 'hashVerificationCode')

  beforeEach(() => {
    vi.resetAllMocks()
    // Default: method enabled
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ digits: 6, expiryMinutes: 10 })
  })

  it('returns 403 when email_otp is disabled', async () => {
    const req: any = { body: { email: 'user@example.com' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await sendEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email OTP authentication is disabled' })
  })

  it('returns 400 when email is missing', async () => {
    const req: any = { body: {} }
    const res = createMockRes()

    await sendEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('returns 404 when user not found', async () => {
    const req: any = { body: { email: 'missing@example.com' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce(null)

    await sendEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  it('creates verification code and returns success', async () => {
    const req: any = { body: { email: 'user@example.com' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'email',
      providerUserId: 'user@example.com',
      email: 'user@example.com',
    } as any)

    hashVerificationCode.mockResolvedValueOnce('hashed-code')
    createVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      channel: 'email',
      target: 'user@example.com',
      codeHash: 'hashed-code',
      purpose: 'login',
      expiresAt: new Date(),
      used: false,
      attempts: 0,
      userId: 'user-1',
      createdAt: new Date(),
    })

    await sendEmailOTP(req, res, vi.fn())

    expect(findAuthIdentityByProvider).toHaveBeenCalledWith('email', 'user@example.com')
    expect(hashVerificationCode).toHaveBeenCalled()
    expect(createVerificationCode).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP sent to email',
    })
  })
})
