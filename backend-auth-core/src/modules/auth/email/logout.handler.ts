// src/modules/auth/email/logout.handler.ts
import type { Request, Response, NextFunction } from 'express'
import { buildLogoutTokens } from '../../../services/token.service'

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { clearRefreshCookie } = buildLogoutTokens()

        res.cookie(
            clearRefreshCookie.name,
            clearRefreshCookie.value,
            clearRefreshCookie.options,
        )

        res.status(200).json({ success: true })
    } catch (err) {
        next(err)
    }
}
