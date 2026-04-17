/**
 * src/middleware/errorHandler.ts
 *
 * Central Express error-handling middleware.
 *
 * Responsibilities:
 * - Normalize errors to our AppError shapes
 * - Structured logging (console-based; adapter-friendly for future sinks)
 * - Environment-aware responses (dev: verbose, prod: minimal)
 * - Map status codes and guard against leaking sensitive data
 *
 * This file intentionally uses no logging dependencies so it is trivial to
 * replace `console` with Winston/Sentry adapters later.
 */
import type { Request, Response, NextFunction } from 'express'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import { logger } from '../lib/logger'
import { AppError, isAppError } from '../lib/errors'
import { resolveStatusAndMessage } from '../lib/httpStatusResolver'

type ErrorLike = unknown

/**
 * Build a stable JSON log payload for structured logging. Keep shape stable so
 * external sinks can parse easily.
 */
function buildLogPayload(err: ErrorLike, req?: Request) {
  const timestamp = new Date().toISOString()
  const payload: Record<string, unknown> = {
    timestamp,
    level: 'error',
    service: 'backend-auth-core',
  }

  if (req) {
    payload.method = req.method
    payload.url = req.originalUrl || req.url
    payload.ip = req.ip
    // may be undefined; do not throw
    payload.userId = (req as any).user?.userId
  }

  if (err && typeof err === 'object') {
    const e: any = err
    payload.error = {
      name: e.name,
      message: e.message,
      code: e.code ?? null,
      details: e.details ?? null,
      stack: e.stack ?? null,
    }
  } else {
    payload.error = { message: String(err) }
  }

  return payload
}

/**
 * Express error middleware. Place this AFTER all routes and middleware.
 *
 * Important: keep this function synchronous (no awaiting) to avoid issues with
 * Express lifecycle.
 */
export function errorHandler(err: ErrorLike, req: Request, res: Response, _next: NextFunction) {
  const env = process.env.NODE_ENV ?? 'development'

  // Normalize common http-errors into AppError-like shape
  let normalized: AppError | ErrorLike = err

  // If someone used http-errors factory, convert to AppError to get consistent fields
  if ((err as any)?.status && (err as any)?.message) {
    const he = err as any
    normalized = new AppError(he.status, he.code ?? he.name ?? 'HTTP_ERROR', he.message, he)
  }

  // If already an AppError, respect it
  const isApp = isAppError(normalized)

  // Resolve status and public message using centralized resolver
  const { status: resolvedStatus, publicMessage } = resolveStatusAndMessage(
    isApp ? (normalized as AppError).code : (err as any)?.code,
    isApp ? (normalized as AppError).statusCode : (err as any)?.status || StatusCodes.INTERNAL_SERVER_ERROR,
    // Only provide a fallback public message when we have an AppError (explicit intent).
    // Passing unknown thrown error.message here would echo internal messages back to clients.
    isApp ? (normalized as AppError).message : undefined,
  )

  const status = resolvedStatus
  const code = isApp ? (normalized as AppError).code : ((err as any)?.code ?? 'APP_ERROR')
  const message = env === 'development' ? ((isApp ? (normalized as AppError).message : (err as any)?.message) ?? getReasonPhrase(status)) : publicMessage
  const details = isApp ? (normalized as AppError).details : undefined

  // Logging via Winston (structured in prod, readable in dev)
  if (env === 'development') {
    logger.error('Error caught by errorHandler', buildLogPayload(err, req))
  } else {
    logger.error('Request error', buildLogPayload(err, req))
  }

  // Build safe response
  const responseBody: Record<string, unknown> = { success: false, error: { code, message } }
  if (details && env !== 'production') {
    // include details only in non-production environments
    ; (responseBody.error as any).details = details
  }

  // Ensure no sensitive headers/body leak
  try {
    res.status(typeof status === 'number' ? status : StatusCodes.INTERNAL_SERVER_ERROR)
    res.json(responseBody)
  } catch (writeErr) {
    logger.error('Failed to send error response', { error: writeErr })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR))
  }
}

/**
 * Install lightweight process handlers for unhandled rejections.
 * This function is idempotent and safe to call multiple times.
 */
export function registerProcessHandlers() {
  if ((global as any).__errorHandlersRegistered) return
    ; (global as any).__errorHandlersRegistered = true

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      level: 'fatal',
      reason: String(reason),
      timestamp: new Date().toISOString(),
    })
  })
}

export default errorHandler

