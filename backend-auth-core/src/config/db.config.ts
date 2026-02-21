import { env } from './env.config'

export const dbConfig = {
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL,

    pool: {
        min: 2,
        max: 10,
        idleTimeoutMs: 30000,   // close idle connections after 30s
        connectTimeoutMs: 5000,  // fail fast if DB unreachable
    },

    supabase: {
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
    },
}

export type DbConfig = typeof dbConfig
