import { env, type DbDialect, isSupabaseDialect } from './env.config'

export type DbPoolConfig = {
    min: number
    max: number
    idleTimeoutMs: number
    connectTimeoutMs: number
}

export type SupabaseConfig =
    | {
        url: string
        anonKey: string
    }
    | null

export type DbConfig = {
    dialect: DbDialect
    url: string
    directUrl: string
    pool: DbPoolConfig
    supabase: SupabaseConfig
}

export const dbConfig: DbConfig = {
    dialect: env.DB_DIALECT,
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL,

    pool: {
        min: 2,
        max: 10,
        idleTimeoutMs: 30000, // close idle connections after 30s
        connectTimeoutMs: 5000, // fail fast if DB unreachable
    },

    // Only meaningful for supabase dialect; kept null otherwise to avoid accidental use.
    supabase: isSupabaseDialect()
        ? {
            url: env.SUPABASE_URL,
            anonKey: env.SUPABASE_ANON_KEY,
        }
        : null,
}
