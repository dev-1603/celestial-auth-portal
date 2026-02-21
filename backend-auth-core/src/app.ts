/**
 * src/app.ts
 *
 * Application factory: creates and configures the Express app.
 * Error handler is registered LAST.
 *
 * Export createApp() so tests can import a fresh instance with different envs.
 */
import express, { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import authRoutes from './routes/auth'
import errorHandler, { registerProcessHandlers } from './middleware/errorHandler'

/**
 * Create and configure the Express application.
 */
export function createApp(): Application {
  const app = express()

  // Middleware
  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())

  // Routes
  app.use('/auth', authRoutes)

  // Health check
  app.get('/health', (_req, res) => res.json({ success: true }))

  // Error handler (must be last)
  app.use(errorHandler)

  // Process-level handlers for unhandledRejection
  registerProcessHandlers()

  return app
}

export default createApp