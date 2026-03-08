/**
 * Magic Link Send Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env config
vi.mock('../../../../config/env.config', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    DIRECT_URL: 'postgresql://test',
    NODE_ENV: 'test',
    API_URL: 'http://localhost:5001',
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

import { sendMagicLink } from '../send.handler'
import * as authConfig from '../../../../config/auth-config.loader'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as verificationCodeRepo from '../../../../repositories/verification-code.repository'
import * as emailService from '../../../../services/email.service'

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('sendMagicLink', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const findAuthIdentityByProvider = vi.spyOn(authIdentityRepo, 'findAuthIdentityByProvider')
  const createVerificationCode = vi.spyOn(verificationCodeRepo, 'createVerificationCode')
  const hashVerificationCode = vi.spyOn(verificationCodeRepo, 'hashVerificationCode')
  const sendEmail = vi.spyOn(emailService, 'sendEmail')

  beforeEach(() => {
    vi.resetAllMocks()
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ expiryMinutes: 20, allowedDomains: [] })
  })

  it('returns 403 when magic_link is disabled', async () => {
    const req: any = { body: { email: 'user@example.com' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await sendMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Magic link authentication is disabled' })
  })

  it('returns 400 when email is missing', async () => {
    const req: any = { body: {} }
    const res = createMockRes()

    await sendMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('returns 403 when email domain is not allowed', async () => {
    const req: any = { body: { email: 'user@blocked.com' } }
    const res = createMockRes()

    getMethodConfig.mockReturnValue({ expiryMinutes: 20, allowedDomains: ['example.com'] })

    await sendMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email domain not allowed' })
  })

  it('returns 404 when user not found', async () => {
    const req: any = { body: { email: 'missing@example.com' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce(null)

    await sendMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  it('creates verification code and sends email', async () => {
    const req: any = { body: { email: 'user@example.com' } }
    const res = createMockRes()

    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'email',
      providerUserId: 'user@example.com',
      email: 'user@example.com',
    } as any)

    hashVerificationCode.mockResolvedValueOnce('hashed-token')
    createVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      channel: 'email',
      target: 'user@example.com',
      codeHash: 'hashed-token',
      purpose: 'magic_link',
      expiresAt: new Date(),
      used: false,
      attempts: 0,
      userId: 'user-1',
      createdAt: new Date(),
    })
    sendEmail.mockResolvedValueOnce(undefined)

    await sendMagicLink(req, res, vi.fn())

    expect(findAuthIdentityByProvider).toHaveBeenCalledWith('email', 'user@example.com')
    expect(hashVerificationCode).toHaveBeenCalled()
    expect(createVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        target: 'user@example.com',
        purpose: 'magic_link',
        userId: 'user-1',
      }),
    )
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Your Magic Link',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Magic link sent to email',
    })
  })
})
