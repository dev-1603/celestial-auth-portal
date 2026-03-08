/**
 * Password Reset Complete Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { completePasswordReset } from '../password-reset-complete.handler'
import * as passwordResetRepository from '../../../../repositories/password-reset.repository'
import * as userRepository from '../../../../repositories/user.repository'
import * as bcrypt from '../../../../lib/bcrypt'
import * as authConfigLoader from '../../../../config/auth-config.loader'

vi.mock('../../../../repositories/password-reset.repository')
vi.mock('../../../../repositories/user.repository')
vi.mock('../../../../lib/bcrypt')
vi.mock('../../../../config/auth-config.loader')

describe('password-reset-complete.handler', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      body: {},
      query: {},
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    next = vi.fn()
    vi.mocked(authConfigLoader.getAuthConfig).mockReturnValue({
      passwordPolicy: { minLength: 8 },
    } as any)
  })

  it('should return 400 if token is missing', async () => {
    req.body = { email: 'user@example.com', password: 'NewPass123!' }

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Reset token is required' })
  })

  it('should return 400 if email is missing', async () => {
    req.body = { token: 'token123', password: 'NewPass123!' }

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('should return 400 if password is missing', async () => {
    req.body = { token: 'token123', email: 'user@example.com' }

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'New password is required' })
  })

  it('should return 400 if password is too short', async () => {
    req.body = { token: 'token123', email: 'user@example.com', password: 'short' }

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Password must be at least 8 characters long',
    })
  })

  it('should return 401 if token is invalid or expired', async () => {
    req.body = { token: 'invalid', email: 'user@example.com', password: 'NewPass123!' }
    vi.mocked(passwordResetRepository.findActivePasswordResetByToken).mockResolvedValue(null)

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired password reset token',
    })
  })

  it('should return 401 if email does not match', async () => {
    const mockReset = {
      id: 'reset123',
      token: 'token123',
      userId: 'user123',
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
      createdAt: new Date(),
      user: {
        id: 'user123',
        email: 'user@example.com',
        passwordHash: 'old',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    req.body = { token: 'token123', email: 'wrong@example.com', password: 'NewPass123!' }
    vi.mocked(passwordResetRepository.findActivePasswordResetByToken).mockResolvedValue(mockReset as any)

    await completePasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email does not match reset token',
    })
  })

  it('should update password and mark token as used on success', async () => {
    const mockReset = {
      id: 'reset123',
      token: 'token123',
      userId: 'user123',
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
      createdAt: new Date(),
      user: {
        id: 'user123',
        email: 'user@example.com',
        passwordHash: 'old',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    req.body = { token: 'token123', email: 'user@example.com', password: 'NewPass123!' }
    vi.mocked(passwordResetRepository.findActivePasswordResetByToken).mockResolvedValue(mockReset as any)
    vi.mocked(bcrypt.hashPassword).mockResolvedValue('newHashedPassword')
    vi.mocked(userRepository.updateUserPassword).mockResolvedValue({
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'newHashedPassword',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    vi.mocked(passwordResetRepository.markPasswordResetAsUsed).mockResolvedValue({
      ...mockReset,
      used: true,
    } as any)
    vi.mocked(passwordResetRepository.deleteUserPasswordResets).mockResolvedValue(1)

    await completePasswordReset(req as Request, res as Response, next)

    expect(bcrypt.hashPassword).toHaveBeenCalledWith('NewPass123!')
    expect(userRepository.updateUserPassword).toHaveBeenCalledWith('user123', 'newHashedPassword')
    expect(passwordResetRepository.markPasswordResetAsUsed).toHaveBeenCalledWith('reset123')
    expect(passwordResetRepository.deleteUserPasswordResets).toHaveBeenCalledWith('user123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password has been reset successfully',
    })
  })
})
