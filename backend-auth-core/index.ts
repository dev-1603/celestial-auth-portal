import { createApp } from './src/app'
import { env } from './src/config/env.config'
import { createServerController } from './src/helpers/server'
import { validateDatabaseConnection } from './src/lib/db-validate'
import { prisma } from './src/lib/prisma'
import { log } from './src/helpers/logger'

const app = createApp()

async function bootstrap() {
    // Fail fast if DB is unreachable or misconfigured.
    const health = await validateDatabaseConnection()
    if (!health.ok) {
        log('error', 'Database validation failed on startup; refusing to listen', {
            dialect: health.dialect,
            error: health.error,
        })
        // Non-zero exit so orchestrators can restart / mark as unhealthy.
        process.exit(1)
    }

    const controller = createServerController(app, env, {
        onShutdown: [
            async () => {
                await prisma.$disconnect()
                log('info', 'Prisma disconnected during graceful shutdown')
            },
        ],
    })

    const server = controller.start()
    return server
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()

export { app }
