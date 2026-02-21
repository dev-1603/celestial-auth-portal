import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('db.config', () => {

    beforeEach(() => {
        vi.resetModules()
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
        process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/test_db'
        process.env.SUPABASE_URL = 'https://test.supabase.co'
        process.env.SUPABASE_ANON_KEY = 'test_anon_key'
    })

    it('reads DATABASE_URL correctly', async () => {
        const { dbConfig } = await import('../db.config')
        expect(dbConfig.url).toBe('postgresql://test:test@localhost:5432/test_db')
    })

    it('has correct pool defaults', async () => {
        const { dbConfig } = await import('../db.config')
        expect(dbConfig.pool.min).toBe(2)
        expect(dbConfig.pool.max).toBe(10)
        expect(dbConfig.pool.idleTimeoutMs).toBe(30000)
        expect(dbConfig.pool.connectTimeoutMs).toBe(5000)
    })

    it('reads supabase config correctly', async () => {
        const { dbConfig } = await import('../db.config')
        expect(dbConfig.supabase.url).toBe('https://test.supabase.co')
        expect(dbConfig.supabase.anonKey).toBe('test_anon_key')
    })

})
