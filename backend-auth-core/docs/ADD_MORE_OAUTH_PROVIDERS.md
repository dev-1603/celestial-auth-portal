# Adding More OAuth Providers to Current Implementation

## Current Providers (3)
1. Google
2. GitHub  
3. Microsoft

## How to Add a New Provider

### Step 1: Add Provider Config

Edit `src/services/oauth.service.ts`, add to the `providers` object:

```typescript
const providers: Record<string, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret'>> = {
  // ... existing providers ...
  
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
    scopes: ['tweet.read', 'users.read'],
  },
  
  apple: {
    id: 'apple',
    authorizationUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: 'https://appleid.apple.com/auth/userinfo', // Note: Apple may return user info in ID token
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
}
```

### Step 2: Add Normalization Logic

In `normalizeUserInfo()` function, add case for new provider:

```typescript
switch (providerId.toLowerCase()) {
  // ... existing cases ...
  
  case 'facebook':
    normalized.providerUserId = rawUserInfo.id || ''
    normalized.email = rawUserInfo.email || ''
    normalized.displayName = rawUserInfo.name || ''
    normalized.picture = rawUserInfo.picture?.data?.url || ''
    break
    
  case 'twitter':
    normalized.providerUserId = rawUserInfo.data?.id || ''
    normalized.email = rawUserInfo.data?.email || '' // May not be available
    normalized.displayName = rawUserInfo.data?.name || rawUserInfo.data?.username || ''
    normalized.picture = rawUserInfo.data?.profile_image_url || ''
    break
    
  case 'apple':
    // Apple returns user info in ID token, may need special handling
    normalized.providerUserId = rawUserInfo.sub || ''
    normalized.email = rawUserInfo.email || ''
    normalized.displayName = rawUserInfo.name || ''
    break
    
  case 'discord':
    normalized.providerUserId = rawUserInfo.id || ''
    normalized.email = rawUserInfo.email || ''
    normalized.displayName = rawUserInfo.username || rawUserInfo.global_name || ''
    normalized.picture = rawUserInfo.avatar ? `https://cdn.discordapp.com/avatars/${rawUserInfo.id}/${rawUserInfo.avatar}.png` : ''
    break
    
  case 'linkedin':
    normalized.providerUserId = rawUserInfo.sub || ''
    normalized.email = rawUserInfo.email || ''
    normalized.displayName = rawUserInfo.name || ''
    normalized.picture = rawUserInfo.picture || ''
    break
}
```

### Step 3: Add Environment Variables

Update `.env.example`:
```bash
# Facebook
OAUTH_FACEBOOK_CLIENT_ID=
OAUTH_FACEBOOK_CLIENT_SECRET=

# Twitter
OAUTH_TWITTER_CLIENT_ID=
OAUTH_TWITTER_CLIENT_SECRET=

# Apple
OAUTH_APPLE_CLIENT_ID=
OAUTH_APPLE_CLIENT_SECRET=
OAUTH_APPLE_TEAM_ID=  # Apple-specific
OAUTH_APPLE_KEY_ID=   # Apple-specific
OAUTH_APPLE_PRIVATE_KEY=  # Apple-specific (PEM format)

# Discord
OAUTH_DISCORD_CLIENT_ID=
OAUTH_DISCORD_CLIENT_SECRET=

# LinkedIn
OAUTH_LINKEDIN_CLIENT_ID=
OAUTH_LINKEDIN_CLIENT_SECRET=
```

### Step 4: Update Documentation

- Add provider to Developer Guide
- Update Postman collection
- Add provider setup instructions

### Step 5: Test

- Test OAuth flow with new provider
- Verify user info normalization
- Test account linking

## Provider-Specific Notes

### Facebook
- Requires app review for certain permissions
- Email may require additional permissions
- Picture URL structure is nested

### Twitter/X
- Uses OAuth 2.0 (newer API)
- Email may not be available in free tier
- Requires Twitter Developer account

### Apple
- Requires Apple Developer account ($99/year)
- Returns user info in ID token (JWT)
- May need to decode JWT for user info
- Requires team ID, key ID, and private key

### Discord
- Free to set up
- Avatar URL needs to be constructed
- Email requires `email` scope

### LinkedIn
- Uses OpenID Connect
- Requires LinkedIn Developer account
- May have rate limits

## Estimated Time per Provider

- **Simple providers (Discord, LinkedIn):** 30-60 minutes
- **Standard providers (Facebook, Twitter):** 1-2 hours
- **Complex providers (Apple):** 2-4 hours (due to special requirements)

## Total Providers That Can Be Added

Based on common OAuth providers, you could easily add:
- Facebook
- Twitter/X
- Apple
- Discord
- LinkedIn
- Slack
- Spotify
- Twitch
- And any OAuth 2.0/OIDC provider

**Estimated total:** 10-15 additional providers with 1-2 days of work
