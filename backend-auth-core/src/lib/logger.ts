/**
 * Winston logger for backend-auth-core.
 * Production: JSON format for log aggregators (New Relic, DataDog, etc.).
 * Development: human-readable format.
 * LOG_LEVEL from env; optional LOG_PATH for file transport.
 */
import winston from 'winston'

const isProduction = process.env.NODE_ENV === 'production'
const logLevel =
  process.env.LOG_LEVEL ||
  (isProduction ? 'info' : 'debug')

const defaultMeta = {
  service: 'backend-auth-core',
  env: process.env.NODE_ENV ?? 'development',
  pid: process.pid,
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'iso8601' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
  })
)

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? jsonFormat : devFormat,
  }),
]

if (process.env.LOG_PATH) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_PATH,
      format: jsonFormat,
    })
  )
}

export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta,
  transports,
})

/**
 * Create a child logger with extra default metadata (e.g. requestId, userId).
 */
export function child(meta: Record<string, unknown>): winston.Logger {
  return logger.child(meta)
}

export default logger
