/**
 * OAuth Auth Routes
 * 
 * Routes for OAuth authentication:
 * - /providers - Get list of enabled OAuth providers
 * - /:provider/initiate - Initiate OAuth flow (redirects to provider)
 * - /:provider/callback - Handle OAuth callback from provider
 */

import { Router } from 'express'
import { initiateOAuth, getOAuthProviders } from './initiate.handler'
import { handleOAuthCallback } from './callback.handler'

export const oauthRouter = Router()

// Get enabled OAuth providers
oauthRouter.get('/providers', getOAuthProviders)

// OAuth flow
oauthRouter.get('/:provider/initiate', initiateOAuth)
oauthRouter.get('/:provider/callback', handleOAuthCallback)
