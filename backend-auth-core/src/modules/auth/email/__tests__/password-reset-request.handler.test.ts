/**
 * Password Reset Request Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { requestPasswordReset } from '../password-reset-request.handler'
import * as userRepository from '../../../../repositories/user.repository'
import * as passwordResetRepository from '../../../../repositories/password-reset.repository'
import * as emailService from '../../../../services/email.service'

vi.mock('../../../../repositories/user.repository')
vi.mock('../../../../repositories/password-reset.repository')
vi.mock('../../../../services/email.service')
vi.mock('../../../../config/env.config', () => ({
  env: { API_URL: 'http://localhost:5001' },
}))

describe('password-reset-request.handler', () => {
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
  })

  it('should return 400 if email is missing', async () => {
    req.body = {}

    await requestPasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' })
  })

  it('should return 200 even if user does not exist (security)', async () => {
    req.body = { email: 'nonexistent@example.com' }
    vi.mocked(userRepository.findGlobalUserByEmail).mockResolvedValue(null)

    await requestPasswordReset(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
    expect(emailService.sendEmail).not.toHaveBeenCalled()
  })

  it('should generate token and send email for existing user', async () => {
    const mockUser = {
      id: 'user123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    req.body = { email: 'user@example.com' }
    vi.mocked(userRepository.findGlobalUserByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(passwordResetRepository.deleteUserPasswordResets).mockResolvedValue(1)
    vi.mocked(passwordResetRepository.createPasswordReset).mockResolvedValue({
      id: 'reset123',
      token: 'token123',
      userId: 'user123',
      expiresAt: new Date(),
      used: false,
      createdAt: new Date(),
    } as any)
    vi.mocked(emailService.sendEmail).mockResolvedValue(undefined)

    await requestPasswordReset(req as Request, res as Response, next)

    expect(passwordResetRepository.deleteUserPasswordResets).toHaveBeenCalledWith('user123')
    expect(passwordResetRepository.createPasswordReset).toHaveBeenCalled()
    expect(emailService.sendEmail).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  })

  it('should handle errors and call next', async () => {
    req.body = { email: 'user@example.com' }
    const error = new Error('Database error')
    vi.mocked(userRepository.findGlobalUserByEmail).mockRejectedValue(error)

    await requestPasswordReset(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
