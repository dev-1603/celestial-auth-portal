import { Router } from 'express'
import { getPasskeyRegistrationOptions } from './register-options.handler'
import { verifyPasskeyRegistrationHandler } from './register-verify.handler'
import { getPasskeyAuthenticationOptions } from './authenticate-options.handler'
import { verifyPasskeyAuthenticationHandler } from './authenticate-verify.handler'
import { authenticate } from '../../../middleware/authenticate'
import { createPasskeyRateLimiter } from '../../../middleware/rateLimit'

export const passkeyRouter = Router()

// Registration (requires auth - user must be logged in to add a passkey)
passkeyRouter.post('/register/options', authenticate, createPasskeyRateLimiter(), getPasskeyRegistrationOptions)
passkeyRouter.post('/register/verify', authenticate, createPasskeyRateLimiter(), verifyPasskeyRegistrationHandler)

// Authentication (no auth - this IS the login flow)
passkeyRouter.post('/authenticate/options', createPasskeyRateLimiter(), getPasskeyAuthenticationOptions)
passkeyRouter.post('/authenticate/verify', createPasskeyRateLimiter(), verifyPasskeyAuthenticationHandler)
