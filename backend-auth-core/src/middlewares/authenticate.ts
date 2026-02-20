import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'

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

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    const token = getTokenFromHeader(req)

    if (!token) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' })
        return
    }

    try {
        const payload = verifyAccessToken(token)
        req.user = payload
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
