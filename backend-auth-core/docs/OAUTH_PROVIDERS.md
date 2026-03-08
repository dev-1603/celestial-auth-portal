# OAuth Providers Support

## Supported Providers

The OAuth service now supports **16 OAuth providers**:

### Currently Implemented (16 providers)

1. **Google** - OAuth2 + OpenID Connect
2. **GitHub** - OAuth2
3. **Microsoft** - OAuth2 + OpenID Connect
4. **Facebook** - OAuth2
5. **Twitter/X** - OAuth2 (API v2)
6. **Apple** - OAuth2 (Sign in with Apple)
7. **Discord** - OAuth2
8. **LinkedIn** - OAuth2 + OpenID Connect
9. **Slack** - OAuth2
10. **Spotify** - OAuth2
11. **Twitch** - OAuth2
12. **GitLab** - OAuth2
13. **Bitbucket** - OAuth2
14. **Dropbox** - OAuth2
15. **Reddit** - OAuth2
16. **Zoom** - OAuth2

## Provider-Specific Notes

### Google ✅
- **Scopes:** `openid`, `email`, `profile`
- **User Info:** `sub`, `email`, `name`, `picture`
- **Status:** Fully tested

### GitHub ✅
- **Scopes:** `user:email`
- **User Info:** `id`, `email` (fetched from `/user/emails` if not public), `name`/`login`, `avatar_url`
- **Special:** Fetches email from emails endpoint if not in user info
- **Status:** Fully tested

### Microsoft ✅
- **Scopes:** `openid`, `email`, `profile`
- **User Info:** `id`/`sub`, `mail`/`userPrincipalName`, `displayName`, `photo`
- **Status:** Fully tested

### Facebook
- **Scopes:** `email`, `public_profile`
- **User Info:** `id`, `email`, `name`, `picture.data.url`
- **Note:** Requires Facebook App review for certain permissions
- **Status:** Implemented, needs testing

### Twitter/X
- **Scopes:** `tweet.read`, `users.read`, `offline.access`
- **User Info:** Nested in `data` object: `id`, `email` (may not be available), `name`/`username`, `profile_image_url`
- **Note:** Email may not be available in free tier
- **Status:** Implemented, needs testing

### Apple
- **Scopes:** `name`, `email`
- **User Info:** `sub`, `email`, `name` (may be in object)
- **Note:** Requires Apple Developer account ($99/year), returns user info in ID token (JWT)
- **Status:** Implemented, needs special JWT handling

### Discord
- **Scopes:** `identify`, `email`
- **User Info:** `id`, `email`, `username`/`global_name`, avatar URL constructed from `avatar` field
- **Status:** Implemented, needs testing

### LinkedIn
- **Scopes:** `openid`, `profile`, `email`
- **User Info:** `sub`, `email`, `name`, `picture`
- **Note:** Requires LinkedIn Developer account
- **Status:** Implemented, needs testing

### Slack
- **Scopes:** `identity.basic`, `identity.email`, `identity.avatar`
- **User Info:** Returns in token response as `authed_user.user`
- **Note:** User info may be in token response, not separate endpoint
- **Status:** Implemented with special handling

### Spotify
- **Scopes:** `user-read-email`, `user-read-private`
- **User Info:** `id`, `email`, `display_name`, `images[0].url`
- **Status:** Implemented, needs testing

### Twitch
- **Scopes:** `user:read:email`
- **User Info:** Returns array in `data[0]`: `id`, `email`, `display_name`/`login`, `profile_image_url`
- **Note:** Requires `Client-Id` header in user info request
- **Status:** Implemented with special header handling

### GitLab
- **Scopes:** `read_user`
- **User Info:** `id`, `email`, `name`/`username`, `avatar_url`
- **Status:** Implemented, needs testing

### Bitbucket
- **Scopes:** `email`
- **User Info:** `uuid`/`account_id`, `email`, `display_name`/`username`, `links.avatar.href`
- **Status:** Implemented, needs testing

### Dropbox
- **Scopes:** `account_info.read`
- **User Info:** `account_id`, `email`, `name.display_name`, `profile_photo_url`
- **Status:** Implemented, needs testing

### Reddit
- **Scopes:** `identity`
- **User Info:** `id`/`name`, `email` (may require additional scope), `icon_img`/`snoovatar_img`
- **Note:** Email may require additional scope
- **Status:** Implemented, needs testing

### Zoom
- **Scopes:** `user:read`
- **User Info:** `id`, `email`, `display_name`/`first_name`, `pic_url`
- **Status:** Implemented, needs testing

## Environment Variables

Each provider requires:
```bash
OAUTH_{PROVIDER}_CLIENT_ID=your_client_id
OAUTH_{PROVIDER}_CLIENT_SECRET=your_client_secret
```

**Special cases:**
- **Apple:** Also requires `OAUTH_APPLE_TEAM_ID`, `OAUTH_APPLE_KEY_ID`, `OAUTH_APPLE_PRIVATE_KEY`

## Adding a New Provider

1. Add provider config to `providers` object in `oauth.service.ts`
2. Add normalization case in `normalizeUserInfo()` function
3. Add environment variables to `.env.example`
4. Test the OAuth flow
5. Update documentation

## Testing

Each provider should be tested with:
- OAuth initiation (redirect to provider)
- OAuth callback (code exchange and user info)
- Account linking (if email matches existing user)
- New user creation (if email is new)

## Provider Status

| Provider | Status | Tested | Notes |
|----------|--------|--------|-------|
| Google | ✅ | ✅ | Fully tested |
| GitHub | ✅ | ✅ | Fully tested, email fetching |
| Microsoft | ✅ | ✅ | Fully tested |
| Facebook | ✅ | ⚠️ | Needs testing |
| Twitter | ✅ | ⚠️ | Needs testing, email may not be available |
| Apple | ✅ | ⚠️ | Needs testing, requires JWT handling |
| Discord | ✅ | ⚠️ | Needs testing |
| LinkedIn | ✅ | ⚠️ | Needs testing |
| Slack | ✅ | ⚠️ | Needs testing, special token response |
| Spotify | ✅ | ⚠️ | Needs testing |
| Twitch | ✅ | ⚠️ | Needs testing, requires Client-Id header |
| GitLab | ✅ | ⚠️ | Needs testing |
| Bitbucket | ✅ | ⚠️ | Needs testing |
| Dropbox | ✅ | ⚠️ | Needs testing |
| Reddit | ✅ | ⚠️ | Needs testing |
| Zoom | ✅ | ⚠️ | Needs testing |

**Legend:**
- ✅ = Implemented
- ⚠️ = Needs testing with real provider credentials
