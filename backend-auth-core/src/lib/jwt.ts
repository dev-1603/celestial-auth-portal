// src/lib/jwt.ts
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { authConfig } from '../config/auth.config'

export type GlobalRole = 'USER' | 'ADMIN' | 'OWNER'

export interface JWTPayload {
    userId: string
    tenantId: string
    email: string
    role: GlobalRole
    clientId?: string
    tenantSlug?: string
    apps?: {
        key: string
        role: string
    }[]
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
}

const accessSecret: Secret = authConfig.jwt.accessSecret as Secret
const refreshSecret: Secret = authConfig.jwt.refreshSecret as Secret

const accessOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: authConfig.jwt.accessExpiry as SignOptions['expiresIn'],
}

const refreshOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: authConfig.jwt.refreshExpiry as SignOptions['expiresIn'],
}

export const signAccessToken = (payload: JWTPayload): string =>
    jwt.sign(payload, accessSecret, accessOptions)

export const signRefreshToken = (
    payload: Pick<JWTPayload, 'userId' | 'tenantId'>,
): string =>
    jwt.sign(payload, refreshSecret, refreshOptions)

export const signTokenPair = (payload: JWTPayload): TokenPair => ({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({
        userId: payload.userId,
        tenantId: payload.tenantId,
    }),
})

export const verifyAccessToken = (token: string): JWTPayload =>
    jwt.verify(token, accessSecret) as JWTPayload

export const verifyRefreshToken = (
    token: string,
): Pick<JWTPayload, 'userId' | 'tenantId'> =>
    jwt.verify(token, refreshSecret) as Pick<JWTPayload, 'userId' | 'tenantId'>

export const decodeToken = (token: string): JWTPayload | null =>
    jwt.decode(token) as JWTPayload | null
