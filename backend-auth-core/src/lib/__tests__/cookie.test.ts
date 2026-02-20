// src/lib/__tests__/cookie.test.ts
import { describe, it, expect, vi } from 'vitest'
import {
    buildRefreshCookie,
    buildClearRefreshCookie,
} from '../cookie'

describe('cookie helpers', () => {
    const token = 'refresh-token-example'

    it('buildRefreshCookie sets secure flags in production', () => {
        vi.stubEnv('NODE_ENV', 'production')

        const cookie = buildRefreshCookie(token)

        expect(cookie.name).toBe('celestial_refresh_token')
        expect(cookie.value).toBe(token)
        expect(cookie.options.httpOnly).toBe(true)
        expect(cookie.options.secure).toBe(true)
        expect(cookie.options.sameSite).toBe('strict')
        expect(cookie.options.path).toBe('/')
        expect(cookie.options.maxAge).toBe(7 * 24 * 60 * 60)
    })

    it('buildRefreshCookie can be non-secure in development when overridden', () => {
        vi.stubEnv('NODE_ENV', 'development')

        const cookie = buildRefreshCookie(token, { secure: false })

        expect(cookie.options.secure).toBe(false)
    })

    it('buildClearRefreshCookie clears the cookie', () => {
        const cookie = buildClearRefreshCookie()

        expect(cookie.value).toBe('')
        expect(cookie.options.maxAge).toBe(0)
        expect(cookie.options.httpOnly).toBe(true)
    })

    it('allows custom domain and path', () => {
        const cookie = buildRefreshCookie(token, {
            secure: true,
            domain: 'auth.example.com',
            path: '/auth',
        })

        expect(cookie.options.domain).toBe('auth.example.com')
        expect(cookie.options.path).toBe('/auth')
    })
})
