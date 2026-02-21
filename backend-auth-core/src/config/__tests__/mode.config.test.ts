import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('mode.config', () => {

    beforeEach(() => {
        vi.resetModules()
    })

    describe('standalone mode', () => {
        it('sets isStandalone true when DEPLOYMENT_MODE is not saas', async () => {
            process.env.DEPLOYMENT_MODE = 'standalone'
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isStandalone).toBe(true)
            expect(modeConfig.isSaas).toBe(false)
        })

        it('sets isStandalone true when DEPLOYMENT_MODE is missing', async () => {
            delete process.env.DEPLOYMENT_MODE
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isStandalone).toBe(true)
        })
    })

    describe('saas mode', () => {
        it('sets isSaas true when DEPLOYMENT_MODE is saas', async () => {
            process.env.DEPLOYMENT_MODE = 'saas'
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isSaas).toBe(true)
            expect(modeConfig.isStandalone).toBe(false)
        })
    })

    describe('auth mode', () => {
        it('sets isInternal true by default', async () => {
            delete process.env.AUTH_MODE
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isInternal).toBe(true)
            expect(modeConfig.isExternal).toBe(false)
        })

        it('sets isExternal true when AUTH_MODE is external', async () => {
            process.env.AUTH_MODE = 'external'
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isExternal).toBe(true)
            expect(modeConfig.isInternal).toBe(false)
        })
    })

    describe('mutual exclusivity', () => {
        it('isStandalone and isSaas are never both true', async () => {
            process.env.DEPLOYMENT_MODE = 'saas'
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isStandalone && modeConfig.isSaas).toBe(false)
        })

        it('isInternal and isExternal are never both true', async () => {
            process.env.AUTH_MODE = 'external'
            const { modeConfig } = await import('../mode.config')
            expect(modeConfig.isInternal && modeConfig.isExternal).toBe(false)
        })
    })

})
