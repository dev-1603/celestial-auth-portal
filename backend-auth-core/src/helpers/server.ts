// Production-grade server controller: start, error handling, graceful shutdown.
import type { Server } from 'http'
import type { Socket } from 'net'
import { log as defaultLog } from './logger'
import { resolveServiceUrl } from '../utils'

type Env = {
  PORT?: string | number
  NODE_ENV?: string
  DEPLOYMENT_MODE?: string
  DIRECT_URL?: string
  ALLOWED_ORIGINS?: string
}

type Options = {
  forceExitTimeout?: number
  onShutdown?: Array<() => Promise<void> | void>
  attachProcessHandlers?: boolean
  exitOnError?: boolean
  hookTimeoutMillis?: number
  destroyActiveConnections?: boolean
  logger?: {
    info: (msg: string, meta?: unknown) => void
    warn: (msg: string, meta?: unknown) => void
    error: (msg: string, meta?: unknown) => void
  }
}

const normalizePort = (v: string | number | undefined) => {
  const p = typeof v === 'number' ? v : parseInt(String(v || ''), 10)
  return Number.isFinite(p) && p > 0 ? p : 5001
}

export const createServerController = (app: { listen: (port: number) => Server }, env: Env, opts: Options = {}) => {
  const port = normalizePort(env.PORT)
  const logger = opts.logger ?? {
    info: (m: string, meta?: unknown) => defaultLog('info', m, meta),
    warn: (m: string, meta?: unknown) => defaultLog('warn', m, meta),
    error: (m: string, meta?: unknown) => defaultLog('error', m, meta),
  }

  let server: Server | null = null
  let shuttingDown = false
  const FORCE_EXIT_TIMEOUT = opts.forceExitTimeout ?? 30_000
  const hookTimeout = opts.hookTimeoutMillis ?? 10_000
  const destroyConnections = opts.destroyActiveConnections ?? true

  const sockets = new Set<Socket>()

  const start = (): Server => {
    if (server) return server
    // start listening and track connections
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    server = app.listen(port) as Server
    server.on('connection', (sock: Socket) => {
      sockets.add(sock)
      sock.on('close', () => sockets.delete(sock))
    })
    server.on('listening', () => {
      const serviceUrl = resolveServiceUrl(env)
      const pid = process.pid
      logger.info('Auth service listening', {
        url: serviceUrl,
        port,
        mode: env.NODE_ENV,
        deploy: env.DEPLOYMENT_MODE,
        pid,
      })
      console.log(`Auth Service started — ${serviceUrl} (pid:${pid})`)
    })

    server.on('error', (err: any) => {
      if (err && err.code === 'EACCES') {
        logger.error('Port requires elevated privileges', { port, code: err.code })
        if (opts.exitOnError ?? true) process.exit(1)
        return
      }
      if (err && err.code === 'EADDRINUSE') {
        logger.error('Port is already in use', { port, code: err.code })
        if (opts.exitOnError ?? true) process.exit(1)
        return
      }
      logger.error('Server error', { error: String(err) })
    })

    return server
  }

  const runHookWithTimeout = async (hook: () => Promise<void> | void) => {
    return Promise.race([
      Promise.resolve().then(() => hook()),
      new Promise((_, rej) => setTimeout(() => rej(new Error('hook timeout')), hookTimeout)),
    ])
  }

  const shutdown = async (signal?: string, reason?: string): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    logger.warn(`Shutdown initiated${signal ? ` by ${signal}` : ''}`, { reason })

    // run hooks with per-hook timeout
    if (opts.onShutdown && opts.onShutdown.length) {
      for (const hook of opts.onShutdown) {
        try {
          await runHookWithTimeout(hook)
        } catch (e) {
          logger.error('Shutdown hook failed or timed out', { error: String(e) })
        }
      }
    }

    if (!server) {
      logger.warn('Shutdown requested before server start')
      if (opts.exitOnError ?? true) process.exit(0)
      return
    }

    // stop accepting new connections (with force-exit fallback)
    await new Promise<void>((resolve) => {
      const forceTimer = setTimeout(() => {
        logger.error('Forcing shutdown after timeout')
        if (opts.exitOnError ?? true) process.exit(1)
        resolve()
      }, FORCE_EXIT_TIMEOUT)

      server!.close((err?: Error) => {
        clearTimeout(forceTimer)
        if (err) {
          logger.error('Error closing server', { error: String(err) })
          if (opts.exitOnError ?? true) process.exit(1)
          return
        }
        // destroy active sockets if requested
        if (destroyConnections) {
          for (const s of sockets) {
            try {
              s.destroy()
            } catch {
              /* ignore */
            }
          }
        }
        logger.info('Server closed')
        resolve()
      })
    })

    if (opts.exitOnError ?? true) process.exit(0)
  }

  const attachProcessHandlers = () => {
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught exception, initiating shutdown', { name: err.name, message: err.message, stack: err.stack })
      shutdown('uncaughtException', err.message)
    })

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection, initiating shutdown', { reason: String(reason) })
      shutdown('unhandledRejection', String(reason))
    })
  }

  // attach handlers immediately unless disabled
  if (opts.attachProcessHandlers ?? true) attachProcessHandlers()

  return { start, shutdown, port }
}

export const startServer = (app: any, env: Env, opts: Options = {}): Server => {
  return createServerController(app, env, opts).start()
}

