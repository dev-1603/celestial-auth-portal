import { createApp } from './src/app'
import { env } from './src/config/env.config'
import { startServer } from './src/helpers/server'

const app = createApp()

// Start server (encapsulates listen, logging, and graceful shutdown)
// Pass shutdown hooks via options when you have cleanup work (DB, caches, etc.)
const server = startServer(app, env)

export { server }
