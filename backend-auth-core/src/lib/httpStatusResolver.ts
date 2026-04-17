/**
 * src/lib/httpStatusResolver.ts
 *
 * Resolve HTTP status codes and safe public messages for service-level error codes.
 * Keeps mapping centralized and i18n-ready (map can be extended or replaced).
 */
import { getReasonPhrase, StatusCodes } from 'http-status-codes'
import type { ErrorCode } from './errors'

export type ResolvedStatus = { status: number; publicMessage: string }

const defaultMap: Record<string, ResolvedStatus> = {
  INVALID_CREDENTIALS: { status: StatusCodes.UNAUTHORIZED, publicMessage: 'Invalid credentials' },
  TOKEN_EXPIRED: { status: StatusCodes.UNAUTHORIZED, publicMessage: 'Session expired, please sign in again' },
  TOKEN_INVALID: { status: StatusCodes.UNAUTHORIZED, publicMessage: 'Invalid authentication token' },
  USER_NOT_FOUND: { status: StatusCodes.NOT_FOUND, publicMessage: 'User not found' },
  VALIDATION: { status: StatusCodes.BAD_REQUEST, publicMessage: 'Validation failed' },
  DATABASE: { status: StatusCodes.CONFLICT, publicMessage: 'Database error' },
  APP: { status: StatusCodes.INTERNAL_SERVER_ERROR, publicMessage: 'Internal server error' },
}

/**
 * Resolve the HTTP status and a safe, public-facing message for a given service error code.
 *
 * @param code - an ErrorCode or arbitrary string code
 * @param fallbackStatus - HTTP status to use if code is unknown
 * @param fallbackMessage - optional fallback public message
 */
export function resolveStatusAndMessage(
  code?: ErrorCode | string,
  fallbackStatus = StatusCodes.INTERNAL_SERVER_ERROR,
  fallbackMessage?: string,
): ResolvedStatus {
  if (code && defaultMap[code]) return defaultMap[code]
  return { status: fallbackStatus, publicMessage: fallbackMessage ?? getReasonPhrase(fallbackStatus) }
}

export default resolveStatusAndMessage

