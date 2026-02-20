import express ,{ type Express } from 'express';

import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { registerRoutes } from './routes.js'
// import { errorHandler } from './middlewares/error-handler'
import { env } from './config/env.config'

export const createApp = (): Express => {
    const app = express()

    // ── 1. Security Headers ──────────────────────────
    app.use(helmet())

    // ── 2. CORS ──────────────────────────────────────
    app.use(cors({
        origin: env.ALLOWED_ORIGINS.split(','),
        credentials: true,                // must be true for HttpOnly cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }))

    // ── 3. Body Parsers ───────────────────────────────
    app.use(express.json({ limit: '25kb' }))         // prevents payload bombing
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // ── 4. Routes ─────────────────────────────────────
    registerRoutes(app)

    // ── 5. Global Error Handler ───────────────────────
    // app.use(errorHandler)              // always last

    return app
}