import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('env.config', () => {

    beforeEach(() => {
        vi.resetModules()  // fresh module on each test — env changes take effect
    })

    it('returns default PORT when not set', async () => {
        delete process.env.PORT
        const { env } = await import('../env.config')
        expect(env.PORT).toBe('5001')
    })

    it('reads PORT from process.env', async () => {
        process.env.PORT = '9000'
        const { env } = await import('../env.config')
        expect(env.PORT).toBe('9000')
    })

    it('returns default NODE_ENV as development', async () => {
        delete process.env.NODE_ENV
        const { env } = await import('../env.config')
        expect(env.NODE_ENV).toBe('development')
    })

    it('returns default JWT_ACCESS_EXPIRY as 15m', async () => {
        delete process.env.JWT_ACCESS_EXPIRY
        const { env } = await import('../env.config')
        expect(env.JWT_ACCESS_EXPIRY).toBe('15m')
    })

    it('returns default DEPLOYMENT_MODE as standalone', async () => {
        delete process.env.DEPLOYMENT_MODE
        const { env } = await import('../env.config')
        expect(env.DEPLOYMENT_MODE).toBe('standalone')
    })

})
