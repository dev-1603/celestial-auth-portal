/**
 * Email Auth Routes
 * 
 * Routes for email-based authentication:
 * - /login: Email/password login
 * - /otp/send: Send OTP code to email
 * - /otp/verify: Verify OTP code and login
 * - /logout: Logout (clear refresh cookie)
 * - /refresh: Refresh access token
 * - /me: Get current user (requires auth)
 */

import { Router } from 'express';
import { loginWithEmailPassword } from './login.handler';
import { sendEmailOTP } from './otp-send.handler';
import { verifyEmailOTP } from './otp-verify.handler';
import { logout } from './logout.handler';
import { getMe } from './me.handler';
import { refreshToken } from './refresh.handler';
import { requestPasswordReset } from './password-reset-request.handler';
import { completePasswordReset } from './password-reset-complete.handler';
import { registerWithEmail } from './register.handler';
import { requestAccess } from './request-access.handler';
import { authenticate } from '../../../middleware/authenticate';
import { createLoginRateLimiter, createOTPSendRateLimiter, createPasswordResetRateLimiter, createIPRateLimiter, createRegistrationRateLimiter } from '../../../middleware/rateLimit';

export const emailAuthRouter = Router();

// Email/password login (with rate limiting)
emailAuthRouter.post('/login', createLoginRateLimiter(), loginWithEmailPassword);

// Email OTP (with rate limiting)
emailAuthRouter.post('/otp/send', createOTPSendRateLimiter(), sendEmailOTP);
emailAuthRouter.post('/otp/verify', verifyEmailOTP);

// Password reset (with rate limiting)
emailAuthRouter.post('/password-reset/request', createPasswordResetRateLimiter(), requestPasswordReset);
emailAuthRouter.post('/password-reset/verify', completePasswordReset);
emailAuthRouter.get('/password-reset/verify', completePasswordReset); // Support GET for email links

// Session management (with rate limiting)
emailAuthRouter.post('/logout', createIPRateLimiter(), logout);
emailAuthRouter.post('/refresh', createIPRateLimiter(), refreshToken);
emailAuthRouter.get('/me', authenticate, getMe);

// Email registration (with rate limiting)
emailAuthRouter.post('/register', createRegistrationRateLimiter(), registerWithEmail);

// Request access / waiting list (with rate limiting)
emailAuthRouter.post('/request-access', createRegistrationRateLimiter(), requestAccess);
