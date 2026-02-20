// src/lib/__tests__/jwt.test.ts
import { describe, it, expect, vi } from 'vitest'

// mock authConfig BEFORE importing ../jwt
vi.mock('../../config/auth.config', () => ({
    authConfig: {
        jwt: {
            accessSecret: 'test-access-secret-32-chars-long-enough',
            refreshSecret: 'test-refresh-secret-32-chars-long-enough',
            accessExpiry: '15m',
            refreshExpiry: '7d',
        },
    },
}))

import {
    JWTPayload,
    signAccessToken,
    signRefreshToken,
    signTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
} from '../jwt'

const mockPayload: JWTPayload = {
    userId: 'user-123',
    tenantId: 'tenant-456',
    email: 'user@example.com',
    role: 'admin',
    clientId: 'client-789',
    apps: [
        { key: 'app-1', role: 'owner' },
        { key: 'app-2', role: 'viewer' },
    ],
}

describe('jwt', () => {
    it('signAccessToken returns a JWT string', () => {
        const token = signAccessToken(mockPayload)
        expect(typeof token).toBe('string')
        expect(token.split('.')).toHaveLength(3)
    })

    it('access token contains correct payload', () => {
        const token = signAccessToken(mockPayload)
        const decoded = verifyAccessToken(token)
        expect(decoded.userId).toBe(mockPayload.userId)
        expect(decoded.email).toBe(mockPayload.email)
        expect(decoded.role).toBe(mockPayload.role)
    })

    it('signRefreshToken returns JWT without email/role', () => {
        const token = signRefreshToken({
            userId: mockPayload.userId,
            tenantId: mockPayload.tenantId,
        })
        const decoded = verifyRefreshToken(token)
        expect(decoded.userId).toBe(mockPayload.userId)
        expect((decoded as any).email).toBeUndefined()
        expect((decoded as any).role).toBeUndefined()
    })

    it('signTokenPair returns access and refresh tokens', () => {
        const pair = signTokenPair(mockPayload)
        expect(typeof pair.accessToken).toBe('string')
        expect(typeof pair.refreshToken).toBe('string')
        expect(pair.accessToken.split('.')).toHaveLength(3)
        expect(pair.refreshToken.split('.')).toHaveLength(3)
    })

    it('verifyAccessToken throws for invalid token', () => {
        expect(() => verifyAccessToken('not-a-token')).toThrow()
    })

    it('verifyRefreshToken throws when given access token', () => {
        const access = signAccessToken(mockPayload)
        expect(() => verifyRefreshToken(access)).toThrow()
    })

    it('decodeToken returns payload for valid token', () => {
        const token = signAccessToken(mockPayload)
        const decoded = decodeToken(token)
        expect(decoded?.userId).toBe(mockPayload.userId)
    })

    it('decodeToken returns null for garbage', () => {
        expect(decodeToken('not-a-token')).toBeNull()
    })
})
