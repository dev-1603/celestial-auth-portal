import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('prisma singleton', () => {

    beforeEach(() => {
        vi.resetModules()
        // clear globalThis between tests
        const g = globalThis as any
        delete g.prisma
    })

    it('exports a prisma instance', async () => {
        const { prisma } = await import('../prisma')
        expect(prisma).toBeDefined()
    })

    it('returns the same instance on multiple imports', async () => {
        const { prisma: instance1 } = await import('../prisma')

        // second import — should return same instance not new one
        const { prisma: instance2 } = await import('../prisma')

        expect(instance1).toBe(instance2)   // referential equality
    })

    it('stores instance on globalThis in non-production', async () => {
        process.env.NODE_ENV = 'development'
        await import('../prisma')

        const g = globalThis as any
        expect(g.prisma).toBeDefined()
    })

    it('does not store on globalThis in production', async () => {
        process.env.NODE_ENV = 'production'
        await import('../prisma')

        const g = globalThis as any
        expect(g.prisma).toBeUndefined()
    })

})
