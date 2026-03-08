/**
 * Phone OTP Send Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env config
vi.mock('../../../../config/env.config', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    DIRECT_URL: 'postgresql://test',
    NODE_ENV: 'test',
    SMS_PROVIDER: 'console',
  },
}))

// Mock prisma
vi.mock('../../../../lib/prisma', () => ({
  prisma: {},
}))

// Mock auth-config.loader to prevent file system access during tests
vi.mock('../../../../config/auth-config.loader', () => ({
  isMethodEnabled: vi.fn(),
  getMethodConfig: vi.fn(),
  getAuthConfig: vi.fn(),
  getEnabledOAuthProviders: vi.fn(() => []),
  getEnabledSSOProviders: vi.fn(() => []),
  getOAuthProviderConfig: vi.fn(),
  getSSOProviderConfig: vi.fn(),
  clearAuthConfigCache: vi.fn(),
  authConfig: {},
}))

import { sendPhoneOTP } from '../otp-send.handler'
import * as authConfig from '../../../../config/auth-config.loader'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as verificationCodeRepo from '../../../../repositories/verification-code.repository'
import * as smsService from '../../../../services/sms.service'

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('sendPhoneOTP', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const findAuthIdentityByProvider = vi.spyOn(authIdentityRepo, 'findAuthIdentityByProvider')
  const createVerificationCode = vi.spyOn(verificationCodeRepo, 'createVerificationCode')
  const hashVerificationCode = vi.spyOn(verificationCodeRepo, 'hashVerificationCode')
  const sendSMS = vi.spyOn(smsService, 'sendSMS')

  beforeEach(() => {
    vi.resetAllMocks()
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ digits: 6, expiryMinutes: 10, fromNumber: '+1234567890' })
  })

  it('returns 403 when phone_sms_otp is disabled', async () => {
    const req: any = { body: { phone: '+1234567890' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await sendPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Phone OTP authentication is disabled' })
  })

  it('returns 400 when phone is missing', async () => {
    const req: any = { body: {} }
    const res = createMockRes()

    await sendPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Phone number is required' })
  })

  it('returns 400 when phone format is invalid', async () => {
    const req: any = { body: { phone: 'invalid' } }
    const res = createMockRes()

    await sendPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Invalid phone number format'),
      }),
    )
  })

  it('normalizes 10-digit US phone number to E.164', async () => {
    const req: any = { body: { phone: '1234567890' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'phone',
      providerUserId: '+11234567890',
    } as any)

    hashVerificationCode.mockResolvedValueOnce('hashed-code')
    createVerificationCode.mockResolvedValueOnce({} as any)
    sendSMS.mockResolvedValueOnce(undefined)

    await sendPhoneOTP(req, res, vi.fn())

    // Should normalize to +11234567890
    expect(findAuthIdentityByProvider).toHaveBeenCalledWith('phone', '+11234567890')
  })

  it('returns 404 when user not found', async () => {
    const req: any = { body: { phone: '+1234567890' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce(null)

    await sendPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  it('creates verification code and sends SMS', async () => {
    const req: any = { body: { phone: '+1234567890' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'phone',
      providerUserId: '+1234567890',
    } as any)

    hashVerificationCode.mockResolvedValueOnce('hashed-code')
    createVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      channel: 'phone',
      target: '+1234567890',
      codeHash: 'hashed-code',
      purpose: 'login',
      expiresAt: new Date(),
      used: false,
      attempts: 0,
      userId: 'user-1',
      createdAt: new Date(),
    })
    sendSMS.mockResolvedValueOnce(undefined)

    await sendPhoneOTP(req, res, vi.fn())

    expect(findAuthIdentityByProvider).toHaveBeenCalledWith('phone', '+1234567890')
    expect(hashVerificationCode).toHaveBeenCalled()
    expect(createVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'phone',
        target: '+1234567890',
        purpose: 'login',
        userId: 'user-1',
      }),
    )
    expect(sendSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+1234567890',
        message: expect.stringContaining('OTP code'),
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP sent to phone',
    })
  })
})
