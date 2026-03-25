/**
 * SSO Auth Routes
 *
 * Routes for SSO authentication:
 * - /providers          - Get list of enabled SSO providers
 * - /:provider/initiate - Initiate SSO flow (redirects to IdP)
 * - /:provider/callback - Handle SSO callback (SAML POST binding + OIDC GET)
 * - /metadata           - Get SAML SP metadata XML
 */

import { Router } from 'express'
import { getSSOProviders } from './providers.handler'
import { initiateSSO } from './initiate.handler'
import { handleSSOCallback } from './callback.handler'
import { getSAMLMetadata } from './metadata.handler'
import { createSSOInitiateRateLimiter } from '../../../middleware/rateLimit'

export const ssoRouter = Router()

// Get enabled SSO providers
ssoRouter.get('/providers', getSSOProviders)

// SSO flow (with rate limiting to prevent flooding)
ssoRouter.get('/:provider/initiate', createSSOInitiateRateLimiter(), initiateSSO)
ssoRouter.post('/:provider/callback', handleSSOCallback) // SAML POST binding
ssoRouter.get('/:provider/callback', handleSSOCallback) // OIDC GET callback

// SAML SP metadata
ssoRouter.get('/metadata', getSAMLMetadata)
