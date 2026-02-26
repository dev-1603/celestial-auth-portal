/**
 * routes/index.ts
 *
 * Single entry for all API routes. Uses versioned prefix for scalability.
 * Imports route aggregates from modules and sets their prefix.
 */
import express, { type Application, type Request, type Response } from 'express'
import authRouter from './modules/auth/routes'

/** API version prefix for maintainability and future versions */
const API_VERSION = 'v1'
const API_PREFIX = `/api/${API_VERSION}`

const apiRouter = express.Router()

// Health check (versioned)
apiRouter.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Celestial Auth Core API' });
});

apiRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    })
})

// Module: auth → prefix /auth → /api/v1/auth/*
apiRouter.use('/auth', authRouter)

/**
 * Register all routes on the app. Call this from app.ts only.
 */
export const registerRoutes = (app: Application): void => {
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
