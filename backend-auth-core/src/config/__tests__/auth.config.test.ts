import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('auth.config', () => {

    beforeEach(() => {
        vi.resetModules()
        process.env.BCRYPT_ROUNDS = '10'
        process.env.AUTH_CODE_EXPIRY_MINS = '5'
        process.env.JWT_ACCESS_SECRET = 'test_access_secret'
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
        process.env.JWT_ACCESS_EXPIRY = '15m'
        process.env.JWT_REFRESH_EXPIRY = '7d'
    })

    it('coerces BCRYPT_ROUNDS to number', async () => {
        const { authConfig } = await import('../auth.config')
        expect(authConfig.bcrypt.rounds).toBe(10)
        expect(typeof authConfig.bcrypt.rounds).toBe('number')
    })

    it('coerces AUTH_CODE_EXPIRY_MINS to number', async () => {
        const { authConfig } = await import('../auth.config')
        expect(authConfig.authCode.expiryMins).toBe(5)
        expect(typeof authConfig.authCode.expiryMins).toBe('number')
    })

    it('email method is enabled by default', async () => {
        const { authConfig } = await import('../auth.config')
        expect(authConfig.methods.email).toBe(true)
    })

    it('phase 4 methods are disabled by default', async () => {
        const { authConfig } = await import('../auth.config')
        expect(authConfig.methods.phone).toBe(false)
        expect(authConfig.methods.magic).toBe(false)
        expect(authConfig.methods.oauth).toBe(false)
        expect(authConfig.methods.sso).toBe(false)
    })

    it('jwt secrets come from env', async () => {
        const { authConfig } = await import('../auth.config')
        expect(authConfig.jwt.accessSecret).toBe('test_access_secret')
        expect(authConfig.jwt.refreshSecret).toBe('test_refresh_secret')
    })

})
