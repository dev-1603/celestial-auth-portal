/**
 * Phone Auth Routes
 * 
 * Routes for phone-based authentication:
 * - /otp/send: Send OTP code to phone via SMS
 * - /otp/verify: Verify OTP code and login
 */

import { Router } from 'express'
import { sendPhoneOTP } from './otp-send.handler'
import { verifyPhoneOTP } from './otp-verify.handler'
import { createOTPSendRateLimiter } from '../../../middleware/rateLimit'

export const phoneAuthRouter = Router()

// Phone OTP (with rate limiting on send to prevent SMS cost abuse)
phoneAuthRouter.post('/otp/send', createOTPSendRateLimiter(), sendPhoneOTP)
phoneAuthRouter.post('/otp/verify', verifyPhoneOTP)
