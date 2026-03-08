/**
 * MFA Routes
 * 
 * Routes for Multi-Factor Authentication:
 * - /enable - Generate TOTP secret and QR code
 * - /verify-setup - Verify TOTP code during setup
 * - /verify - Verify MFA code during login
 * - /disable - Disable MFA (requires password)
 */

import { Router } from 'express'
import { enableMFA } from './enable.handler'
import { verifyMFASetup } from './verify-setup.handler'
import { verifyMFA } from './verify.handler'
import { disableMFA } from './disable.handler'
import { authenticate } from '../../../middleware/authenticate'

export const mfaRouter = Router()

// MFA setup (requires authentication)
mfaRouter.post('/enable', authenticate, enableMFA)
mfaRouter.post('/verify-setup', authenticate, verifyMFASetup)

// MFA verification during login (no auth required - called after initial login)
mfaRouter.post('/verify', verifyMFA)

// MFA management (requires authentication + password)
mfaRouter.post('/disable', authenticate, disableMFA)
