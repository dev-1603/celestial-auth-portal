/**
 * BFF-only OAuth: build authorize URL and exchange code in Nuxt (no backend dependency for OAuth).
 * Provider secrets (OAUTH_*_CLIENT_ID, OAUTH_*_CLIENT_SECRET) must be set in Nuxt server env.
 */

export interface OAuthBffProviderMeta {
  id: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl: string
  scopes: string[]
  /** If true, send code_verifier in token request (PKCE). */
  usePkce?: boolean
}

export interface OAuthBffUserInfo {
  providerId: string
  providerUserId: string
  email: string
  displayName?: string
  picture?: string
  metadata?: Record<string, unknown>
}

const PROVIDER_META: Record<string, OAuthBffProviderMeta> = {
  google: {
    id: 'google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    usePkce: true,
  },
  github: {
    id: 'github',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['user:email'],
    usePkce: false,
  },
  microsoft: {
    id: 'microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile'],
    usePkce: true,
  },
}

function getBffProviderConfig(providerId: string): OAuthBffProviderMeta & { clientId: string; clientSecret: string } {
  const meta = PROVIDER_META[providerId.toLowerCase()]
  if (!meta) {
    throw new Error(`Unknown OAuth provider: ${providerId}. Supported: ${Object.keys(PROVIDER_META).join(', ')}`)
  }
  const upperId = providerId.toUpperCase().replace(/-/g, '_')
  const clientId = process.env[`OAUTH_${upperId}_CLIENT_ID`] ?? ''
  const clientSecret = process.env[`OAUTH_${upperId}_CLIENT_SECRET`] ?? ''
  if (!clientId || !clientSecret) {
    throw new Error(
      `OAuth provider ${providerId} not configured in Nuxt. Set OAUTH_${upperId}_CLIENT_ID and OAUTH_${upperId}_CLIENT_SECRET in .env`,
    )
  }
  return { ...meta, clientId, clientSecret }
}

/**
 * Build IdP authorization URL. Use from BFF initiate handler only.
 */
export function getBffOAuthAuthorizationUrl(
  providerId: string,
  redirectUri: string,
  state: string,
  codeChallenge?: string,
): string {
  const config = getBffProviderConfig(providerId)
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  })
  if (config.usePkce && codeChallenge) {
    params.set('code_challenge', codeChallenge)
    params.set('code_challenge_method', 'S256')
  }
  return `${config.authorizationUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens and fetch user info. Use from BFF callback only.
 */
export async function exchangeCodeForUserInfo(
  providerId: string,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<OAuthBffUserInfo> {
  const config = getBffProviderConfig(providerId)
  const pl = providerId.toLowerCase()

  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
  })
  if (pl !== 'github' && pl !== 'slack') {
    tokenParams.append('grant_type', 'authorization_code')
  }
  if (config.usePkce && codeVerifier) {
    tokenParams.set('code_verifier', codeVerifier)
  }

  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: tokenParams,
  })
  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`OAuth token exchange failed: ${err}`)
  }

  const contentType = tokenRes.headers.get('content-type') ?? ''
  let tokenData: Record<string, unknown>
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await tokenRes.text()
    tokenData = Object.fromEntries(new URLSearchParams(text)) as Record<string, unknown>
  } else {
    tokenData = (await tokenRes.json()) as Record<string, unknown>
  }

  const accessToken =
    (tokenData.access_token as string) ??
    (tokenData.token as string) ??
    ((tokenData as any).authed_user as any)?.access_token
  if (!accessToken) {
    throw new Error('OAuth response missing access_token')
  }

  const headers: HeadersInit = { Accept: 'application/json' }
  if (pl === 'github') {
    (headers as Record<string, string>)['Authorization'] = `token ${accessToken}`
  } else {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
  }

  const userInfoRes = await fetch(config.userInfoUrl, { headers })
  if (!userInfoRes.ok) {
    throw new Error(`Failed to fetch user info: ${await userInfoRes.text()}`)
  }
  const userInfo = (await userInfoRes.json()) as Record<string, unknown>

  // Helpful for debugging provider responses during integration.
  // Safe to keep in dev; consider removing or downgrading to debug-level in production logging.
  // eslint-disable-next-line no-console
  console.log(`[oauthBff] raw user info for ${providerId}:`, JSON.stringify(userInfo, null, 2))

  return normalizeBffUserInfo(providerId, userInfo, accessToken)
}

function normalizeBffUserInfo(
  providerId: string,
  raw: Record<string, unknown>,
  _accessToken: string,
): OAuthBffUserInfo {
  const pl = providerId.toLowerCase()
  const out: OAuthBffUserInfo = {
    providerId,
    providerUserId: '',
    email: '',
    displayName: '',
    picture: '',
  }

  switch (pl) {
    case 'google': {
      const g = raw as any
      // Google userinfo v2 returns "id"; OIDC-style userinfo can return "sub".
      out.providerUserId = (g.sub as string) ?? (g.id as string) ?? ''
      out.email = (g.email as string) ?? ''
      out.displayName = (g.name as string) ?? (g.given_name as string) ?? ''
      out.picture = (g.picture as string) ?? ''
      break
    }
    case 'github':
      out.providerUserId = String(raw.id ?? '')
      out.email = (raw.email as string) ?? ''
      out.displayName = (raw.name as string) ?? (raw.login as string) ?? ''
      out.picture = (raw.avatar_url as string) ?? ''
      break
    case 'microsoft':
      out.providerUserId = (raw.id as string) ?? (raw.sub as string) ?? ''
      out.email = (raw.mail as string) ?? (raw.userPrincipalName as string) ?? ''
      out.displayName = (raw.displayName as string) ?? ''
      out.picture = (raw.photo as string) ?? ''
      break
    default:
      out.providerUserId = (raw.sub as string) ?? (raw.id as string) ?? ''
      out.email = (raw.email as string) ?? (raw.mail as string) ?? ''
      out.displayName = (raw.name as string) ?? (raw.displayName as string) ?? ''
      out.picture = (raw.picture as string) ?? (raw.avatar_url as string) ?? ''
  }

  // Be tolerant in dev: try one more time to backfill IDs/emails from common fields
  if (!out.providerUserId) {
    out.providerUserId = (raw.sub as string) ?? (raw.id as string) ?? ''
  }
  if (!out.email) {
    out.email = (raw.email as string) ?? (raw.mail as string) ?? ''
  }

  if (!out.providerUserId || !out.email) {
    // eslint-disable-next-line no-console
    console.warn(
      `[oauthBff] Incomplete user info from OAuth provider ${providerId}. ` +
        `providerUserId="${out.providerUserId}", email="${out.email}"`,
    )
  }

  return out
}

/**
 * List provider IDs that have env configured in this BFF (for optional provider list).
 */
export function getConfiguredBffProviders(): string[] {
  return Object.keys(PROVIDER_META).filter((id) => {
    const upperId = id.toUpperCase().replace(/-/g, '_')
    return (
      (process.env[`OAUTH_${upperId}_CLIENT_ID`]?.length ?? 0) > 0 &&
      (process.env[`OAUTH_${upperId}_CLIENT_SECRET`]?.length ?? 0) > 0
    )
  })
}
