/**
 * QR Login Routes
 *
 * Routes for QR-code-based authentication:
 * - POST /generate  : Create a new QR login session and return the QR image
 * - GET  /status/:sessionId : Poll the session status (pending/scanned/confirmed/expired)
 * - POST /confirm   : Authenticated user confirms the QR login (mobile side)
 */

import { Router } from 'express'
import { generateQRSession } from './generate.handler'
import { getQRSessionStatus } from './status.handler'
import { confirmQRLogin } from './confirm.handler'
import { authenticate } from '../../../middleware/authenticate'
import { createQRGenerateRateLimiter, createIPRateLimiter } from '../../../middleware/rateLimit'

export const qrRouter = Router()

qrRouter.post('/generate', createQRGenerateRateLimiter(), generateQRSession)
qrRouter.get('/status/:sessionId', createIPRateLimiter(), getQRSessionStatus)
qrRouter.post('/confirm', authenticate, confirmQRLogin)
