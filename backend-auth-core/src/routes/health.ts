import express, { type Request, type Response } from 'express'
import { getDbHealth } from '../lib/db-validate'
import { dbConfig } from '../config/db.config'

const router = express.Router()

// GET /health — simple liveness (unversioned)
router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'celestial-auth-core' })
})

router.get('/live', async (req: Request, res: Response) => {
    const includeDetails = (req.query.details === 'true') || (req.query.details === '1')

    const health = await getDbHealth()

    if (!health.ok) {
        return res.status(503).json({
            status: 'degraded',
            dialect: dbConfig.dialect,
            error: includeDetails ? health.error : 'Database unavailable',
            latencyMs: health.latencyMs,
            pool: health.pool,
            timestamp: new Date().toISOString(),
        })
    }

    return res.status(200).json({
        status: 'ok',
        dialect: dbConfig.dialect,
        latencyMs: health.latencyMs,
        pool: includeDetails ? health.pool : undefined,
        timestamp: new Date().toISOString(),
    })
})

router.get('/ready', async (req: Request, res: Response) => {
    // For now, "ready" is equivalent to DB connectivity. This can be extended
    // later to include migrations, caches, etc.
    const includeDetails = (req.query.details === 'true') || (req.query.details === '1')
    const health = await getDbHealth()

    if (!health.ok) {
        return res.status(503).json({
            status: 'degraded',
            dialect: dbConfig.dialect,
            error: includeDetails ? health.error : 'Database unavailable',
            latencyMs: health.latencyMs,
            pool: health.pool,
            timestamp: new Date().toISOString(),
        })
    }

    return res.status(200).json({
        status: 'ok',
        dialect: dbConfig.dialect,
        latencyMs: health.latencyMs,
        pool: includeDetails ? health.pool : undefined,
        timestamp: new Date().toISOString(),
    })
})

export default router

