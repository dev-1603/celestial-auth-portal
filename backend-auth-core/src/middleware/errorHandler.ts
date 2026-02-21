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

  // Logging: verbose in dev; structured JSON in prod (no external deps)
  if (env === 'development') {
    // print full error for developer experience
    // eslint-disable-next-line no-console
    console.error('Error caught by errorHandler:', err)
  } else {
    // minimal structured JSON log ready for log aggregation
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(buildLogPayload(err, req)))
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
    // Fallback: if response writing fails, log and end process
    // eslint-disable-next-line no-console
    console.error('Failed to send error response', writeErr)
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
    // Log and attempt graceful exit. In production a supervisor (systemd/k8s)
    // should restart the process. Keep logs structured so SRE can triage.
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'fatal', reason: String(reason) }))
    // Optionally perform graceful shutdown here (close DB, flush logs) then exit.
    // We don't force-exit immediately to allow app-specific cleanup to run.
  })
}

export default errorHandler

