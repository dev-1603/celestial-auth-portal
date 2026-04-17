/**
 * src/app.ts
 *
 * Application factory: creates and configures the Express app.
 * Routes are initialized only via routes/index.ts. Error handler is registered LAST.
 */
import express, { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { registerRoutes } from './routes'
import { getOpenApiSpec } from './docs/swagger.config'
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

  // API docs (OpenAPI 3 spec + Swagger UI at /docs)
  const openApiSpec = getOpenApiSpec()
  app.get('/docs/spec', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(openApiSpec)
  })
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Celestial Auth Core API',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  )

  // Routes (single entry: versioned API and module prefixes in routes/index.ts)
  registerRoutes(app)

  // Error handler (must be last)
  app.use(errorHandler)

  registerProcessHandlers()

  return app
}

export default createApp