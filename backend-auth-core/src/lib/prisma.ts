import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.config'
import { dbConfig } from '../config/db.config'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () =>
    new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                // Dialect-aware URL (Supabase pooler vs local Postgres)
                url: dbConfig.url,
            },
        },
    })

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
