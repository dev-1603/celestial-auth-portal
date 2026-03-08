/**
 * Login Handler Tests
 * 
 * Tests for email/password login handler using AuthIdentity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env config before any imports that use it
vi.mock('../../../../config/env.config', () => ({
    env: {
        DATABASE_URL: 'postgresql://test',
        DIRECT_URL: 'postgresql://test',
        NODE_ENV: 'test',
    },
}))

// Mock prisma before importing handlers
vi.mock('../../../../lib/prisma', () => ({
    prisma: {},
}))

import { loginWithEmailPassword } from '../login.handler';

import * as authIdentityRepo from '../../../../repositories/auth-identity.repository';
import * as userRepo from '../../../../repositories/user.repository';
import * as tokenService from '../../../../services/token.service';

function createMockRes() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('loginWithEmailPassword', () => {
    const findAuthIdentityWithUser = vi.spyOn(authIdentityRepo, 'findAuthIdentityWithUser');
    const findGlobalUserById = vi.spyOn(userRepo, 'findGlobalUserById');
    const findTenantUserLink = vi.spyOn(userRepo, 'findTenantUserLink');
    const verifyUserPassword = vi.spyOn(tokenService, 'verifyUserPassword');
    const buildLoginTokens = vi.spyOn(tokenService, 'buildLoginTokens');

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns 400 when email or password missing', async () => {
        const req: any = { body: { email: 'a@test.com' } };
        const res = createMockRes();

        await loginWithEmailPassword(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('returns 401 when AuthIdentity not found', async () => {
        const req: any = { body: { email: 'a@test.com', password: 'secret' } };
        const res = createMockRes();

        findAuthIdentityWithUser.mockResolvedValueOnce(null);

        await loginWithEmailPassword(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 when user has no passwordHash', async () => {
        const req: any = { body: { email: 'a@test.com', password: 'secret' } };
        const res = createMockRes();

        findAuthIdentityWithUser.mockResolvedValueOnce({
            id: 'identity-1',
            userId: 'user-1',
            providerType: 'email',
            providerUserId: 'a@test.com',
            email: 'a@test.com',
            user: {
                id: 'user-1',
                email: 'a@test.com',
                tenantId: 'tenant-1',
                tenantSlug: 'tenant-slug',
            },
        } as any);
        findGlobalUserById.mockResolvedValueOnce({
            id: 'user-1',
            email: 'a@test.com',
            passwordHash: null,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await loginWithEmailPassword(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 when password invalid', async () => {
        const req: any = { body: { email: 'a@test.com', password: 'wrong' } };
        const res = createMockRes();

        findAuthIdentityWithUser.mockResolvedValueOnce({
            id: 'identity-1',
            userId: 'user-1',
            providerType: 'email',
            providerUserId: 'a@test.com',
            email: 'a@test.com',
            user: {
                id: 'user-1',
                email: 'a@test.com',
                tenantId: 'tenant-1',
                tenantSlug: 'tenant-slug',
            },
        } as any);
        findGlobalUserById.mockResolvedValueOnce({
            id: 'user-1',
            email: 'a@test.com',
            passwordHash: 'hashed',
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        verifyUserPassword.mockResolvedValueOnce(false);

        await loginWithEmailPassword(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('issues tokens and sets cookie for valid credentials', async () => {
        const req: any = { body: { email: 'a@test.com', password: 'secret' } };
        const res = createMockRes();

        findAuthIdentityWithUser.mockResolvedValueOnce({
            id: 'identity-1',
            userId: 'user-1',
            providerType: 'email',
            providerUserId: 'a@test.com',
            email: 'a@test.com',
            user: {
                id: 'user-1',
                email: 'a@test.com',
                tenantId: 'tenant-1',
                tenantSlug: 'tenant-slug',
            },
        } as any);
        findGlobalUserById.mockResolvedValueOnce({
            id: 'user-1',
            email: 'a@test.com',
            passwordHash: 'hashed',
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        findTenantUserLink.mockResolvedValueOnce(null);
        verifyUserPassword.mockResolvedValueOnce(true);
        buildLoginTokens.mockReturnValueOnce({
            accessToken: 'access-token',
            refreshCookie: {
                name: 'celestial_refresh_token',
                value: 'refresh-token',
                options: {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60,
                },
            },
        });

        await loginWithEmailPassword(req, res, vi.fn());

        expect(buildLoginTokens).toHaveBeenCalledWith({
            userId: 'user-1',
            email: 'a@test.com',
            tenantId: 'tenant-1',
            tenantSlug: 'tenant-slug',
            role: 'USER',
        });
        expect(res.cookie).toHaveBeenCalledWith('celestial_refresh_token', 'refresh-token', {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            accessToken: 'access-token',
            user: {
                id: 'user-1',
                email: 'a@test.com',
                tenantId: 'tenant-1',
                tenantSlug: 'tenant-slug',
            },
        });
    });
});
