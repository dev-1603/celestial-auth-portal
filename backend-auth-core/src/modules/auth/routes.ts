/**
 * Auth module router.
 * 
 * Mounts sub-modules with their prefix based on enabled methods in auth config.
 * Only methods enabled in auth.json (via auth-config.loader) are mounted.
 * 
 * Routes are mounted as:
 * - /api/v1/auth/email/* for email_password
 * - /api/v1/auth/phone/* for phone_sms_otp
 * - /api/v1/auth/oauth/* for oauth
 * - /api/v1/auth/magic-link/* for magic_link
 * etc.
 */
import { Router } from 'express'
import { isMethodEnabledToMount, isMFAEnabled } from '../../config/auth-config.loader'
import { createIPRateLimiter } from '../../middleware/rateLimit'
import { emailAuthRouter } from './email/routes'
import { magicLinkRouter } from './magic-link/routes'
import { phoneAuthRouter } from './phone/routes'
import { oauthRouter } from './oauth/routes'
import { mfaRouter } from './mfa/routes'

const router = Router()

// Apply global IP rate limiter to all auth endpoints
router.use(createIPRateLimiter())

// Email/password auth - mount if email_password is enabled (checks both enabledMethods and methodsConfig)
if (isMethodEnabledToMount('email_password')) {
  router.use('/email', emailAuthRouter)
}

// Magic link auth - mount if magic_link is enabled (checks both enabledMethods and methodsConfig)
if (isMethodEnabledToMount('magic_link')) {
  router.use('/magic-link', magicLinkRouter)
}

// Phone OTP auth - mount if phone_sms_otp is enabled (checks both enabledMethods and methodsConfig)
if (isMethodEnabledToMount('phone_sms_otp')) {
  router.use('/phone', phoneAuthRouter)
}

// OAuth auth - mount if oauth is enabled (checks both enabledMethods and methodsConfig)
if (isMethodEnabledToMount('oauth')) {
  router.use('/oauth', oauthRouter)
}

// MFA - mount if MFA is enabled in config
if (isMFAEnabled()) {
  router.use('/mfa', mfaRouter)
}

export default router
