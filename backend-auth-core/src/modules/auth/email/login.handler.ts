/**
 * Email/Password Login Handler
 * 
 * Handles login with email and password using AuthIdentity for user lookup.
 * Password verification still uses passwordHash on GlobalUser (for backward compatibility).
 * 
 * Flow:
 * 1. Find AuthIdentity by providerType="email" and providerUserId=email
 * 2. Get user from AuthIdentity
 * 3. Verify password against GlobalUser.passwordHash
 * 4. Build JWT tokens and return
 */

import type { Request, Response, NextFunction } from 'express';
import { getAuthConfig } from '../../../config/auth-config.loader';
import { findAuthIdentityWithUser } from '../../../repositories/auth-identity.repository';
import { findGlobalUserById } from '../../../repositories/user.repository';
import { verifyUserPassword, buildLoginTokens } from '../../../services/token.service';
import type { JWTPayload } from '../../../lib/jwt';
import type { GlobalRole } from '../../../lib/jwt';
import { findTenantUserLink } from '../../../repositories/user.repository';

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

        // Find AuthIdentity by email provider (includes user with passwordHash and memberships)
        const authIdentity = await findAuthIdentityWithUser('email', email);

        if (!authIdentity || !authIdentity.user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = authIdentity.user;

        if (!user.passwordHash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        const passwordOk = await verifyUserPassword(password, user.passwordHash);

        if (!passwordOk) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check email verification requirement
        const config = getAuthConfig();
        if (config.requireVerifiedEmail === true && !user.isVerified) {
            res.status(403).json({ error: 'Email not verified. Please verify your email before signing in.' });
            return;
        }

        // Get tenant info from authIdentity (already loaded with memberships)
        const tenantId = authIdentity.user.tenantId;
        const tenantSlug = authIdentity.user.tenantSlug;

        // Determine role from tenant link (already loaded in memberships)
        let role: GlobalRole = 'USER';
        if (tenantId) {
            // Access memberships from the original identity (before transformation)
            const memberships = (authIdentity as any).user?.memberships || [];
            const tenantLink = memberships.find((m: any) => m.tenantId === tenantId);
            if (tenantLink?.isTenantOwner) {
                role = 'OWNER';
            }
        }

        // Build JWT payload
        const payload: JWTPayload = {
            userId: user.id,
            tenantId: tenantId || '',
            tenantSlug: tenantSlug,
            email: user.email,
            role,
        };

        const { accessToken, refreshCookie } = buildLoginTokens(payload);

        res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options);
        res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                tenantId: tenantId || '',
                tenantSlug: tenantSlug,
            },
        });
    } catch (err) {
        next(err);
    }
};
