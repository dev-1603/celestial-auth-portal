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
  const providerLower = providerId.toLowerCase()

  // Exchange authorization code for access token
  // Different providers have different requirements
  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
  })

  // Add grant_type for providers that require it
  if (providerLower !== 'github' && providerLower !== 'slack') {
    tokenParams.append('grant_type', 'authorization_code')
  }

  // Set headers based on provider
  const tokenHeaders: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  }

  // Slack requires different content type
  if (providerLower === 'slack') {
    tokenHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: tokenHeaders,
    body: tokenParams,
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`OAuth token exchange failed: ${error}`)
  }

  let tokenData: any
  const contentType = tokenResponse.headers.get('content-type') || ''
  
  // Some providers return form-encoded, others return JSON
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await tokenResponse.text()
    tokenData = Object.fromEntries(new URLSearchParams(text))
  } else {
    tokenData = await tokenResponse.json()
  }
  
  // Extract access token (different providers use different field names)
  const accessToken = tokenData.access_token || tokenData.token || tokenData.authed_user?.access_token

  // Get user info from provider
  // Different providers require different header formats
  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  if (providerLower === 'github') {
    headers.Authorization = `token ${accessToken}`
  } else if (providerLower === 'twitter') {
    headers.Authorization = `Bearer ${accessToken}`
    // Twitter API v2 may need additional headers
  } else if (providerLower === 'twitch') {
    headers.Authorization = `Bearer ${accessToken}`
    headers['Client-Id'] = config.clientId // Twitch requires Client-Id header
  } else if (providerLower === 'slack') {
    // Slack uses form data for token exchange, but Bearer for user info
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${accessToken}`
  }

  // Some providers need special handling for user info endpoint
  let userInfoUrl = config.userInfoUrl
  let userInfoHeaders = { ...headers }

  // Twitch needs Client-Id in user info request
  if (providerLower === 'twitch') {
    userInfoHeaders['Client-Id'] = config.clientId
  }

  // Slack user info is part of token response (if using user token)
  if (providerLower === 'slack' && tokenData.authed_user?.user) {
    // Slack returns user info in token response for user tokens
    const userInfo = tokenData.authed_user.user
    return normalizeUserInfo(providerId, userInfo, accessToken)
  }

  const userInfoResponse = await fetch(userInfoUrl, {
    headers: userInfoHeaders,
  })

  if (!userInfoResponse.ok) {
    const errorText = await userInfoResponse.text()
    throw new Error(`Failed to fetch user info from OAuth provider: ${errorText}`)
  }

  let userInfo: any
  const userInfoContentType = userInfoResponse.headers.get('content-type') || ''
  if (userInfoContentType.includes('application/json')) {
    userInfo = await userInfoResponse.json()
  } else {
    // Some providers return text/plain or other formats
    const text = await userInfoResponse.text()
    try {
      userInfo = JSON.parse(text)
    } catch {
      throw new Error('Invalid user info response format')
    }
  }
  
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
  // Supports all common OAuth providers
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
    facebook: {
      id: 'facebook',
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/v18.0/me?fields=id,name,email,picture',
      scopes: ['email', 'public_profile'],
    },
    twitter: {
      id: 'twitter',
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      userInfoUrl: 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url',
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
    apple: {
      id: 'apple',
      authorizationUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      userInfoUrl: 'https://appleid.apple.com/auth/userinfo',
      scopes: ['name', 'email'],
    },
    discord: {
      id: 'discord',
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      scopes: ['identify', 'email'],
    },
    linkedin: {
      id: 'linkedin',
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
    slack: {
      id: 'slack',
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      userInfoUrl: 'https://slack.com/api/users.identity',
      scopes: ['identity.basic', 'identity.email', 'identity.avatar'],
    },
    spotify: {
      id: 'spotify',
      authorizationUrl: 'https://accounts.spotify.com/authorize',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      userInfoUrl: 'https://api.spotify.com/v1/me',
      scopes: ['user-read-email', 'user-read-private'],
    },
    twitch: {
      id: 'twitch',
      authorizationUrl: 'https://id.twitch.tv/oauth2/authorize',
      tokenUrl: 'https://id.twitch.tv/oauth2/token',
      userInfoUrl: 'https://api.twitch.tv/helix/users',
      scopes: ['user:read:email'],
    },
    gitlab: {
      id: 'gitlab',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      tokenUrl: 'https://gitlab.com/oauth/token',
      userInfoUrl: 'https://gitlab.com/api/v4/user',
      scopes: ['read_user'],
    },
    bitbucket: {
      id: 'bitbucket',
      authorizationUrl: 'https://bitbucket.org/site/oauth2/authorize',
      tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
      userInfoUrl: 'https://api.bitbucket.org/2.0/user',
      scopes: ['email'],
    },
    dropbox: {
      id: 'dropbox',
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropbox.com/oauth2/token',
      userInfoUrl: 'https://api.dropbox.com/2/users/get_current_account',
      scopes: ['account_info.read'],
    },
    reddit: {
      id: 'reddit',
      authorizationUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      userInfoUrl: 'https://oauth.reddit.com/api/v1/me',
      scopes: ['identity'],
    },
    zoom: {
      id: 'zoom',
      authorizationUrl: 'https://zoom.us/oauth/authorize',
      tokenUrl: 'https://zoom.us/oauth/token',
      userInfoUrl: 'https://api.zoom.us/v2/users/me',
      scopes: ['user:read'],
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

    case 'facebook':
      normalized.providerUserId = rawUserInfo.id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || ''
      normalized.picture = rawUserInfo.picture?.data?.url || rawUserInfo.picture || ''
      break

    case 'twitter':
      // Twitter API v2 returns data in nested structure
      const twitterData = rawUserInfo.data || rawUserInfo
      normalized.providerUserId = twitterData.id || ''
      normalized.email = twitterData.email || '' // May not be available
      normalized.displayName = twitterData.name || twitterData.username || ''
      normalized.picture = twitterData.profile_image_url || ''
      break

    case 'apple':
      // Apple returns user info in ID token (JWT), may need special handling
      // If userInfo is already decoded, use it directly
      normalized.providerUserId = rawUserInfo.sub || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || '' // May be in name object
      // Apple doesn't provide picture URL
      break

    case 'discord':
      normalized.providerUserId = rawUserInfo.id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.username || rawUserInfo.global_name || ''
      // Construct Discord avatar URL
      if (rawUserInfo.avatar) {
        normalized.picture = `https://cdn.discordapp.com/avatars/${rawUserInfo.id}/${rawUserInfo.avatar}.png`
      } else {
        normalized.picture = ''
      }
      break

    case 'linkedin':
      normalized.providerUserId = rawUserInfo.sub || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || ''
      normalized.picture = rawUserInfo.picture || ''
      break

    case 'slack':
      // Slack returns user info in nested structure
      const slackUser = rawUserInfo.user || rawUserInfo
      normalized.providerUserId = slackUser.id || rawUserInfo.user_id || ''
      normalized.email = slackUser.email || rawUserInfo.email || ''
      normalized.displayName = slackUser.name || slackUser.real_name || ''
      normalized.picture = slackUser.image_192 || slackUser.image_72 || ''
      break

    case 'spotify':
      normalized.providerUserId = rawUserInfo.id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.display_name || ''
      // Spotify provides images array
      normalized.picture = rawUserInfo.images?.[0]?.url || ''
      break

    case 'twitch':
      // Twitch returns array of users
      const twitchUser = Array.isArray(rawUserInfo.data) ? rawUserInfo.data[0] : rawUserInfo
      normalized.providerUserId = twitchUser.id || ''
      normalized.email = twitchUser.email || ''
      normalized.displayName = twitchUser.display_name || twitchUser.login || ''
      normalized.picture = twitchUser.profile_image_url || ''
      break

    case 'gitlab':
      normalized.providerUserId = rawUserInfo.id?.toString() || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name || rawUserInfo.username || ''
      normalized.picture = rawUserInfo.avatar_url || ''
      break

    case 'bitbucket':
      normalized.providerUserId = rawUserInfo.uuid || rawUserInfo.account_id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.display_name || rawUserInfo.username || ''
      normalized.picture = rawUserInfo.links?.avatar?.href || ''
      break

    case 'dropbox':
      normalized.providerUserId = rawUserInfo.account_id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.name?.display_name || rawUserInfo.name?.given_name || ''
      normalized.picture = rawUserInfo.profile_photo_url || ''
      break

    case 'reddit':
      normalized.providerUserId = rawUserInfo.id || rawUserInfo.name || ''
      normalized.email = rawUserInfo.email || '' // May require additional scope
      normalized.displayName = rawUserInfo.name || ''
      normalized.picture = rawUserInfo.icon_img || rawUserInfo.snoovatar_img || ''
      break

    case 'zoom':
      normalized.providerUserId = rawUserInfo.id || ''
      normalized.email = rawUserInfo.email || ''
      normalized.displayName = rawUserInfo.display_name || rawUserInfo.first_name || ''
      normalized.picture = rawUserInfo.pic_url || ''
      break

    default:
      // Generic fallback for any OAuth 2.0/OIDC provider
      normalized.providerUserId = rawUserInfo.sub || rawUserInfo.id || rawUserInfo.user_id || ''
      normalized.email = rawUserInfo.email || rawUserInfo.mail || ''
      normalized.displayName = rawUserInfo.name || rawUserInfo.displayName || rawUserInfo.username || ''
      normalized.picture = rawUserInfo.picture || rawUserInfo.avatar_url || rawUserInfo.avatar || ''
  }

  if (!normalized.providerUserId || !normalized.email) {
    throw new Error(`Invalid user info from OAuth provider ${providerId}`)
  }

  return normalized
}
