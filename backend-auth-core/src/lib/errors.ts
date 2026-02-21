/**
 * src/lib/errors.ts
 *
 * Centralized, type-safe error classes for the auth service.
 * These extend the http-errors HttpError so they integrate cleanly with Express
 * and standard HTTP semantics while carrying structured, typed metadata.
 *
 * Design notes:
 * - All handled errors are marked `isOperational = true` to distinguish them
 *   from programmer errors/unexpected failures.
 * - Generic `details` allow attaching non-sensitive structured data (validation
 *   issues, Prisma meta) for observability without leaking secrets in prod.
 *
 * Alternatives considered: @hapi/boom — good ergonomics but a heavier API surface.
 * Using `http-errors` keeps things small and interoperable with Express.
 */
import { StatusCodes } from 'http-status-codes'

/**
 * Canonical error codes used across the service. Add new values when introducing
 * new well-known failure modes; keep the human-readable `message` for UX.
 */
export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  APP = 'APP',
}

/**
 * Base application error used by the service. Extends the http-errors HttpError
 * so existing Express middleware and libraries that expect HttpError work
 * automatically.
 *
 * @template T - optional details payload shape
 */
export class AppError<T = unknown> extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode | string
  public readonly details?: T
  public readonly isOperational = true

  /**
   * Create a new AppError.
   *
   * @param status - HTTP status code
   * @param code - a service-level error code (string/enum)
   * @param message - client-facing message
   * @param details - optional structured details for observability
   */
  constructor(status: number, code: ErrorCode | string, message?: string, details?: T) {
    super(message ?? String(code))
    this.name = 'AppError'
    this.statusCode = status
    this.code = code
    this.details = details
    // Ensure stack trace points to where error was created
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Authentication related errors (401 or 403).
 * Use status 401 by default; pass 403 for explicit forbidden cases.
 */
export class AuthError<T = unknown> extends AppError<T> {
  constructor(code: ErrorCode | string, message?: string, details?: T, status = StatusCodes.UNAUTHORIZED) {
    super(status, code, message, details)
  }
}

/**
 * Validation errors (400). Suitable for Zod / manual validation failures.
 */
export class ValidationError<T = unknown> extends AppError<T> {
  constructor(details?: T, message = 'Validation failed') {
    super(StatusCodes.BAD_REQUEST, ErrorCode.VALIDATION, message, details)
  }
}

/**
 * Database errors (409 for unique constraints / 500 for unknown DB failures).
 */
export class DatabaseError<T = unknown> extends AppError<T> {
  constructor(details?: T, message = 'Database error', status = StatusCodes.CONFLICT) {
    super(status, ErrorCode.DATABASE, message, details)
  }
}

/**
 * Convenience type-guard to assert an unknown value is an AppError.
 */
export const isAppError = (err: unknown): err is AppError =>
  Boolean(err && typeof err === 'object' && 'code' in err && 'statusCode' in err)

// Re-export resolver for convenience (optional). Keep mapping logic separate so
// errors.ts remains focused on shapes and codes.
export { resolveStatusAndMessage } from './httpStatusResolver'

