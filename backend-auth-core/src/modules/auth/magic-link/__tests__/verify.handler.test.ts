/**
 * Magic Link Verify Handler Tests
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

import { verifyMagicLink } from '../verify.handler'
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
  res.redirect = vi.fn().mockReturnValue(res)
  return res
}

describe('verifyMagicLink', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const findActiveVerificationCode = vi.spyOn(verificationCodeRepo, 'findActiveVerificationCode')
  const verifyVerificationCode = vi.spyOn(verificationCodeRepo, 'verifyVerificationCode')
  const markVerificationCodeAsUsed = vi.spyOn(verificationCodeRepo, 'markVerificationCodeAsUsed')
  const findAuthIdentityWithUser = vi.spyOn(authIdentityRepo, 'findAuthIdentityWithUser')
  const findTenantUserLink = vi.spyOn(userRepo, 'findTenantUserLink')
  const buildLoginTokens = vi.spyOn(tokenService, 'buildLoginTokens')

  beforeEach(() => {
    vi.resetAllMocks()
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ expiryMinutes: 20, allowSignup: true })
  })

  it('returns 403 when magic_link is disabled', async () => {
    const req: any = { query: { token: 'token123', email: 'user@example.com' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await verifyMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when token is missing', async () => {
    const req: any = { query: { email: 'user@example.com' } }
    const res = createMockRes()

    await verifyMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Magic link token is required' })
  })

  it('returns 400 when email is missing', async () => {
    const req: any = { query: { token: 'token123' } }
    const res = createMockRes()

    await verifyMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('accepts token and email from body (POST)', async () => {
    const req: any = { method: 'POST', query: {}, body: { token: 'token123', email: 'user@example.com' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce(null)

    await verifyMagicLink(req, res, vi.fn())

    expect(findActiveVerificationCode).toHaveBeenCalledWith('email', 'user@example.com', 'magic_link')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired magic link' })
  })

  it('returns 401 when verification code not found', async () => {
    const req: any = { query: { token: 'token123', email: 'user@example.com' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce(null)

    await verifyMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired magic link' })
  })

  it('returns 401 when token is invalid', async () => {
    const req: any = { query: { token: 'wrong-token', email: 'user@example.com' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      codeHash: 'hashed',
    } as any)
    verifyVerificationCode.mockResolvedValueOnce(false)

    await verifyMagicLink(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid magic link token' })
  })

  it('issues tokens for valid magic link', async () => {
    const req: any = { query: { token: 'valid-token', email: 'user@example.com' } }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
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

    await verifyMagicLink(req, res, vi.fn())

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

  it('redirects when GET request with redirect query param', async () => {
    const req: any = {
      method: 'GET',
      query: { token: 'valid-token', email: 'user@example.com', redirect: 'http://localhost:3000/app' },
    }
    const res = createMockRes()

    findActiveVerificationCode.mockResolvedValueOnce({
      id: 'code-1',
      codeHash: 'hashed',
    } as any)
    verifyVerificationCode.mockResolvedValueOnce(true)
    markVerificationCodeAsUsed.mockResolvedValueOnce(undefined)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
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
        options: {},
      },
    })

    await verifyMagicLink(req, res, vi.fn())

    expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/app?token=access-token')
  })
})
