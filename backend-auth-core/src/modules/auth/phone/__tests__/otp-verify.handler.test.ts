/**
 * Phone OTP Verify Handler Tests
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

import { verifyPhoneOTP } from '../otp-verify.handler'
import * as authConfig from '../../../../config/auth-config.loader'
import * as verificationCodeRepo from '../../../../repositories/verification-code.repository'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as userRepo from '../../../../repositories/user.repository'
import * as tokenService from '../../../../services/token.service'

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('verifyPhoneOTP', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const findActiveVerificationCode = vi.spyOn(verificationCodeRepo, 'findActiveVerificationCode')
  const verifyVerificationCode = vi.spyOn(verificationCodeRepo, 'verifyVerificationCode')
  const markVerificationCodeAsUsed = vi.spyOn(verificationCodeRepo, 'markVerificationCodeAsUsed')
  const incrementVerificationCodeAttempts = vi.spyOn(
    verificationCodeRepo,
    'incrementVerificationCodeAttempts',
  )
  const findAuthIdentityWithUser = vi.spyOn(authIdentityRepo, 'findAuthIdentityWithUser')
  const findTenantUserLink = vi.spyOn(userRepo, 'findTenantUserLink')
  const buildLoginTokens = vi.spyOn(tokenService, 'buildLoginTokens')

  beforeEach(() => {
    vi.resetAllMocks()
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ digits: 6, expiryMinutes: 10, maxAttempts: 5 })
  })

  it('returns 403 when phone_sms_otp is disabled', async () => {
    const req: any = { body: { phone: '+1234567890', code: '123456' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when phone is missing', async () => {
    const req: any = { body: { code: '123456' } }
    const res = createMockRes()

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Phone number is required' })
  })

  it('returns 400 when code is missing', async () => {
    const req: any = { body: { phone: '+1234567890' } }
    const res = createMockRes()

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'OTP code is required' })
  })

  it('returns 400 when phone format is invalid', async () => {
    const req: any = { body: { phone: 'invalid', code: '123456' } }
    const res = createMockRes()

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Invalid phone number format'),
      }),
    )
  })

  it('normalizes 10-digit US phone number to E.164', async () => {
    const req: any = { body: { phone: '1234567890', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce(null)

    await verifyPhoneOTP(req, res, vi.fn())

    // Should normalize to +11234567890
    expect(findActiveVerificationCode).toHaveBeenCalledWith('phone', '+11234567890', 'login')
  })

  it('returns 401 when verification code not found', async () => {
    const req: any = { body: { phone: '+1234567890', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce(null)

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired OTP code' })
  })

  it('returns 401 when max attempts exceeded', async () => {
    const req: any = { body: { phone: '+1234567890', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      codeHash: 'hashed',
      attempts: 5, // maxAttempts
    } as any)

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Maximum attempts exceeded. Please request a new code.',
    })
  })

  it('returns 401 when code is invalid', async () => {
    const req: any = { body: { phone: '+1234567890', code: 'wrong-code' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      codeHash: 'hashed',
      attempts: 0,
    } as any)
    verifyVerificationCode.mockResolvedValueOnce(false)
    incrementVerificationCodeAttempts.mockResolvedValueOnce(undefined)

    await verifyPhoneOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid OTP code' })
    expect(incrementVerificationCodeAttempts).toHaveBeenCalledWith('code-1')
  })

  it('issues tokens for valid OTP code', async () => {
    const req: any = { body: { phone: '+1234567890', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      codeHash: 'hashed',
      attempts: 0,
    } as any)
    verifyVerificationCode.mockResolvedValueOnce(true)
    markVerificationCodeAsUsed.mockResolvedValueOnce(undefined)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'phone',
      providerUserId: '+1234567890',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        tenantId: 'tenant-1',
        tenantSlug: 'tenant-slug',
      },
    } as any)
    findTenantUserLink.mockResolvedValueOnce(null)
    buildLoginTokens.mockReturnValueOnce({
      accessToken: 'access-token',
      refreshCookie: {
        name: 'celestial_refresh_token',
        value: 'refresh-token',
        options: {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        },
      },
    })

    await verifyPhoneOTP(req, res, vi.fn())

    expect(markVerificationCodeAsUsed).toHaveBeenCalledWith('code-1')
    expect(buildLoginTokens).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'user@example.com',
      tenantId: 'tenant-1',
      tenantSlug: 'tenant-slug',
      role: 'USER',
    })
    expect(res.cookie).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        tenantId: 'tenant-1',
        tenantSlug: 'tenant-slug',
      },
    })
  })
})
