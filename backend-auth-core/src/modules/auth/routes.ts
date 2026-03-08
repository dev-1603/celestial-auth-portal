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
import { isMethodEnabled } from '../../config/auth-config.loader'
import { emailAuthRouter } from './email/routes'

const router = Router()

// Email/password auth - mount if email_password is enabled
if (isMethodEnabled('email_password')) {
  router.use('/email', emailAuthRouter)
}

// TODO: Add other method routers as they are implemented:
// if (isMethodEnabled('phone_sms_otp')) {
//   router.use('/phone', phoneAuthRouter)
// }
// if (isMethodEnabled('oauth')) {
//   router.use('/oauth', oauthRouter)
// }
// if (isMethodEnabled('magic_link')) {
//   router.use('/magic-link', magicLinkRouter)
// }

export default router
