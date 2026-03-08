/**
 * MFA Disable Handler Tests
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
import { disableMFA } from '../disable.handler'
import * as authIdentityRepo from '../../../../repositories/auth-identity.repository'
import * as userRepo from '../../../../repositories/user.repository'
import * as bcrypt from '../../../../lib/bcrypt'

vi.mock('../../../../repositories/auth-identity.repository')
vi.mock('../../../../repositories/user.repository')
vi.mock('../../../../lib/bcrypt')
vi.mock('../../../../middleware/authenticate', () => ({
  authenticate: vi.fn((req, res, next) => next()),
}))
vi.mock('../../../../config/auth-config.loader', () => ({
  getAuthConfig: vi.fn(() => ({ mfa: { policy: 'optional' } })),
  isMethodEnabled: vi.fn(() => true),
  getMethodConfig: vi.fn(() => ({})),
}))

describe('disableMFA', () => {
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

  it('should return 400 if password is missing', async () => {
    req.body = {}

    await disableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Password is required to disable MFA' })
  })

  it('should return 401 if user is not authenticated', async () => {
    req.body = { password: 'password123' }
    ;(req as any).user = undefined

    await disableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('should return 404 if user not found', async () => {
    req.body = { password: 'password123' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockResolvedValue(null)

    await disableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found or password not set' })
  })

  it('should return 401 if password is invalid', async () => {
    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    req.body = { password: 'wrongpassword' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.comparePassword).mockResolvedValue(false)

    await disableMFA(req as Request, res as Response, next)

    expect(bcrypt.comparePassword).toHaveBeenCalledWith('wrongpassword', 'hashed')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid password' })
  })

  it('should return 404 if auth identity not found', async () => {
    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    req.body = { password: 'password123' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.comparePassword).mockResolvedValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(null)

    await disableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User identity not found' })
  })

  it('should return 400 if MFA is not enabled', async () => {
    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {},
    }

    req.body = { password: 'password123' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.comparePassword).mockResolvedValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)

    await disableMFA(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'MFA is not enabled for this account' })
  })

  it('should remove MFA data on success', async () => {
    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockAuthIdentity = {
      id: 'identity123',
      userId: 'user123',
      metadata: {
        totpSecret: 'secret123',
        totpBackupCodes: ['12345678'],
        totpVerified: true,
        mfaEnabled: true,
        mfaEnabledAt: '2026-01-01T00:00:00Z',
        otherData: 'preserved',
      },
    }

    req.body = { password: 'password123' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.comparePassword).mockResolvedValue(true)
    vi.mocked(authIdentityRepo.findAuthIdentityByProvider).mockResolvedValue(mockAuthIdentity as any)
    vi.mocked(authIdentityRepo.updateAuthIdentity).mockResolvedValue({
      ...mockAuthIdentity,
      metadata: { otherData: 'preserved' },
    } as any)

    await disableMFA(req as Request, res as Response, next)

    expect(authIdentityRepo.updateAuthIdentity).toHaveBeenCalledWith('identity123', {
      metadata: { otherData: 'preserved' },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'MFA has been successfully disabled for your account',
    })
  })

  it('should handle errors and call next', async () => {
    const error = new Error('Database error')
    req.body = { password: 'password123' }
    vi.mocked(userRepo.findGlobalUserByEmail).mockRejectedValue(error)

    await disableMFA(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
