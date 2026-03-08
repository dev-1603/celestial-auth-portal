/**
 * OAuth Service Abstraction
 * 
 * Provides a unified interface for OAuth2/OIDC flows.
 * Supports multiple providers (Google, GitHub, Microsoft, etc.)
 * 
 * Usage:
 * ```typescript
 * import { getOAuthAuthorizationUrl, handleOAuthCallback } from './services/oauth.service'
 * 
 * // Initiate OAuth flow
 * const authUrl = getOAuthAuthorizationUrl('google', 'http://localhost:3000/callback')
 * 
 * // Handle callback
 * const userInfo = await handleOAuthCallback('google', code, state)
 * ```
 */

import { env } from '../config/env.config'
import * as crypto from 'crypto'

export interface OAuthProviderConfig {
  id: string
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl: string
  scopes: string[]
}

export interface OAuthUserInfo {
  providerId: string
  providerUserId: string // OAuth sub/ID
  email: string
  displayName?: string
  picture?: string
  metadata?: Record<string, any>
}

/**
 * Generate OAuth state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get OAuth authorization URL for a provider
 */
export function getOAuthAuthorizationUrl(
  providerId: string,
  redirectUri: string,
  state: string,
): string {
  const config = getProviderConfig(providerId)
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  })

  return `${config.authorizationUrl}?${params.toString()}`
}

/**
 * Handle OAuth callback - exchange code for tokens and get user info
 */
export async function handleOAuthCallback(
  providerId: string,
  code: string,
  redirectUri: string,
): Promise<OAuthUserInfo> {
  const config = getProviderConfig(providerId)

  // Exchange authorization code for access token
  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
  })

  // GitHub uses different grant_type
  if (providerId.toLowerCase() !== 'github') {
    tokenParams.append('grant_type', 'authorization_code')
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: tokenParams,
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`OAuth token exchange failed: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  // GitHub returns access_token directly, others may return in different format
  const accessToken = tokenData.access_token || tokenData.token

  // Get user info from provider
  // GitHub requires different header format
  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  if (providerId.toLowerCase() === 'github') {
    headers.Authorization = `token ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const userInfoResponse = await fetch(config.userInfoUrl, {
    headers,
  })

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user info from OAuth provider')
  }

  const userInfo = await userInfoResponse.json()
  
  // Normalize user info based on provider
  return await normalizeUserInfo(providerId, userInfo, accessToken)
}

/**
 * Get provider configuration from environment variables
 */
function getProviderConfig(providerId: string): OAuthProviderConfig {
  const upperId = providerId.toUpperCase()
  
  const clientId = process.env[`OAUTH_${upperId}_CLIENT_ID`] || ''
  const clientSecret = process.env[`OAUTH_${upperId}_CLIENT_SECRET`] || ''

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth provider ${providerId} not configured. Set OAUTH_${upperId}_CLIENT_ID and OAUTH_${upperId}_CLIENT_SECRET`)
  }

  // Provider-specific configurations
  const providers: Record<string, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret'>> = {
    google: {
      id: 'google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
    },
    github: {
      id: 'github',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['user:email'],
    },
    microsoft: {
      id: 'microsoft',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: ['openid', 'email', 'profile'],
    },
  }

  const provider = providers[providerId.toLowerCase()]
  if (!provider) {
    throw new Error(`Unsupported OAuth provider: ${providerId}`)
  }

  return {
    ...provider,
    clientId,
    clientSecret,
  }
}

/**
 * Normalize user info from different OAuth providers
 */
async function normalizeUserInfo(providerId: string, rawUserInfo: any, accessToken?: string): Promise<OAuthUserInfo> {
  const normalized: OAuthUserInfo = {
    providerId: providerId.toLowerCase(),
    providerUserId: '',
    email: '',
    metadata: rawUserInfo,
  }

  switch (providerId.toLowerCase()) {
    case 'google':
      normalized.providerUserId = rawUserInfo.sub || rawUserInfo.id
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || ''
      normalized.picture = rawUserInfo.picture || ''
      break

    case 'github':
      normalized.providerUserId = rawUserInfo.id?.toString() || ''
      // GitHub email might be null if not public - need to fetch from emails endpoint
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || rawUserInfo.login || ''
      normalized.picture = rawUserInfo.avatar_url || ''
      // If email is not in user info, try to get from emails endpoint
      if (!normalized.email && accessToken) {
        try {
          const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `token ${accessToken}`,
              Accept: 'application/json',
            },
          })
          if (emailsResponse.ok) {
            const emails = await emailsResponse.json()
            const primaryEmail = emails.find((e: any) => e.primary) || emails[0]
            if (primaryEmail) {
              normalized.email = primaryEmail.email
            }
          }
        } catch (e) {
          // Ignore email fetch errors - email might be optional
        }
      }
      break

    case 'microsoft':
      normalized.providerUserId = rawUserInfo.id || rawUserInfo.sub || ''
      normalized.email = rawUserInfo.mail || rawUserInfo.userPrincipalName || ''
      normalized.displayName = rawUserInfo.displayName || ''
      normalized.picture = rawUserInfo.photo || ''
      break

    default:
      // Generic fallback
      normalized.providerUserId = rawUserInfo.sub || rawUserInfo.id || rawUserInfo.user_id || ''
      normalized.email = rawUserInfo.email || rawUserInfo.mail || ''
      normalized.displayName = rawUserInfo.name || rawUserInfo.displayName || ''
      normalized.picture = rawUserInfo.picture || rawUserInfo.avatar_url || ''
  }

  if (!normalized.providerUserId || !normalized.email) {
    throw new Error(`Invalid user info from OAuth provider ${providerId}`)
  }

  return normalized
}
