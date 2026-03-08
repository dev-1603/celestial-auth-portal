/**
 * MFA Enable Handler Tests
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
import { enableMFA } from '../enable.handler'
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

describe('enableMFA', () => {
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

  it('should return 403 if MFA is disabled in config', async () => {
    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(false)

    await enableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA is disabled' })
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(true)
    ;(req as any).user = undefined

    await enableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('should return 404 if auth identity not found', async () => {
    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(null)

    await enableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User identity not found' })
  })

  it('should return 400 if MFA is already enabled', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      providerType: 'email',
      providerUserId: 'user@example.com',
      metadata: {
        totpSecret: 'existing_secret',
        mfaEnabled: true,
      },
    }

    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)

    await enableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA is already enabled for this account' })
  })

  it('should generate TOTP secret and QR code on success', async () => {
    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      providerType: 'email',
      providerUserId: 'user@example.com',
      metadata: {},
    }

    const mockTotpSetup = {
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeUrl: 'otpauth://totp/...',
      manualEntryKey: 'JBSWY3DPEHPK3PXP',
      backupCodes: ['12345678', '87654321'],
    }

    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(mfaService.generateTOTPSecret).mockReturnValue(mockTotpSetup)
    vi.mocked(mfaService.generateTOTPQRCode).mockResolvedValue('data:image/png;base64,...')
    vi.mocked(authIdentityRepo.updateAuthIdentity).mockResolvedValue({
      ...mockAuthIdentity,
      metadata: {
        totpSecret: mockTotpSetup.secret,
        totpBackupCodes: mockTotpSetup.backupCodes,
        totpVerified: false,
      },
    } as any)

    await enableMFA(req as Request, res as Response, next)

    expect(mfaService.generateTOTPSecret).toHaveBeenCalledWith('user@example.com', 'user123')
    expect(mfaService.generateTOTPQRCode).toHaveBeenCalledWith(mockTotpSetup.qrCodeUrl)
    expect(authIdentityRepo.updateAuthIdentity).toHaveBeenCalledWith('identity123', {
      metadata: {
        totpSecret: mockTotpSetup.secret,
        totpBackupCodes: mockTotpSetup.backupCodes,
        totpVerified: false,
      },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      secret: mockTotpSetup.secret,
      qrCode: 'data:image/png;base64,...',
      manualEntryKey: mockTotpSetup.manualEntryKey,
      backupCodes: mockTotpSetup.backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code to complete setup.',
    })
  })

  it('should handle errors and call next', async () => {
    const error = new Error('Database error')
    vi.mocked(mfaService.isMFAEnabled).mockReturnValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockRejectedValue(error)

    await enableMFA(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
