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

export const phoneAuthRouter = Router()

// Phone OTP
phoneAuthRouter.post('/otp/send', sendPhoneOTP)
phoneAuthRouter.post('/otp/verify', verifyPhoneOTP)
