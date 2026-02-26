// src/modules/auth/email/tests/me.handler.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'
import { getMe } from '../me.handler'
import type { AuthenticatedRequest } from '../../../../middleware/authenticate'
import { AppError } from '../../../../lib/errors'

// ─── mock data ───────────────────────────────────────────────────────────────

const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-abc',
    tenantSlug: 'acme',
    role: 'MEMBER',
    apps: [{ key: 'meshcommerce', role: 'ADMIN' }],
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockRes = () => {
    const res = {} as Response
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}

const mockNext: NextFunction = vi.fn()

// ─── tests ───────────────────────────────────────────────────────────────────

describe('getMe handler', () => {
    let res: Response

    beforeEach(() => {
        res = mockRes()
        vi.clearAllMocks()
    })

    it('returns 200 with full user identity from token', () => {
        const req = { user: mockUser } as AuthenticatedRequest

        getMe(req, res, mockNext)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            userId: 'user-123',
            email: 'test@example.com',
            tenantId: 'tenant-abc',
            tenantSlug: 'acme',
            role: 'MEMBER',
            apps: [{ key: 'meshcommerce', role: 'ADMIN' }],
        })
    })

    it('returns null for tenantSlug when not in token', () => {
        const req = {
            user: { ...mockUser, tenantSlug: undefined },
        } as AuthenticatedRequest

        getMe(req, res, mockNext)

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ tenantSlug: null })
        )
    })

    it('returns empty array for apps when not in token', () => {
        const req = {
            user: { ...mockUser, apps: undefined },
        } as AuthenticatedRequest

        getMe(req, res, mockNext)

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ apps: [] })
        )
    })

    it('returns 401 when req.user is missing', () => {
        const req = {} as AuthenticatedRequest

        getMe(req, res, mockNext)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        )
    })

    it('forwards non-200/401 AppError to next without sending a response', () => {
        const badError = new AppError(418, 'APP_ERROR', 'I am a teapot')

        // Create a user object that throws the AppError when a property is accessed,
        // causing the handler to hit the catch path and call next(err).
        const throwingUser = {
            get userId() {
                throw badError
            },
        } as unknown as AuthenticatedRequest

        getMe({ user: throwingUser } as unknown as AuthenticatedRequest, res, mockNext)

        expect(mockNext).toHaveBeenCalledWith(badError)
        expect(res.status).not.toHaveBeenCalled()
        expect(res.json).not.toHaveBeenCalled()
    })
})
