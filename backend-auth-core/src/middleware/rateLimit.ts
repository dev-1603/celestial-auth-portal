/**
 * Rate Limiting Middleware
 * 
 * Reads rate limit configuration from auth.json and applies it to routes.
 * Uses express-rate-limit with config-driven limits.
 * 
 * Configuration comes from auth.json:
 * ```json
 * {
 *   "rateLimits": {
 *     "loginAttempts": 5,
 *     "windowMinutesLogin": 15,
 *     "otpRequests": 5,
 *     "windowMinutesOtp": 15,
 *     "perIp": 50,
 *     "perUser": 20
 *   }
 * }
 * ```
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { Request } from 'express'
import { getAuthConfig } from '../config/auth-config.loader'

/** Normalize IP for rate limit key (IPv6-safe). */
function ipKey(req: Request): string {
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown'
}

/**
 * Get rate limit config from auth.json
 */
function getRateLimitConfig() {
  const config = getAuthConfig()
  return config.rateLimits || {}
}

/**
 * Create a rate limiter for login attempts
 * Uses: loginAttempts, windowMinutesLogin from config
 */
export function createLoginRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.loginAttempts || 5
  const windowMs = (limits.windowMinutesLogin || 15) * 60 * 1000

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000 / 60), // minutes
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    keyGenerator: (req: Request) => {
      // Limit per IP + email combination
      const email = req.body?.email || ''
      return `${ipKey(req)}:${email}`
    },
    skip: (req: Request) => {
      // Skip rate limiting if email is not provided
      return !req.body?.email
    },
  })
}

/**
 * Create a rate limiter for OTP send requests
 * Uses: otpRequests, windowMinutesOtp from config
 * Limits per email address to prevent spam
 */
export function createOTPSendRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.otpRequests || 5
  const windowMs = (limits.windowMinutesOtp || 15) * 60 * 1000

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many OTP requests. Please wait before requesting another code.',
      retryAfter: Math.ceil(windowMs / 1000 / 60), // minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Limit per email or phone
      const identifier = req.body?.email || req.body?.phone || req.body?.target || ''
      return `${ipKey(req)}:${identifier}`
    },
    skip: (req: Request) => {
      // Skip if no identifier provided
      return !req.body?.email && !req.body?.phone && !req.body?.target
    },
  })
}

/**
 * Create a rate limiter for password reset requests
 * Uses: resetRequests, windowMinutesReset from config
 */
export function createPasswordResetRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.resetRequests || 3
  const windowMs = (limits.windowMinutesReset || 60) * 60 * 1000

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many password reset requests. Please wait before trying again.',
      retryAfter: Math.ceil(windowMs / 1000 / 60), // minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Limit per email
      const email = req.body?.email || ''
      return `${ipKey(req)}:${email}`
    },
    skip: (req: Request) => {
      return !req.body?.email
    },
  })
}

/**
 * Create a general IP-based rate limiter
 * Uses: perIp from config
 * For general endpoint protection
 */
export function createIPRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.perIp || 50
  const windowMs = 15 * 60 * 1000 // 15 minutes default

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return ipKey(req)
    },
  })
}

/**
 * Create a user-based rate limiter
 * Uses: perUser from config
 * For authenticated endpoints
 */
export function createUserRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.perUser || 20
  const windowMs = 15 * 60 * 1000 // 15 minutes default

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if available, otherwise fall back to IP
      const userId = (req as any).user?.id || ipKey(req)
      return `user:${userId}`
    },
  })
}

/**
 * Create a rate limiter for OAuth initiation
 * Prevents OAuth callback flooding
 */
export function createOAuthRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.perIp || 50 // Use perIp as fallback
  const windowMs = 15 * 60 * 1000

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many OAuth requests. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Limit per IP + provider
      const provider = req.params?.provider || ''
      return `${ipKey(req)}:oauth:${provider}`
    },
  })
}

/**
 * Create a rate limiter for magic link send requests
 * Uses same config as OTP send
 */
export function createMagicLinkRateLimiter() {
  const limits = getRateLimitConfig()
  const max = limits.otpRequests || 5 // Use OTP config
  const windowMs = (limits.windowMinutesOtp || 15) * 60 * 1000

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many magic link requests. Please wait before requesting another link.',
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Limit per email
      const email = req.body?.email || req.query?.email || ''
      return `${ipKey(req)}:${email}`
    },
    skip: (req: Request) => {
      return !req.body?.email && !req.query?.email
    },
  })
}
