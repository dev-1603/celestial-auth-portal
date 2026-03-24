/**
 * routes/index.ts
 *
 * Single entry for all API routes. Root (/) and health (/health) are intentionally
 * outside API versioning; all other API routes use the versioned prefix /api/v1.
 */
import express, { type Application, type Request, type Response } from 'express'
import authRouter from './modules/auth/routes'
import { adminRouter } from './modules/admin/routes'
import healthRouter from './routes/health'

/** API version prefix — only applied to /api/v1/* routes */
const API_VERSION = 'v1'
const API_PREFIX = `/api/${API_VERSION}`

const apiRouter = express.Router()

// Module: auth → prefix /auth → /api/v1/auth/*
apiRouter.use('/auth', authRouter)

// Module: admin → prefix /admin → /api/v1/admin/*
apiRouter.use('/admin', adminRouter)

/**
 * Register all routes on the app. Call this from app.ts only.
 * Unversioned: / (root), /health, /health/live, /health/ready
 * Versioned: /api/v1/auth/*
 */
export const registerRoutes = (app: Application): void => {
    // ——— Unversioned (root and health) ———
    app.get('/', (_req: Request, res: Response) => {
        res.status(200).json({ message: 'Celestial Auth Core API' })
    })
    app.use('/health', healthRouter)

    // ——— Versioned API ———
    app.use(API_PREFIX, apiRouter)

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'ROUTE_NOT_FOUND',
            path: req.originalUrl,
        })
    })
}



export { API_PREFIX, API_VERSION }
