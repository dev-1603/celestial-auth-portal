/**
 * OAuth Callback Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env config
vi.mock('../../../../config/env.config', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    DIRECT_URL: 'postgresql://test',
    NODE_ENV: 'test',
    API_URL: 'http://localhost:5001',
    PORT: '5001',
  },
}))

// Mock prisma
vi.mock('../../../../lib/prisma', () => ({
  prisma: {},
}))

// Mock auth-config.loader
vi.mock('../../../../config/auth-config.loader', () => ({
  isMethodEnabled: vi.fn(),
  getOAuthProviderConfig: vi.fn(),
  getMethodConfig: vi.fn(),
  getAuthConfig: vi.fn(),
  getEnabledOAuthProviders: vi.fn(() => []),
  getEnabledSSOProviders: vi.fn(() => []),
  getSSOProviderConfig: vi.fn(),
  clearAuthConfigCache: vi.fn(),
  authConfig: {},
}))

// Mock oauth service
vi.mock('../../../../services/oauth.service', () => ({
  handleOAuthCallback: vi.fn(),
}))

import { handleOAuthCallback } from '../callback.handler'
import * as authConfig from '../../../../config/auth-config.loader'
import * as oauthService from '../../../../services/oauth.service'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as userRepo from '../../../../repositories/user.repository'
import * as tokenService from '../../../../services/token.service'

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.redirect = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  res.clearCookie = vi.fn().mockReturnValue(res)
  return res
}

describe('handleOAuthCallback', () => {
  const isMethodEnabled = vi.spyOn(authConfig, 'isMethodEnabled')
  const getOAuthProviderConfig = vi.spyOn(authConfig, 'getOAuthProviderConfig')
  const getMethodConfig = vi.spyOn(authConfig, 'getMethodConfig')
  const handleOAuthCallbackService = vi.spyOn(oauthService, 'handleOAuthCallback')
  const findAuthIdentityByProvider = vi.spyOn(authIdentityRepo, 'findAuthIdentityByProvider')
  const findAuthIdentityWithUser = vi.spyOn(authIdentityRepo, 'findAuthIdentityWithUser')
  const createAuthIdentity = vi.spyOn(authIdentityRepo, 'createAuthIdentity')
  const findGlobalUserByEmail = vi.spyOn(userRepo, 'findGlobalUserByEmail')
  const createGlobalUser = vi.spyOn(userRepo, 'createGlobalUser')
  const findTenantUserLink = vi.spyOn(userRepo, 'findTenantUserLink')
  const buildLoginTokens = vi.spyOn(tokenService, 'buildLoginTokens')

  beforeEach(() => {
    vi.resetAllMocks()
    isMethodEnabled.mockReturnValue(true)
    getMethodConfig.mockReturnValue({ allowSignup: true, allowLinking: true })
  })

  it('returns 403 when oauth is disabled', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'state123' }, cookies: { oauth_state: 'state123' } }
    const res = createMockRes()

    isMethodEnabled.mockReturnValue(false)

    await handleOAuthCallback(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when OAuth error is present', async () => {
    const req: any = { params: { provider: 'google' }, query: { error: 'access_denied' }, cookies: {} }
    const res = createMockRes()

    await handleOAuthCallback(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'OAuth error: access_denied' })
  })

  it('returns 400 when code is missing', async () => {
    const req: any = { params: { provider: 'google' }, query: { state: 'state123' }, cookies: { oauth_state: 'state123' } }
    const res = createMockRes()

    await handleOAuthCallback(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization code is required' })
  })

  it('returns 400 when state is invalid', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'wrong-state' }, cookies: { oauth_state: 'correct-state' } }
    const res = createMockRes()

    await handleOAuthCallback(req, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid state parameter. Possible CSRF attack.' })
  })

  it('logs in existing OAuth user', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'state123' }, cookies: { oauth_state: 'state123' } }
    const res = createMockRes()
    const next = vi.fn()

    getOAuthProviderConfig.mockReturnValueOnce({ id: 'google', enabled: true })
    handleOAuthCallbackService.mockResolvedValueOnce({
      providerId: 'google',
      providerUserId: 'google-sub-123',
      email: 'user@example.com',
      displayName: 'Test User',
    })
    // First call: check if AuthIdentity exists
    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
    } as any)
    // Second call: get AuthIdentity with user
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'google',
      providerUserId: 'google-sub-123',
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

    await handleOAuthCallback(req, res, next)

    expect(res.clearCookie).toHaveBeenCalledWith('oauth_state')
    expect(findAuthIdentityWithUser).toHaveBeenCalledWith('google', 'google-sub-123')
    expect(buildLoginTokens).toHaveBeenCalled()
    expect(res.cookie).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  it('links OAuth account to existing user by email', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'state123' }, cookies: { oauth_state: 'state123' } }
    const res = createMockRes()
    const next = vi.fn()

    getOAuthProviderConfig.mockReturnValueOnce({ id: 'google', enabled: true })
    handleOAuthCallbackService.mockResolvedValueOnce({
      providerId: 'google',
      providerUserId: 'google-sub-123',
      email: 'existing@example.com',
    })
    findAuthIdentityByProvider.mockResolvedValueOnce(null) // No existing OAuth identity
    findGlobalUserByEmail.mockResolvedValueOnce({
      id: 'user-1',
      email: 'existing@example.com',
    } as any)
    createAuthIdentity.mockResolvedValueOnce({} as any)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'google',
      providerUserId: 'google-sub-123',
      user: {
        id: 'user-1',
        email: 'existing@example.com',
        tenantId: 'tenant-1',
        tenantSlug: 'tenant-slug',
      },
    } as any)
    findTenantUserLink.mockResolvedValueOnce(null)
    buildLoginTokens.mockReturnValueOnce({
      accessToken: 'access-token',
      refreshCookie: { name: 'refresh', value: 'token', options: {} },
    })

    await handleOAuthCallback(req, res, next)

    expect(createAuthIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        providerType: 'google',
        providerUserId: 'google-sub-123',
        email: 'existing@example.com',
      }),
    )
    expect(buildLoginTokens).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  it('creates new user for new OAuth account', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'state123' }, cookies: { oauth_state: 'state123' } }
    const res = createMockRes()
    const next = vi.fn()

    getOAuthProviderConfig.mockReturnValueOnce({ id: 'google', enabled: true })
    handleOAuthCallbackService.mockResolvedValueOnce({
      providerId: 'google',
      providerUserId: 'google-sub-123',
      email: 'new@example.com',
      displayName: 'New User',
    })
    findAuthIdentityByProvider.mockResolvedValueOnce(null)
    findGlobalUserByEmail.mockResolvedValueOnce(null) // No existing user
    createGlobalUser.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@example.com',
    } as any)
    createAuthIdentity.mockResolvedValueOnce({} as any)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'google',
      providerUserId: 'google-sub-123',
      user: {
        id: 'user-1',
        email: 'new@example.com',
        tenantId: null,
        tenantSlug: null,
      },
    } as any)
    buildLoginTokens.mockReturnValueOnce({
      accessToken: 'access-token',
      refreshCookie: { name: 'refresh', value: 'token', options: {} },
    })

    await handleOAuthCallback(req, res, next)

    expect(createGlobalUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      passwordHash: null,
    })
    expect(createAuthIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        providerType: 'google',
        providerUserId: 'google-sub-123',
        email: 'new@example.com',
        displayName: 'New User',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  it('redirects when redirect URL is stored in cookie', async () => {
    const req: any = { params: { provider: 'google' }, query: { code: 'code123', state: 'state123' }, cookies: { oauth_state: 'state123', oauth_redirect: 'http://localhost:3000/app' } }
    const res = createMockRes()
    const next = vi.fn()

    getOAuthProviderConfig.mockReturnValueOnce({ id: 'google', enabled: true })
    handleOAuthCallbackService.mockResolvedValueOnce({
      providerId: 'google',
      providerUserId: 'google-sub-123',
      email: 'user@example.com',
    })
    findAuthIdentityByProvider.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
    } as any)
    findAuthIdentityWithUser.mockResolvedValueOnce({
      id: 'identity-1',
      userId: 'user-1',
      providerType: 'google',
      providerUserId: 'google-sub-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        tenantId: null,
        tenantSlug: null,
      },
    } as any)
    findTenantUserLink.mockResolvedValueOnce(null)
    buildLoginTokens.mockReturnValueOnce({
      accessToken: 'access-token',
      refreshCookie: { name: 'refresh', value: 'token', options: {} },
    })

    await handleOAuthCallback(req, res, next)

    expect(res.clearCookie).toHaveBeenCalledWith('oauth_state')
    expect(res.clearCookie).toHaveBeenCalledWith('oauth_redirect')
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/app?token=access-token')
    expect(next).not.toHaveBeenCalled()
  })
})
