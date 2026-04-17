import { performance } from 'node:perf_hooks'
import { prisma } from './prisma'
import { dbConfig } from '../config/db.config'
import { log } from '../helpers/logger'

export type DbHealthStatus = {
    ok: boolean
    dialect: typeof dbConfig.dialect
    latencyMs: number | null
    pool: {
        activeConnections?: number | null
        idleConnections?: number | null
    }
    error?: string
}

const nowMs = () => {
    try {
        return performance.now()
    } catch {
        return Date.now()
    }
}

export async function validateDatabaseConnection(): Promise<DbHealthStatus> {
    const start = nowMs()

    try {
        // Lightweight connectivity check; works for both Supabase and local Postgres.
        await prisma.$queryRaw`SELECT 1`
        const latencyMs = nowMs() - start

        log('info', 'Database connection validated', {
            dialect: dbConfig.dialect,
            latencyMs,
            urlHost: new URL(dbConfig.url).host,
        })

        return {
            ok: true,
            dialect: dbConfig.dialect,
            latencyMs,
            pool: {
                activeConnections: null,
                idleConnections: null,
            },
        }
    } catch (error: any) {
        const latencyMs = nowMs() - start

        log('error', 'Database validation failed', {
            dialect: dbConfig.dialect,
            latencyMs,
            error: String(error?.message ?? error),
        })

        return {
            ok: false,
            dialect: dbConfig.dialect,
            latencyMs,
            pool: {
                activeConnections: null,
                idleConnections: null,
            },
            error: String(error?.message ?? error),
        }
    }
}

export async function getDbHealth(): Promise<DbHealthStatus> {
    // For now this is identical to validateDatabaseConnection but can be
    // extended with more expensive metrics queries in future.
    return validateDatabaseConnection()
}

