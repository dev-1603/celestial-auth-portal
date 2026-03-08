/**
 * Magic Link Auth Routes
 * 
 * Routes for magic link authentication:
 * - /send: Send magic link to email
 * - /verify: Verify magic link token and login (GET or POST)
 */

import { Router } from 'express'
import { sendMagicLink } from './send.handler'
import { verifyMagicLink } from './verify.handler'

export const magicLinkRouter = Router()

// Send magic link
magicLinkRouter.post('/send', sendMagicLink)

// Verify magic link (supports both GET for browser links and POST for API)
magicLinkRouter.get('/verify', verifyMagicLink)
magicLinkRouter.post('/verify', verifyMagicLink)
