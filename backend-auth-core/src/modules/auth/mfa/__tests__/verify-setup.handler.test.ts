/**
 * MFA Verify Setup Handler Tests
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
import { verifyMFASetup } from '../verify-setup.handler'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as mfaService from '../../../../services/mfa.service'

vi.mock('../../../../repositories/auth-identity.repository')
vi.mock('../../../../services/mfa.service')
vi.mock('../../../../middleware/authenticate', () => ({
  authenticate: vi.fn((req, res, next) => next()),
}))
vi.mock('../../../../config/auth-config.loader', () => ({
  getAuthConfig: vi.fn(() => ({ mfa: { policy: 'optional' } })),
  isMethodEnabled: vi.fn(() => true),
  getMethodConfig: vi.fn(() => ({})),
}))

describe('verifyMFASetup', () => {
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
    }
    next = vi.fn()
    ;(req as any).user = {
      id: 'user123',
      email: 'user@example.com',
    }
  })

  it('should return 400 if code is missing', async () => {
    req.body = {}

    await verifyMFASetup(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'TOTP code is required' })
  })

  it('should return 401 if user is not authenticated', async () => {
    req.body = { code: '123456' }
    ;(req as any).user = undefined

    await verifyMFASetup(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('should return 404 if auth identity not found', async () => {
    req.body = { code: '123456' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(null)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User identity not found' })
  })

  it('should return 400 if MFA setup not started', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {},
    }

    req.body = { code: '123456' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA setup not started. Please enable MFA first.' })
  })

  it('should return 400 if MFA is already verified', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpVerified: true,
      },
    }

    req.body = { code: '123456' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA is already verified and enabled' })
  })

  it('should return 401 if TOTP code is invalid', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: ['12345678'],
        totpVerified: false,
      },
    }

    req.body = { code: 'invalid' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.verifyTOTPCode).mockReturnValue(false)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(mfaService.verifyTOTPCode).toHaveBeenCalledWith('secret123', 'invalid')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid TOTP code. Please try again.' })
  })

  it('should mark MFA as verified on success', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: ['12345678', '87654321'],
        totpVerified: false,
      },
    }

    req.body = { code: '123456' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.verifyTOTPCode).mockReturnValue(true)
    vi.mocked(authIdentityRepo.updateAuthIdentity).mockResolvedValue({
      ...mockAuthIdentity,
      metadata: {
        ...mockAuthIdentity.metadata,
        totpVerified: true,
        mfaEnabled: true,
        mfaEnabledAt: expect.any(String),
      },
    } as any)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(mfaService.verifyTOTPCode).toHaveBeenCalledWith('secret123', '123456')
    expect(authIdentityRepo.updateAuthIdentity).toHaveBeenCalledWith('identity123', {
      metadata: expect.objectContaining({
        totpVerified: true,
        mfaEnabled: true,
        mfaEnabledAt: expect.any(String),
      }),
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'MFA has been successfully enabled for your account',
      backupCodes: ['12345678', '87654321'],
    })
  })

  it('should handle errors and call next', async () => {
    const error = new Error('Database error')
    req.body = { code: '123456' }
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockRejectedValue(error)

    await verifyMFASetup(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
