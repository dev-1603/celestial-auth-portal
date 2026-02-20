// src/modules/auth/email/__tests__/logout.handler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { logout } from '../logout.handler'
import * as tokenService from '../../../../services/token.service'

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

describe('logout', () => {
    const buildLogoutTokens = vi.spyOn(tokenService, 'buildLogoutTokens')

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('clears refresh cookie and returns success', async () => {
        const req = {} as Request
        const res = createMockRes()
        const next = createMockNext()

        buildLogoutTokens.mockReturnValueOnce({
            clearRefreshCookie: {
                name: 'refresh_token',
                value: '',
                options: { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 },
            },
        })

        await logout(req, res, next)

        expect(res.cookie).toHaveBeenCalledWith(
            'refresh_token',
            '',
            expect.objectContaining({ maxAge: 0 }),
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ success: true })
        expect(next).not.toHaveBeenCalled()
    })
})
