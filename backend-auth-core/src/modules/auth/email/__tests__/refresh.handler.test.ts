import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refreshToken } from '../refresh.handler'

import * as jwtLib from '../../../../lib/jwt'
import * as userRepo from '../../../../repositories/user.repository'
import * as tokenService from '../../../../services/token.service'

function createMockRes() {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.cookie = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}

describe('refreshToken handler', () => {
    const verifyRefreshToken = vi.spyOn(jwtLib, 'verifyRefreshToken')
    const findGlobalUserById = vi.spyOn(userRepo, 'findGlobalUserById')
    const findTenantUserLink = vi.spyOn(userRepo, 'findTenantUserLink')
    const buildLoginTokens = vi.spyOn(tokenService, 'buildLoginTokens')

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('returns 401 when no cookie present', async () => {
        const req: any = { cookies: {} }
        const res = createMockRes()

        await refreshToken(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalled()
    })

    it('issues ADMIN role for superadmin user', async () => {
        const req: any = { cookies: { celestial_refresh_token: 'token' } }
        const res = createMockRes()

        verifyRefreshToken.mockReturnValueOnce({ userId: 'u1', tenantId: 't1' })
        findGlobalUserById.mockResolvedValueOnce({
            id: 'u1',
            email: 'a@b.com',
            isSuperAdmin: true,
            passwordHash: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any)
        findTenantUserLink.mockResolvedValueOnce(null)
        buildLoginTokens.mockReturnValueOnce({
            accessToken: 'access',
            refreshCookie: { name: 'celestial_refresh_token', value: 'refresh', options: {} },
        } as any)

        await refreshToken(req, res, vi.fn())

        expect(buildLoginTokens).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'ADMIN' })
        )
        expect(res.cookie).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('issues OWNER role when tenant link marks owner', async () => {
        const req: any = { cookies: { celestial_refresh_token: 'token' } }
        const res = createMockRes()

        verifyRefreshToken.mockReturnValueOnce({ userId: 'u2', tenantId: 't2' })
        findGlobalUserById.mockResolvedValueOnce({
            id: 'u2',
            email: 'c@d.com',
            isSuperAdmin: false,
            passwordHash: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any)
        findTenantUserLink.mockResolvedValueOnce({
            tenantId: 't2',
            tenantSlug: 's',
            isTenantOwner: true,
            status: 'active',
        })
        buildLoginTokens.mockReturnValueOnce({
            accessToken: 'access2',
            refreshCookie: { name: 'celestial_refresh_token', value: 'refresh2', options: {} },
        } as any)

        await refreshToken(req, res, vi.fn())

        expect(buildLoginTokens).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'OWNER' })
        )
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to USER role when not superadmin or owner', async () => {
        const req: any = { cookies: { celestial_refresh_token: 'token' } }
        const res = createMockRes()

        verifyRefreshToken.mockReturnValueOnce({ userId: 'u3', tenantId: 't3' })
        findGlobalUserById.mockResolvedValueOnce({
            id: 'u3',
            email: 'e@f.com',
            isSuperAdmin: false,
            passwordHash: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any)
        findTenantUserLink.mockResolvedValueOnce({
            tenantId: 't3',
            tenantSlug: 's',
            isTenantOwner: false,
            status: 'active',
        })
        buildLoginTokens.mockReturnValueOnce({
            accessToken: 'access3',
            refreshCookie: { name: 'celestial_refresh_token', value: 'refresh3', options: {} },
        } as any)

        await refreshToken(req, res, vi.fn())

        expect(buildLoginTokens).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'USER' })
        )
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('returns 403 when user email is not verified', async () => {
        const req: any = { cookies: { celestial_refresh_token: 'token' } }
        const res = createMockRes()

        verifyRefreshToken.mockReturnValueOnce({ userId: 'user-123', tenantId: 'tenant-abc' })
        findGlobalUserById.mockResolvedValueOnce({
            id: 'user-123',
            email: 'test@example.com',
            passwordHash: null,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any)

        await refreshToken(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        )
    })
})

