/**
 * routes/index.ts
 *
 * Single entry for all API routes. Uses versioned prefix for scalability.
 * Imports route aggregates from modules and sets their prefix.
 */
import express, { type Application, type Request, type Response } from 'express'
import authRouter from './modules/auth/routes'
import healthRouter from './routes/health'

/** API version prefix for maintainability and future versions */
const API_VERSION = 'v1'
const API_PREFIX = `/api/${API_VERSION}`

const apiRouter = express.Router()

// Basic API root (versioned)
apiRouter.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Celestial Auth Core API' })
})

// Module: auth → prefix /auth → /api/v1/auth/*
apiRouter.use('/auth', authRouter)

/**
 * Register all routes on the app. Call this from app.ts only.
 */
export const registerRoutes = (app: Application): void => {
    // Versioned API routes
    app.use(API_PREFIX, apiRouter)

    // Unversioned health endpoints for infra / load balancers:
    // - /health/live?details=true
    // - /health/ready?details=true
    app.use('/health', healthRouter)

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'ROUTE_NOT_FOUND',
            path: req.originalUrl,
        })
    })
}



export { API_PREFIX, API_VERSION }
