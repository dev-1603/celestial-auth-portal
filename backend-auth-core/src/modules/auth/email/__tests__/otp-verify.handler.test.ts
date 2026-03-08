/**
 * Email OTP Verify Handler Tests
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

import { verifyEmailOTP } from '../otp-verify.handler'
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

describe('verifyEmailOTP', () => {
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
    getMethodConfig.mockReturnValue({ maxAttempts: 5 })
  })

  it('returns 403 when email_otp is disabled', async () => {
    const req: any = { body: { email: 'user@example.com', code: '123456' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await verifyEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when email or code is missing', async () => {
    const req: any = { body: { email: 'user@example.com' } }
    const res = createMockRes()

    await verifyEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'OTP code is required' })
  })

  it('returns 401 when verification code not found', async () => {
    const req: any = { body: { email: 'user@example.com', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce(null)

    await verifyEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired OTP code' })
  })

  it('returns 401 when max attempts exceeded', async () => {
    const req: any = { body: { email: 'user@example.com', code: '123456' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      attempts: 5, // maxAttempts
    } as any)

    await verifyEmailOTP(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Maximum attempts exceeded. Please request a new code.',
    })
  })

  it('returns 401 when code is invalid and increments attempts', async () => {
    const req: any = { body: { email: 'user@example.com', code: 'wrong' } }
    const res = createMockRes()
    const next = vi.fn()

    const verificationCode = {
      id: 'code-1',
      attempts: 0,
      codeHash: 'hashed',
    } as any

    findActiveVerificationCode.mockResolvedValueOnce(verificationCode)
    verifyVerificationCode.mockResolvedValueOnce(false)
    incrementVerificationCodeAttempts.mockResolvedValueOnce(undefined)

    await verifyEmailOTP(req, res, next)

    expect(incrementVerificationCodeAttempts).toHaveBeenCalledWith('code-1')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid OTP code' })
    expect(next).not.toHaveBeenCalled() // Should not call next on validation error
  })

  it('issues tokens for valid OTP code', async () => {
    const req: any = { body: { email: 'user@example.com', code: '123456' } }
    const res = createMockRes()
    const next = vi.fn()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      attempts: 0,
      codeHash: 'hashed',
    } as any)
    verifyVerificationCode.mockResolvedValueOnce(true)
    markVerificationCodeAsUsed.mockResolvedValueOnce(undefined)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'email',
      providerUserId: 'user@example.com',
      email: 'user@example.com',
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

    await verifyEmailOTP(req, res, next)

    expect(markVerificationCodeAsUsed).toHaveBeenCalledWith('code-1')
    expect(findAuthIdentityWithUser).toHaveBeenCalledWith('email', 'user@example.com')
    expect(buildLoginTokens).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'user@example.com',
      tenantId: 'tenant-1',
      tenantSlug: 'tenant-slug',
      role: 'USER',
    })
    expect(res.cookie).toHaveBeenCalledWith(
      'celestial_refresh_token',
      'refresh-token',
      expect.any(Object),
    )
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
    expect(next).not.toHaveBeenCalled()
  })
})
