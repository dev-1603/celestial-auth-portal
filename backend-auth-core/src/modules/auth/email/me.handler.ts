
import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../../middleware/authenticate'
import { AppError, isAppError, AuthError, ErrorCode } from '../../../lib/errors'
import { StatusCodes } from 'http-status-codes'

export const getMe = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    try {
        if (!req?.user) {
            // Return 401 directly so direct handler calls (unit tests) observe the response
            res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Authorization required' })
            return
        }

        const { userId, email, tenantId, tenantSlug, role, apps } = req.user

        res.status(StatusCodes.OK).json({
            userId,
            email,
            tenantId,
            tenantSlug: tenantSlug ?? null,
            role,
            apps: apps ?? [],
        })
    } catch (err: unknown) {
        if (res.headersSent) {
            // response already started; log and stop
            // eslint-disable-next-line no-console
            console.error('Error after response sent', err)
            return
        }

        if (isAppError(err)) {
            next(err)
            return
        }

        next(new AppError(500, 'APP_ERROR', 'Internal server error', { original: String(err) }))
    }
}
