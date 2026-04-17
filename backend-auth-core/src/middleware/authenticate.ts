import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { AuthError, ErrorCode } from '../lib/errors'

export interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof verifyAccessToken>
}

const getTokenFromHeader = (req: Request): string | null => {
  const header = req.headers['authorization']
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  return token
}

/**
 * Auth middleware: extracts and verifies JWT access token.
 * Throws typed AuthError instances so the central error handler can respond.
 */
export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const token = getTokenFromHeader(req)

  if (!token) {
    // Missing or malformed header -> TOKEN_INVALID (401)
    throw new AuthError(ErrorCode.TOKEN_INVALID, 'Authorization header must be in the format: Bearer <token>')
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err: any) {
    // jwt library throws TokenExpiredError for expired tokens
    if (err?.name === 'TokenExpiredError') {
      throw new AuthError(ErrorCode.TOKEN_EXPIRED, 'Access token has expired')
    }

    // For all other verification issues treat as invalid token
    throw new AuthError(ErrorCode.TOKEN_INVALID, 'Access token is invalid')
  }
}
