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
import { authenticate } from '../../../middleware/authenticate';

export const emailAuthRouter = Router();

// Email/password login
emailAuthRouter.post('/login', loginWithEmailPassword);

// Email OTP
emailAuthRouter.post('/otp/send', sendEmailOTP);
emailAuthRouter.post('/otp/verify', verifyEmailOTP);

// Session management
emailAuthRouter.post('/logout', logout);
emailAuthRouter.post('/refresh', refreshToken);
emailAuthRouter.get('/me', authenticate, getMe);
