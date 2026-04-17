// src/modules/auth/email/refresh.handler.ts

import type { Request, Response, NextFunction } from 'express'
import { verifyRefreshToken } from '../../../lib/jwt'
import { findUserWithTenantLinkForRefresh } from '../../../repositories/user.repository'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload, GlobalRole } from '../../../lib/jwt'
import { StatusCodes } from 'http-status-codes'

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        // 1. Read refresh token from httpOnly cookie
        const token = req.cookies?.celestial_refresh_token

        if (!token) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: 'No refresh token provided' })
            return
        }

        // 2. Verify — get userId + tenantId
        let decoded: Pick<JWTPayload, 'userId' | 'tenantId'>

        try {
            decoded = verifyRefreshToken(token)
        } catch {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid or expired refresh token' })
            return
        }

        // 3. Fetch user with tenant link in a single query
        const result = await findUserWithTenantLinkForRefresh(decoded.userId, decoded.tenantId)

        if (!result || !result.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not found' })
            return
        }

        const { user, tenantLink } = result

        // 3.5 Ensure the user's email is verified before issuing tokens
        if (!user.isVerified) {
            res.status(StatusCodes.FORBIDDEN).json({ error: 'Email not verified' })
            return
        }

        // 4. Determine role and rebuild full JWTPayload
        let role: GlobalRole = 'USER'
        if ((user as any).isSuperAdmin) {
            role = 'ADMIN'
        } else if (tenantLink?.isTenantOwner) {
            role = 'OWNER'
        }

        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            tenantId: decoded.tenantId, // keep tenantId from token
            role,
        }

        // 5. Issue new token pair
        const { accessToken, refreshCookie } = buildLoginTokens(payload)

        // 6. Set new refresh cookie + return new access token
        res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
        res.status(StatusCodes.OK).json({ accessToken })

    } catch (err) {
        next(err)
    }
}
