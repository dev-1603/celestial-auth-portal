import type { Request, Response, NextFunction } from 'express';
import { findGlobalUserWithTenantByEmail } from '../../../repositories/user.repository';
import { verifyUserPassword, buildLoginTokens } from '../../../services/token.service';
import type { JWTPayload } from '../../../lib/jwt';

export const loginWithEmailPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { email, password } = req.body ?? {};

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await findGlobalUserWithTenantByEmail(email);

        if (!user || !user.passwordHash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const passwordOk = await verifyUserPassword(password, user.passwordHash);

        if (!passwordOk) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // derive tenantId + tenantSlug from TenantUserLink
        const payload: JWTPayload = {
            userId: user.id,
            tenantId: user.tenantId,
            tenantSlug: user.tenantSlug,
            email: user.email,
            role: 'user',
        };

        const { accessToken, refreshCookie } = buildLoginTokens(payload);

        res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options);
        res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
                tenantSlug: user.tenantSlug,
            },
        });
    } catch (err) {
        next(err);
    }
};
