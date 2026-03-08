/**
 * MFA Verify Handler Tests
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

import type { Request, Response, NextFunction } from 'express'
import { verifyMFA } from '../verify.handler'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as userRepo from '../../../../repositories/user.repository'
import * as mfaService from '../../../../services/mfa.service'
import * as tokenService from '../../../../services/token.service'

vi.mock('../../../../repositories/auth-identity.repository')
vi.mock('../../../../repositories/user.repository')
vi.mock('../../../../services/mfa.service')
vi.mock('../../../../services/token.service')
vi.mock('../../../../config/auth-config.loader', () => ({
  getAuthConfig: vi.fn(() => ({ mfa: { policy: 'optional' } })),
  isMethodEnabled: vi.fn(() => true),
  getMethodConfig: vi.fn(() => ({})),
}))

describe('verifyMFA', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      body: {},
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
    }
    next = vi.fn()
  })

  it('should return 400 if code is missing', async () => {
    req.body = { email: 'user@example.com' }

    await verifyMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA code is required' })
  })

  it('should return 400 if email is missing', async () => {
    req.body = { code: '123456' }

    await verifyMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('should return 404 if auth identity not found', async () => {
    req.body = { code: '123456', email: 'user@example.com' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(null)

    await verifyMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  it('should return 400 if MFA is not enabled', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {},
    }

    req.body = { code: '123456', email: 'user@example.com' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)

    await verifyMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA is not enabled for this account' })
  })

  it('should return 401 if TOTP code is invalid', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: [],
        mfaEnabled: true,
        totpVerified: true,
      },
    }

    req.body = { code: 'invalid', email: 'user@example.com' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.verifyTOTPCode).mockReturnValue(false)
    vi.mocked(mfaService.verifyBackupCode).mockReturnValue({ valid: false, remainingCodes: [] })

    await verifyMFA(req as Request, res as Response, next)

    expect(mfaService.verifyTOTPCode).toHaveBeenCalledWith('secret123', 'invalid')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid MFA code' })
  })

  it('should verify backup code if TOTP fails', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: ['12345678'],
        mfaEnabled: true,
        totpVerified: true,
      },
    }

    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    req.body = { code: '12345678', email: 'user@example.com', userId: 'user123', tenantId: 'tenant123' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.verifyTOTPCode).mockReturnValue(false)
    vi.mocked(mfaService.verifyBackupCode).mockReturnValue({ valid: true, remainingCodes: [] })
    vi.mocked(userRepo.findGlobalUserById).mockResolvedValue(mockUser as any)
    vi.mocked(userRepo.findTenantUserLink).mockResolvedValue(null)
    vi.mocked(authIdentityRepo.updateAuthIdentity).mockResolvedValue({
      ...mockAuthIdentity,
      metadata: { ...mockAuthIdentity.metadata, totpBackupCodes: [] },
    } as any)
    vi.mocked(tokenService.buildLoginTokens).mockReturnValue({
      accessToken: 'access_token',
      refreshCookie: {
        name: 'celestial_refresh_token',
        value: 'refresh_token',
        options: {},
      },
    })

    await verifyMFA(req as Request, res as Response, next)

    expect(mfaService.verifyBackupCode).toHaveBeenCalledWith('12345678', ['12345678'])
    expect(authIdentityRepo.updateAuthIdentity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should issue tokens on successful TOTP verification', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: [],
        mfaEnabled: true,
        totpVerified: true,
      },
    }

    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    req.body = { code: '123456', email: 'user@example.com', userId: 'user123', tenantId: 'tenant123' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.verifyTOTPCode).mockReturnValue(true)
    vi.mocked(userRepo.findGlobalUserById).mockResolvedValue(mockUser as any)
    vi.mocked(userRepo.findTenantUserLink).mockResolvedValue(null)
    vi.mocked(tokenService.buildLoginTokens).mockReturnValue({
      accessToken: 'access_token',
      refreshCookie: {
        name: 'celestial_refresh_token',
        value: 'refresh_token',
        options: {},
      },
    })

    await verifyMFA(req as Request, res as Response, next)

    expect(mfaService.verifyTOTPCode).toHaveBeenCalledWith('secret123', '123456')
    expect(tokenService.buildLoginTokens).toHaveBeenCalled()
    expect(res.cookie).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'access_token',
      user: {
        id: 'user123',
        email: 'user@example.com',
        tenantId: 'tenant123',
      },
    })
  })

  it('should handle errors and call next', async () => {
    const error = new Error('Database error')
    req.body = { code: '123456', email: 'user@example.com' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockRejectedValue(error)

    await verifyMFA(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
