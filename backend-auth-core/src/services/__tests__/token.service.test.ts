import { describe, it, expect, vi } from 'vitest'
import {
    hashPasswordForUser,
    verifyUserPassword,
    issueTokenPair,
    buildLoginTokens,
    buildLogoutTokens,
} from '../token.service'
import type { JWTPayload } from '../../lib/jwt'
import type { CookieDescriptor } from '../../lib/cookie'

// mock underlying libs so we test orchestration, not crypto
vi.mock('../../lib/bcrypt', () => ({
    hashPassword: vi.fn(async (plain: string) => `hashed:${plain}`),
    comparePassword: vi.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
}))

vi.mock('../../lib/jwt', () => ({
    signTokenPair: (payload: JWTPayload) => ({
        accessToken: `access.${payload.userId}`,
        refreshToken: `refresh.${payload.userId}`,
    }),
}))

vi.mock('../../lib/cookie', () => ({
    buildRefreshCookie: (token: string): CookieDescriptor => ({
        name: 'celestial_refresh_token',
        value: token,
        options: {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
        },
    }),
    buildClearRefreshCookie: (): CookieDescriptor => ({
        name: 'celestial_refresh_token',
        value: '',
        options: {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 0,
        },
    }),
}))

const mockPayload: JWTPayload = {
    userId: 'user-123',
    tenantId: 'tenant-456',
    email: 'user@example.com',
    role: 'admin',
}

describe('token.service', () => {
    it('hashPasswordForUser delegates to bcrypt', async () => {
        const hash = await hashPasswordForUser('secret')
        expect(hash).toBe('hashed:secret')
    })

    it('verifyUserPassword returns true for matching password', async () => {
        const ok = await verifyUserPassword('secret', 'hashed:secret')
        expect(ok).toBe(true)
    })

    it('verifyUserPassword returns false for non-matching password', async () => {
        const ok = await verifyUserPassword('secret', 'hashed:other')
        expect(ok).toBe(false)
    })

    it('issueTokenPair returns tokens from jwt lib', () => {
        const pair = issueTokenPair(mockPayload)
        expect(pair.accessToken).toBe('access.user-123')
        expect(pair.refreshToken).toBe('refresh.user-123')
    })

    it('buildLoginTokens returns access token and refresh cookie', () => {
        const result = buildLoginTokens(mockPayload)

        expect(result.accessToken).toBe('access.user-123')
        expect(result.refreshCookie.name).toBe('celestial_refresh_token')
        expect(result.refreshCookie.value).toBe('refresh.user-123')
        expect(result.refreshCookie.options.httpOnly).toBe(true)
    })

    it('buildLogoutTokens returns clear refresh cookie descriptor', () => {
        const result = buildLogoutTokens()

        expect(result.clearRefreshCookie.value).toBe('')
        expect(result.clearRefreshCookie.options.maxAge).toBe(0)
    })
})
