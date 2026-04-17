import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'

import { createApp } from '../src/app'
import { dbConfig } from '../src/config/db.config'
import * as dbValidate from '../src/lib/db-validate'

describe('DB dialect + health', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('normalises postgres-like DB_DIALECT values', async () => {
    process.env.DB_DIALECT = 'postgresql'
    process.env.DATABASE_URL = 'postgresql://postgres:pass@localhost:5432/celestial'
    process.env.DIRECT_URL = 'postgresql://postgres:pass@localhost:5432/celestial'

    const { env } = await import('../src/config/env.config')
    expect(env.DB_DIALECT).toBe('postgres')
  })

  it('throws on invalid DB_DIALECT', async () => {
    process.env.DB_DIALECT = 'mysql'
    process.env.DATABASE_URL = 'postgresql://postgres:pass@localhost:5432/celestial'
    process.env.DIRECT_URL = 'postgresql://postgres:pass@localhost:5432/celestial'

    await expect(import('../src/config/env.config')).rejects.toThrow(/Invalid DB_DIALECT/)
  })

  it('requires Supabase env when dialect is supabase', async () => {
    process.env.DB_DIALECT = 'supabase'
    process.env.DATABASE_URL = 'postgresql://postgres:pass@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
    process.env.DIRECT_URL = 'postgresql://postgres:pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
    process.env.SUPABASE_URL = ''
    process.env.SUPABASE_ANON_KEY = ''

    await expect(import('../src/config/env.config')).rejects.toThrow(/SUPABASE_URL/)
  })

  it('builds dbConfig with supabase section only when dialect is supabase', async () => {
    // postgres dialect - set process.env so env.config validateEnv passes
    process.env.DB_DIALECT = 'postgres'
    process.env.DATABASE_URL = 'postgresql://postgres:pass@localhost:5432/celestial'
    process.env.DIRECT_URL = 'postgresql://postgres:pass@localhost:5432/celestial'
    process.env.SUPABASE_URL = ''
    process.env.SUPABASE_ANON_KEY = ''

    vi.resetModules()
    const { dbConfig: postgresConfig } = await import('../src/config/db.config')
    expect(postgresConfig.dialect).toBe('postgres')
    expect(postgresConfig.supabase).toBeNull()

    // supabase dialect - set process.env and re-import to get fresh config
    process.env.DB_DIALECT = 'supabase'
    process.env.DATABASE_URL = 'postgresql://postgres:pass@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
    process.env.DIRECT_URL = 'postgresql://postgres:pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'anon'

    vi.resetModules()
    const { dbConfig: supabaseConfig } = await import('../src/config/db.config')
    expect(supabaseConfig.dialect).toBe('supabase')
    expect(supabaseConfig.supabase).toEqual({
      url: 'https://test.supabase.co',
      anonKey: 'anon',
    })
  })

  it('exposes health/live with dialect + basic metrics', async () => {
    const spyHealth = vi
      .spyOn(dbValidate, 'getDbHealth')
      .mockResolvedValue({
        ok: true,
        dialect: dbConfig.dialect,
        latencyMs: 10,
        pool: { activeConnections: 1, idleConnections: 0 },
      } as any)

    const app = createApp()
    const res = await request(app).get('/health/live?details=true')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.dialect).toBe(dbConfig.dialect)
    expect(res.body.pool).toBeDefined()
    expect(spyHealth).toHaveBeenCalled()
  })

  it('returns 503 when DB health is not ok', async () => {
    vi.spyOn(dbValidate, 'getDbHealth').mockResolvedValue({
      ok: false,
      dialect: dbConfig.dialect,
      latencyMs: 50,
      pool: { activeConnections: null, idleConnections: null },
      error: 'connection refused',
    })

    const app = createApp()
    const res = await request(app).get('/health/live?details=true')

    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
  })
})

