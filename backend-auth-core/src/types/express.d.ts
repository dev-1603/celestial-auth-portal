import type { JWTPayload } from '../lib/jwt'

declare module 'express-serve-static-core' {
    interface Request {
        user?: JWTPayload
    }
}