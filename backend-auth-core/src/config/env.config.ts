import './load-env'

type DbDialect = 'supabase' | 'postgres'

const normalizeDialect = (raw: string | undefined): DbDialect => {
    const value = (raw ?? '').toLowerCase().trim()

    if (value === 'supabase') return 'supabase'

    // Accept common aliases but normalise to "postgres"
    if (!value || value === 'postgres' || value === 'postgresql' || value === 'local') {
        return 'postgres'
    }

    throw new Error(
        `Invalid DB_DIALECT="${raw}". Expected one of: "supabase", "postgres" (or alias "postgresql", "local").`
    )
}

const rawEnv = {
    PORT: process.env.PORT || '5001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_URL: process.env.API_URL || '',

    DB_DIALECT: normalizeDialect(process.env.DB_DIALECT),

    DATABASE_URL: process.env.DATABASE_URL || '',
    DIRECT_URL: process.env.DIRECT_URL || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',

    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',

    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'standalone',
    AUTH_MODE: process.env.AUTH_MODE || 'internal',

    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || '',

    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '10',
    AUTH_CODE_EXPIRY_MINS: process.env.AUTH_CODE_EXPIRY_MINS || '5',
    CLIENT_SECRET_SALT_ROUNDS: process.env.CLIENT_SECRET_SALT_ROUNDS || '10',
} as const

const assertNonEmpty = (value: string, key: string): void => {
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable "${key}"`)
    }
}

// Dialect-aware validation so misconfiguration fails fast on startup.
const validateEnv = (envLike: typeof rawEnv): void => {
    assertNonEmpty(envLike.DATABASE_URL, 'DATABASE_URL')
    assertNonEmpty(envLike.DIRECT_URL, 'DIRECT_URL')

    if (envLike.DB_DIALECT === 'supabase') {
        assertNonEmpty(envLike.SUPABASE_URL, 'SUPABASE_URL')
        assertNonEmpty(envLike.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY')
    }
}

validateEnv(rawEnv)

export const env = {
    ...rawEnv,
} satisfies typeof rawEnv

export type Env = typeof env
export type { DbDialect }

export const isSupabaseDialect = (): boolean => env.DB_DIALECT === 'supabase'
