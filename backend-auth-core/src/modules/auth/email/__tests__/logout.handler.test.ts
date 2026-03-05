// src/modules/auth/email/__tests__/logout.handler.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { logout } from '../logout.handler'
import * as tokenService from '../../../../services/token.service'

// ─── helpers ─────────────────────────────────────────────────────────────────

function createMockRes(): Response {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    res.cookie = vi.fn().mockReturnValue(res)
    return res as Response
}

function createMockNext(): NextFunction {
    return vi.fn() as unknown as NextFunction
}

const mockClearCookie = {
    name: 'celestial_refresh_token',
    value: '',
    options: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 0,
    },
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('logout handler', () => {
    const buildLogoutTokensSpy = vi.spyOn(tokenService, 'buildLogoutTokens')

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('clears refresh cookie with correct name, empty value and maxAge: 0', async () => {
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokensSpy.mockReturnValueOnce({
            clearRefreshCookie: mockClearCookie,
        })

        await logout(req, res, next)

        expect(res.cookie).toHaveBeenCalledWith(
            'celestial_refresh_token',
            '',
            expect.objectContaining({ httpOnly: true, maxAge: 0 }),
        )
    })

    it('returns 200 with success: true', async () => {
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokensSpy.mockReturnValueOnce({
            clearRefreshCookie: mockClearCookie,
        })

        await logout(req, res, next)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ success: true })
    })

    it('does not call next() on success (no error)', async () => {
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokensSpy.mockReturnValueOnce({
            clearRefreshCookie: mockClearCookie,
        })

        await logout(req, res, next)

        expect(next).not.toHaveBeenCalled()
    })

    it('does not require req.user — works without authenticate middleware', async () => {
        // req has no user property at all — logout must still succeed
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokensSpy.mockReturnValueOnce({
            clearRefreshCookie: mockClearCookie,
        })

        await logout(req, res, next)

        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('forwards error to next() if buildLogoutTokens throws', async () => {
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokensSpy.mockImplementationOnce(() => {
            throw new Error('token service failure')
        })

        await logout(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.any(Error))
        expect(res.status).not.toHaveBeenCalled()
    })
})
