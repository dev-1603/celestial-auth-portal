import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'
import express, { type Request, type Response } from 'express'
// add at top with other imports
import errorHandler from '../../middleware/errorHandler'



// Mock jwt lib so tests don’t depend on real secrets/jsonwebtoken
vi.mock('../../lib/jwt', () => ({
    signAccessToken: (payload: any) => `signed-token-for-${payload.userId}`,
    verifyAccessToken: (token: string) => {
        if (!token.startsWith('signed-token-for-')) {
            throw new Error('invalid token')
        }

        const userId = token.replace('signed-token-for-', '')
        return {
            userId,
            tenantId: 'tenant-456',
            email: 'user@example.com',
            role: 'admin',
        }
    },
}))

import { authenticate } from '../authenticate'
import { signAccessToken } from '../../lib/jwt'

const mockPayload = {
    userId: 'user-123',
    tenantId: 'tenant-456',
    email: 'user@example.com',
    role: 'admin',
}

let app: express.Express

beforeAll(() => {
    app = express()

    app.get('/public', (_req: Request, res: Response) => {
        res.status(200).json({ ok: true })
    })

    app.get('/protected', authenticate, (req: any, res: Response) => {
        res.status(200).json({ userId: req.user.userId })
    })
    // inside beforeAll, after routes:
    app.use(errorHandler)
})

describe('authenticate middleware', () => {
    it('allows access to public route without token', async () => {
        const res = await request(app).get('/public')
        expect(res.status).toBe(200)
        expect(res.body.ok).toBe(true)
    })

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/protected')
        expect(res.status).toBe(401)
        expect(res.body.error).toBeDefined()
    })

    it('returns 401 for malformed Authorization header', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Token xyz')

        expect(res.status).toBe(401)
    })

    it('returns 401 for invalid token value', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer not-a-valid-token')

        expect(res.status).toBe(401)
    })

    it('allows access for valid token and exposes user on req', async () => {
        const token = signAccessToken(mockPayload)

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.userId).toBe(mockPayload.userId)
    })
})
