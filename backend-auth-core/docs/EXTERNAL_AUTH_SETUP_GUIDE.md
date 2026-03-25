# External Authentication Setup Guide

Complete step-by-step instructions for setting up every authentication method and provider that requires external configuration. Includes pricing info, developer console links, and env var requirements.

**Callback URL pattern for all OAuth providers:**
```
{API_URL}/api/v1/auth/oauth/{provider}/callback
```
Example: `http://localhost:5001/api/v1/auth/oauth/google/callback`

---

## Table of Contents

- [Pricing Summary](#pricing-summary)
- [OAuth Providers (16)](#oauth-providers)
  - [Google](#1-google)
  - [GitHub](#2-github)
  - [Microsoft](#3-microsoft)
  - [Facebook](#4-facebook)
  - [Twitter / X](#5-twitter--x)
  - [Apple](#6-apple)
  - [Discord](#7-discord)
  - [LinkedIn](#8-linkedin)
  - [Slack](#9-slack)
  - [Spotify](#10-spotify)
  - [Twitch](#11-twitch)
  - [GitLab](#12-gitlab)
  - [Bitbucket](#13-bitbucket)
  - [Dropbox](#14-dropbox)
  - [Reddit](#15-reddit)
  - [Zoom](#16-zoom)
- [SSO — SAML 2.0](#sso--saml-20)
- [SSO — Generic OIDC](#sso--generic-oidc)
- [SSO — Okta](#sso--okta)
- [SSO — Auth0](#sso--auth0)
- [Passkey / WebAuthn](#passkey--webauthn)
- [Email (SMTP)](#email-smtp)
- [Phone SMS OTP (Twilio)](#phone-sms-otp-twilio)
- [Complete .env Reference](#complete-env-reference)

---

## Pricing Summary

| Provider / Method | Cost | Notes |
|---|---|---|
| **Google OAuth** | Free | Unlimited for OAuth consent |
| **GitHub OAuth** | Free | Free for all tiers |
| **Microsoft OAuth** | Free | Free via Azure AD app registration |
| **Facebook OAuth** | Free | Free, but requires App Review for production |
| **Twitter / X OAuth** | Free tier available | Free Basic tier (limited). Pro $100/mo for email scope |
| **Apple Sign-In** | **$99/year** | Requires Apple Developer Program membership |
| **Discord OAuth** | Free | No cost |
| **LinkedIn OAuth** | Free | Free via LinkedIn Developer portal |
| **Slack OAuth** | Free | Free for Sign in with Slack |
| **Spotify OAuth** | Free | Free for user authentication |
| **Twitch OAuth** | Free | Free for all developers |
| **GitLab OAuth** | Free | Free (self-hosted or gitlab.com) |
| **Bitbucket OAuth** | Free | Free via Atlassian account |
| **Dropbox OAuth** | Free | Free via Dropbox App Console |
| **Reddit OAuth** | Free | Free for all developers |
| **Zoom OAuth** | Free | Free via Zoom Marketplace |
| **SAML 2.0** | Free (self-hosted IdP) | Depends on IdP — free with Keycloak, paid with Okta/OneLogin |
| **Generic OIDC** | Free (self-hosted) | Depends on provider |
| **Okta SSO** | **Paid** | Free developer account (100 MAU). Workforce starts ~$2/user/mo |
| **Auth0 SSO** | **Paid for SSO** | Free tier: 25k MAU. Enterprise SSO requires paid plan ($23+/mo) |
| **Passkey / WebAuthn** | Free | No external service needed — browser-native |
| **Email SMTP** | Free (dev) | Gmail SMTP free. Production: SendGrid free tier 100 emails/day |
| **Twilio SMS** | **Paid** | Pay-per-use. ~$0.0079/SMS (US). Free trial gives ~$15 credit |

---

## OAuth Providers

### 1. Google

**Cost:** Free

**Developer Console:** https://console.cloud.google.com/apis/credentials

**Setup Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (for public apps) or **Internal** (Google Workspace only)
   - App name, support email, authorized domains
   - Scopes: add `email`, `profile`, `openid`
   - Add test users (required while in "Testing" status)
6. Back in Credentials, choose **Web application** as application type
7. Add Authorized redirect URI:
   ```
   http://localhost:5001/api/v1/auth/oauth/google/callback
   ```
8. Copy the **Client ID** and **Client Secret**

**Env Vars:**
```bash
OAUTH_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- While in "Testing" mode, only test users you add manually can authenticate
- To go to production, submit for **Google Verification** (can take days/weeks)
- Scopes used: `openid`, `email`, `profile`

---

### 2. GitHub

**Cost:** Free

**Developer Console:** https://github.com/settings/developers

**Setup Steps:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App** (or use "GitHub Apps" for more granular perms)
3. Fill in:
   - **Application name:** Your app name
   - **Homepage URL:** `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL:**
     ```
     http://localhost:5001/api/v1/auth/oauth/github/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it immediately

**Env Vars:**
```bash
OAUTH_GITHUB_CLIENT_ID=your_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- GitHub does not return email if user's email is private — the backend fetches it from `/user/emails` endpoint automatically
- Scope used: `user:email`
- No app review needed

---

### 3. Microsoft

**Cost:** Free

**Developer Console:** https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

**Setup Steps:**

1. Go to [Azure Portal — App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **New registration**
3. Fill in:
   - **Name:** Your app name
   - **Supported account types:** "Accounts in any organizational directory and personal Microsoft accounts" (for broadest access)
   - **Redirect URI:** Platform = **Web**, URI:
     ```
     http://localhost:5001/api/v1/auth/oauth/microsoft/callback
     ```
4. Click **Register**
5. Copy the **Application (client) ID**
6. Go to **Certificates & secrets > New client secret**
7. Set description and expiry, click **Add**, copy the **Value** (not the Secret ID)

**Env Vars:**
```bash
OAUTH_MICROSOFT_CLIENT_ID=your_application_client_id
OAUTH_MICROSOFT_CLIENT_SECRET=your_client_secret_value
```

**Important Notes:**
- Uses `/common/` tenant for multi-tenant support
- Scopes: `openid`, `email`, `profile`
- User info fetched from Microsoft Graph API (`/v1.0/me`)
- No cost for app registration

---

### 4. Facebook

**Cost:** Free (App Review required for production)

**Developer Console:** https://developers.facebook.com/apps/

**Setup Steps:**

1. Go to [Facebook Developers](https://developers.facebook.com/) and log in
2. Click **My Apps > Create App**
3. Choose app type: **Consumer** or **Business**
4. Enter app display name, create the app
5. In the app dashboard, find **Facebook Login** product and click **Set Up**
6. Choose **Web** platform
7. Go to **Facebook Login > Settings**:
   - Add **Valid OAuth Redirect URI:**
     ```
     http://localhost:5001/api/v1/auth/oauth/facebook/callback
     ```
   - Enable "Enforce HTTPS" for production
8. Go to **Settings > Basic** to find your **App ID** and **App Secret**

**Env Vars:**
```bash
OAUTH_FACEBOOK_CLIENT_ID=your_app_id
OAUTH_FACEBOOK_CLIENT_SECRET=your_app_secret
```

**Important Notes:**
- In Development mode, only app admins/testers can log in
- For production: submit for **App Review** (Facebook reviews your usage of permissions)
- Scopes: `email`, `public_profile`
- API version: `v18.0`

---

### 5. Twitter / X

**Cost:** Free Basic tier (limited); Pro tier $100/mo for email access

**Developer Console:** https://developer.twitter.com/en/portal/dashboard

**Setup Steps:**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign up for a developer account (requires describing your use case)
3. Create a **Project** and an **App** within it
4. In app settings, go to **User authentication settings > Set up**
5. Configure:
   - **App permissions:** Read (minimum)
   - **Type of App:** Web App
   - **Callback URI / Redirect URL:**
     ```
     http://localhost:5001/api/v1/auth/oauth/twitter/callback
     ```
   - **Website URL:** Your app URL
6. Save and go to **Keys and Tokens** tab
7. Under **OAuth 2.0 Client ID and Client Secret**, copy both values

**Env Vars:**
```bash
OAUTH_TWITTER_CLIENT_ID=your_oauth2_client_id
OAUTH_TWITTER_CLIENT_SECRET=your_oauth2_client_secret
```

**Important Notes:**
- Uses OAuth 2.0 with PKCE (API v2), NOT OAuth 1.0a
- **Email access may NOT be available** on the free Basic tier — Twitter restricts this
- Scopes: `tweet.read`, `users.read`, `offline.access`
- Rate limits are strict on free tier

---

### 6. Apple

**Cost: $99/year** (Apple Developer Program membership required)

**Developer Console:** https://developer.apple.com/account/

**Setup Steps:**

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/)
3. **Create an App ID:**
   - Go to **Identifiers > App IDs > Register**
   - Enable **Sign in with Apple** capability
   - Register with your bundle ID
4. **Create a Services ID** (this is your OAuth client):
   - Go to **Identifiers > Services IDs > Register**
   - Description: Your app name
   - Identifier: e.g., `com.yourdomain.auth` (this is your Client ID)
   - Enable **Sign in with Apple**
   - Configure:
     - **Domains:** `localhost` (dev) or your domain
     - **Return URLs:**
       ```
       http://localhost:5001/api/v1/auth/oauth/apple/callback
       ```
5. **Create a Key:**
   - Go to **Keys > Create a Key**
   - Enable **Sign in with Apple**, configure with your App ID
   - Download the `.p8` key file — **save this, you can only download once**
   - Note the **Key ID**
6. Note your **Team ID** (visible in top right of developer portal, or in Membership)

**Env Vars:**
```bash
OAUTH_APPLE_CLIENT_ID=com.yourdomain.auth      # Services ID Identifier
OAUTH_APPLE_CLIENT_SECRET=                       # Generated dynamically from key
OAUTH_APPLE_TEAM_ID=XXXXXXXXXX                   # 10-char Team ID
OAUTH_APPLE_KEY_ID=XXXXXXXXXX                    # Key ID from step 5
OAUTH_APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGT...contents of .p8 file...\n-----END PRIVATE KEY-----"
```

**Important Notes:**
- Apple does NOT use a static client secret — it's a JWT signed with your private key (the backend generates this automatically)
- Apple only returns the user's name on the **first** authentication; subsequent logins only return `sub` and `email`
- Requires HTTPS redirect URIs in production
- Scopes: `name`, `email`

---

### 7. Discord

**Cost:** Free

**Developer Console:** https://discord.com/developers/applications

**Setup Steps:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, enter a name
3. Go to **OAuth2** in the left sidebar
4. Copy the **Client ID** and click **Reset Secret** to get the **Client Secret**
5. Add a **Redirect:**
   ```
   http://localhost:5001/api/v1/auth/oauth/discord/callback
   ```
6. Save changes

**Env Vars:**
```bash
OAUTH_DISCORD_CLIENT_ID=your_client_id
OAUTH_DISCORD_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Scopes: `identify`, `email`
- Avatar URL is constructed from the `avatar` hash: `https://cdn.discordapp.com/avatars/{user_id}/{avatar}.png`
- No app review needed

---

### 8. LinkedIn

**Cost:** Free

**Developer Console:** https://www.linkedin.com/developers/apps

**Setup Steps:**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create App**
3. Fill in:
   - App name, LinkedIn Page (required — create one if needed), logo
4. After creation, go to the **Auth** tab
5. Add **Authorized redirect URL:**
   ```
   http://localhost:5001/api/v1/auth/oauth/linkedin/callback
   ```
6. Copy **Client ID** and **Client Secret**
7. Go to **Products** tab and request access to **Sign In with LinkedIn using OpenID Connect**

**Env Vars:**
```bash
OAUTH_LINKEDIN_CLIENT_ID=your_client_id
OAUTH_LINKEDIN_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- You MUST request the "Sign In with LinkedIn using OpenID Connect" product — without it, OAuth will fail
- Uses OpenID Connect (not the legacy LinkedIn API)
- Scopes: `openid`, `profile`, `email`
- Requires a LinkedIn Company Page to create the app

---

### 9. Slack

**Cost:** Free

**Developer Console:** https://api.slack.com/apps

**Setup Steps:**

1. Go to [Slack API — Your Apps](https://api.slack.com/apps)
2. Click **Create New App > From scratch**
3. Enter app name and select a workspace
4. Go to **OAuth & Permissions** in the left sidebar
5. Add **Redirect URL:**
   ```
   http://localhost:5001/api/v1/auth/oauth/slack/callback
   ```
6. Under **User Token Scopes**, add:
   - `identity.basic`
   - `identity.email`
   - `identity.avatar`
7. Go to **Basic Information** to find **Client ID** and **Client Secret**

**Env Vars:**
```bash
OAUTH_SLACK_CLIENT_ID=your_client_id
OAUTH_SLACK_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Slack's "Sign in with Slack" uses `identity.*` scopes, NOT `openid`
- User info may be returned directly in the token response rather than from a separate endpoint
- Must be installed to at least one workspace to work

---

### 10. Spotify

**Cost:** Free

**Developer Console:** https://developer.spotify.com/dashboard

**Setup Steps:**

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - App name, description
   - **Redirect URI:**
     ```
     http://localhost:5001/api/v1/auth/oauth/spotify/callback
     ```
   - Select **Web API** for the API you want to use
4. Click **Save**
5. Go to **Settings** to find **Client ID** and **Client Secret**

**Env Vars:**
```bash
OAUTH_SPOTIFY_CLIENT_ID=your_client_id
OAUTH_SPOTIFY_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Scopes: `user-read-email`, `user-read-private`
- In development mode, you must add test users manually (up to 25)
- To remove the user limit, submit a **Quota Extension Request**

---

### 11. Twitch

**Cost:** Free

**Developer Console:** https://dev.twitch.tv/console/apps

**Setup Steps:**

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click **Register Your Application**
3. Fill in:
   - **Name:** Your app name
   - **OAuth Redirect URL:**
     ```
     http://localhost:5001/api/v1/auth/oauth/twitch/callback
     ```
   - **Category:** Choose appropriate category
4. Click **Create**
5. Click **Manage** on your new app to find **Client ID**
6. Click **New Secret** to generate the **Client Secret**

**Env Vars:**
```bash
OAUTH_TWITCH_CLIENT_ID=your_client_id
OAUTH_TWITCH_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Scope: `user:read:email`
- Twitch API requires `Client-Id` header in addition to Bearer token for user info requests — the backend handles this automatically
- User info returns an array in `data[0]`

---

### 12. GitLab

**Cost:** Free

**Developer Console:** https://gitlab.com/-/user_settings/applications (for gitlab.com)

**Setup Steps:**

1. Go to [GitLab User Settings > Applications](https://gitlab.com/-/user_settings/applications)
   - For self-hosted GitLab: `https://your-gitlab.com/-/user_settings/applications`
2. Click **Add new application**
3. Fill in:
   - **Name:** Your app name
   - **Redirect URI:**
     ```
     http://localhost:5001/api/v1/auth/oauth/gitlab/callback
     ```
   - **Confidential:** Yes (checked)
   - **Scopes:** Check `read_user`
4. Click **Save application**
5. Copy the **Application ID** and **Secret**

**Env Vars:**
```bash
OAUTH_GITLAB_CLIENT_ID=your_application_id
OAUTH_GITLAB_CLIENT_SECRET=your_secret
```

**Important Notes:**
- Works with both gitlab.com and self-hosted GitLab instances
- For self-hosted: you may need to update the authorization/token URLs in config
- Scope: `read_user`

---

### 13. Bitbucket

**Cost:** Free

**Developer Console:** https://bitbucket.org/workspace-settings (select your workspace)

**Setup Steps:**

1. Go to your Bitbucket workspace
2. Navigate to **Settings > OAuth consumers** (under "Apps and features")
   - Direct URL: `https://bitbucket.org/{workspace}/workspace/settings/api`
3. Click **Add consumer**
4. Fill in:
   - **Name:** Your app name
   - **Callback URL:**
     ```
     http://localhost:5001/api/v1/auth/oauth/bitbucket/callback
     ```
   - **Permissions:** Check **Account — Email** and **Account — Read**
5. Click **Save**
6. Copy the **Key** (Client ID) and **Secret**

**Env Vars:**
```bash
OAUTH_BITBUCKET_CLIENT_ID=your_consumer_key
OAUTH_BITBUCKET_CLIENT_SECRET=your_consumer_secret
```

**Important Notes:**
- Requires an Atlassian/Bitbucket account
- Scope: `email`
- Consumer "Key" = Client ID

---

### 14. Dropbox

**Cost:** Free

**Developer Console:** https://www.dropbox.com/developers/apps

**Setup Steps:**

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **Create app**
3. Choose:
   - **Scoped access** API
   - **App folder** or **Full Dropbox** (either works for auth)
   - Enter a name
4. Click **Create app**
5. In app settings under **OAuth 2**, add **Redirect URI:**
   ```
   http://localhost:5001/api/v1/auth/oauth/dropbox/callback
   ```
6. Under **Permissions** tab, enable `account_info.read`
7. Copy the **App key** (Client ID) and **App secret**

**Env Vars:**
```bash
OAUTH_DROPBOX_CLIENT_ID=your_app_key
OAUTH_DROPBOX_CLIENT_SECRET=your_app_secret
```

**Important Notes:**
- "App key" = Client ID, "App secret" = Client Secret
- Scope: `account_info.read`
- User info endpoint is POST-based (`/2/users/get_current_account`)

---

### 15. Reddit

**Cost:** Free

**Developer Console:** https://www.reddit.com/prefs/apps

**Setup Steps:**

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Scroll down and click **create another app...**
3. Fill in:
   - **Name:** Your app name
   - **App type:** Select **web app**
   - **Redirect URI:**
     ```
     http://localhost:5001/api/v1/auth/oauth/reddit/callback
     ```
4. Click **create app**
5. Copy the **client ID** (shown under the app name) and **secret**

**Env Vars:**
```bash
OAUTH_REDDIT_CLIENT_ID=your_client_id
OAUTH_REDDIT_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Scope: `identity`
- Email may NOT be available — Reddit does not always provide email even with `identity` scope
- Reddit requires a `User-Agent` header for API calls — the backend handles this
- Rate limited to 60 requests/minute

---

### 16. Zoom

**Cost:** Free

**Developer Console:** https://marketplace.zoom.us/develop/create

**Setup Steps:**

1. Go to [Zoom App Marketplace — Develop](https://marketplace.zoom.us/develop/create)
2. Choose **General App** (or **OAuth** app type)
3. Enter app name, click **Create**
4. In **App Credentials**, copy **Client ID** and **Client Secret**
5. Go to **OAuth** settings:
   - Add **Redirect URL:**
     ```
     http://localhost:5001/api/v1/auth/oauth/zoom/callback
     ```
   - Add **Allow List:** same URL
6. Go to **Scopes** and add:
   - `user:read` (View user information)

**Env Vars:**
```bash
OAUTH_ZOOM_CLIENT_ID=your_client_id
OAUTH_ZOOM_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Zoom requires apps to be published/activated for production use
- In development mode, only users you add can authenticate
- Scope: `user:read`
- Zoom has been migrating app types — use "General App" or "OAuth" (not JWT, which is deprecated)

---

## SSO — SAML 2.0

**Cost:** Free if using a free IdP (Keycloak, SimpleSAMLphp). Paid if using Okta, OneLogin, etc.

SAML (Security Assertion Markup Language) is an XML-based standard for enterprise single sign-on. Your app acts as the **Service Provider (SP)** and communicates with an **Identity Provider (IdP)**.

**Dependency:** `@node-saml/node-saml` (install via `npm install @node-saml/node-saml`)

### Setup Steps (Generic SAML IdP)

1. **Generate SP certificate and private key** (for signing/encryption):
   ```bash
   # Generate private key
   openssl genrsa -out sp-private-key.pem 2048

   # Generate self-signed certificate (valid 1 year)
   openssl req -new -x509 -key sp-private-key.pem -out sp-cert.pem -days 365 \
     -subj "/CN=celestial-auth/O=YourOrg"
   ```

2. **Get your SP metadata** — once the backend is running, visit:
   ```
   GET /api/v1/auth/sso/metadata
   ```
   This returns XML metadata that your IdP needs.

3. **Configure your IdP** (examples below):

   **Option A: Keycloak (Free, self-hosted)**
   - Install Keycloak: `docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev`
   - Create a realm
   - Go to **Clients > Create Client**
   - Client type: **SAML**
   - Client ID: Your SP Entity ID (e.g., `celestial-auth-sp`)
   - Set **Valid redirect URIs** to your ACS URL
   - Import your SP metadata or configure manually
   - In **Keys** tab, import your SP certificate
   - Copy the IdP SSO URL and download the IdP certificate

   **Option B: SimpleSAMLphp (Free, self-hosted)**
   - Install via Docker or directly
   - Configure an SP entry pointing to your ACS URL
   - Export the IdP metadata

   **Option C: Okta / OneLogin / Azure AD (Paid)**
   - See [SSO — Okta](#sso--okta) section or configure SAML app in your IdP dashboard

4. **Set environment variables:**

**Env Vars:**
```bash
# Service Provider (your app)
SAML_SP_ENTITY_ID=celestial-auth-sp
SAML_SP_ACS_URL=http://localhost:5001/api/v1/auth/sso/saml/callback

# Identity Provider (the external IdP)
SAML_IDP_SSO_URL=https://your-idp.com/saml/sso
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"

# SP signing keys (from step 1)
SAML_SP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
SAML_SP_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
```

**Important Notes:**
- Multi-line PEM values: use `\n` for newlines in the env var, or use double-quotes
- The IdP certificate is what the IdP provides (NOT your SP cert)
- SAML assertions must include `email` attribute (standard URN: `urn:oid:0.9.2342.19200300.100.1.3` or friendly name `email`)
- For production, use HTTPS for all URLs

---

## SSO — Generic OIDC

**Cost:** Free if using a free provider (Keycloak, Authentik, Authelia). Paid for cloud providers.

OpenID Connect (OIDC) is built on top of OAuth 2.0 and is simpler than SAML. It uses JSON instead of XML.

**Dependency:** `openid-client` (install via `npm install openid-client`)

### Setup Steps

1. **Set up an OIDC provider** (if you don't already have one):

   **Option A: Keycloak (Free)**
   - Same Keycloak instance as SAML
   - Create a client with **Client type: OpenID Connect**
   - Set **Access Type:** confidential
   - Add **Valid redirect URI:** `http://localhost:5001/api/v1/auth/sso/oidc/callback`
   - Copy the client ID and client secret
   - Issuer URL: `http://localhost:8080/realms/{realm-name}`

   **Option B: Authentik (Free, self-hosted)**
   - Install via Docker
   - Create an OAuth2/OIDC provider
   - Set redirect URI
   - Issuer: `https://your-authentik.com/application/o/{app-slug}/`

2. **Find the issuer URL** — it should support OIDC Discovery at:
   ```
   {issuer}/.well-known/openid-configuration
   ```

3. **Set environment variables:**

**Env Vars:**
```bash
SSO_OIDC_ISSUER=https://your-oidc-provider.com/realms/your-realm
SSO_OIDC_CLIENT_ID=your_client_id
SSO_OIDC_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- The `openid-client` library auto-discovers endpoints from `{issuer}/.well-known/openid-configuration`
- Scopes requested: `openid`, `email`, `profile`
- The issuer must support standard OIDC Discovery

---

## SSO — Okta

**Cost:** Free developer account (100 monthly active users). Paid workforce plans start ~$2/user/month.

**Developer Console:** https://developer.okta.com/

### Setup Steps

1. **Create a free Okta developer account** at https://developer.okta.com/signup/
2. Log in to your Okta admin dashboard (e.g., `https://dev-XXXXXX-admin.okta.com`)
3. Go to **Applications > Create App Integration**
4. Choose:
   - **Sign-in method:** OIDC — OpenID Connect
   - **Application type:** Web Application
5. Configure:
   - **App integration name:** Your app name
   - **Grant type:** Authorization Code
   - **Sign-in redirect URIs:**
     ```
     http://localhost:5001/api/v1/auth/sso/okta/callback
     ```
   - **Sign-out redirect URIs:** (optional) `http://localhost:3000`
   - **Assignments:** Allow everyone in your org, or specific groups
6. Click **Save**
7. Copy the **Client ID** and **Client Secret**
8. Note your **Okta domain** (e.g., `dev-12345678.okta.com`)

**Env Vars:**
```bash
SSO_OKTA_DOMAIN=dev-12345678.okta.com
SSO_OKTA_CLIENT_ID=your_client_id
SSO_OKTA_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Issuer is derived automatically: `https://{SSO_OKTA_DOMAIN}/oauth2/default`
- Free developer account allows up to **100 monthly active users**
- Supports OIDC Discovery at `https://{domain}/oauth2/default/.well-known/openid-configuration`
- For SAML with Okta: create a "SAML 2.0" app integration instead and use the SAML env vars

---

## SSO — Auth0

**Cost:** Free tier up to 25,000 MAU. SSO requires a paid plan (Essentials $23/mo or higher).

**Developer Console:** https://manage.auth0.com/

### Setup Steps

1. **Create a free Auth0 account** at https://auth0.com/signup
2. Log in to the [Auth0 Dashboard](https://manage.auth0.com/)
3. Go to **Applications > Create Application**
4. Choose:
   - **Name:** Your app name
   - **Type:** Regular Web Applications
5. Click **Create**
6. Go to the **Settings** tab:
   - Copy **Client ID** and **Client Secret**
   - Note your **Domain** (e.g., `your-tenant.auth0.com`)
   - Under **Allowed Callback URLs**, add:
     ```
     http://localhost:5001/api/v1/auth/sso/auth0/callback
     ```
   - Under **Allowed Logout URLs** (optional):
     ```
     http://localhost:3000
     ```
7. Click **Save Changes**

**Env Vars:**
```bash
SSO_AUTH0_DOMAIN=your-tenant.auth0.com
SSO_AUTH0_CLIENT_ID=your_client_id
SSO_AUTH0_CLIENT_SECRET=your_client_secret
```

**Important Notes:**
- Issuer is derived automatically: `https://{SSO_AUTH0_DOMAIN}`
- Free tier: 25,000 MAU with social + passwordless login
- **Enterprise SSO (SAML, OIDC federation) requires a paid plan** — the free tier does not include enterprise connections
- Supports OIDC Discovery at `https://{domain}/.well-known/openid-configuration`
- Auth0 "Universal Login" is their hosted login page — for headless API flow, ensure your app settings allow it

---

## Passkey / WebAuthn

**Cost:** Free — no external service required

WebAuthn/Passkeys are a browser-native standard. No third-party accounts or API keys are needed. The user's device (fingerprint sensor, Face ID, security key, or platform authenticator) handles credential creation and verification.

**Dependency:** `@simplewebauthn/server` (install via `npm install @simplewebauthn/server`)

### Setup Steps

1. **Choose your Relying Party (RP) configuration:**
   - **RP Name:** A human-readable name for your app
   - **RP ID:** The domain your app runs on (e.g., `localhost` for dev, `yourdomain.com` for production)
   - **Origin:** The full origin URL of your frontend (e.g., `http://localhost:3000`)

2. **Set environment variables:**

**Env Vars:**
```bash
WEBAUTHN_RP_NAME=Celestial Auth
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

3. **Frontend integration** — the frontend must use the browser's `navigator.credentials` API or the `@simplewebauthn/browser` package:
   ```bash
   npm install @simplewebauthn/browser   # in frontend project
   ```

### How the Flow Works

**Registration (adding a passkey to an existing account):**
1. Authenticated user calls `POST /api/v1/auth/passkey/register/options` → gets WebAuthn options
2. Frontend calls `navigator.credentials.create()` with those options
3. Frontend sends the response to `POST /api/v1/auth/passkey/register/verify`
4. Backend stores the credential

**Authentication (logging in with a passkey):**
1. User calls `POST /api/v1/auth/passkey/authenticate/options` → gets challenge
2. Frontend calls `navigator.credentials.get()` with those options
3. Frontend sends the response to `POST /api/v1/auth/passkey/authenticate/verify`
4. Backend verifies and issues JWT tokens

**Important Notes:**
- **RP ID must match the domain** — `localhost` for dev, your actual domain for production
- For production, **HTTPS is required** (WebAuthn does not work on HTTP except localhost)
- Challenge store is in-memory with 5-minute TTL — consider Redis for production with multiple instances
- Passkeys work on: Chrome, Safari, Firefox, Edge (all modern browsers)
- Supported authenticators: Touch ID, Face ID, Windows Hello, YubiKey, phone-as-authenticator

---

## Email (SMTP)

**Cost:** Free for development (console mode or Gmail SMTP). Production: varies by provider.

### Setup Steps

**Option A: Console Mode (Development — no setup needed)**

The backend defaults to `console` email provider in development, which prints emails to the terminal. No SMTP setup needed.

**Option B: Gmail SMTP (Free, up to 500 emails/day)**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate an app password for "Mail"
5. Use these settings:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password        # 16-char app password, NOT your Gmail password
SMTP_FROM=your.email@gmail.com
```

**Option C: SendGrid (Free tier: 100 emails/day)**

1. Sign up at https://sendgrid.com/
2. Go to **Settings > API Keys > Create API Key**
3. Use SMTP relay settings:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key
SMTP_FROM=verified-sender@yourdomain.com
```

**Option D: Mailgun, Amazon SES, Postmark** — similar SMTP configuration, all have free tiers.

---

## Phone SMS OTP (Twilio)

**Cost:** Pay-per-use. Free trial gives ~$15.50 credit. After that: ~$0.0079/SMS in US, ~$1.15/mo per phone number.

**Console:** https://console.twilio.com/

### Setup Steps

1. **Create a Twilio account** at https://www.twilio.com/try-twilio (free trial)
2. After signup, you'll see your **Account SID** and **Auth Token** on the dashboard
3. **Get a phone number:**
   - Go to **Phone Numbers > Manage > Buy a number** (or use the free trial number)
   - Trial accounts get one free number
4. **Verify your number** (trial accounts can only send to verified numbers):
   - Go to **Verified Caller IDs** and add your phone number

**Env Vars:**
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890     # Your Twilio phone number (E.164 format)
SMS_PROVIDER=twilio                 # Set to 'console' for dev (prints OTP to terminal)
```

**Important Notes:**
- **Trial accounts** can only send SMS to verified phone numbers — upgrade to send to anyone
- **Free trial credit:** ~$15.50 (covers ~1,500 SMS in US)
- For development, set `SMS_PROVIDER=console` to skip Twilio entirely and print OTPs to the terminal
- OTP is 6 digits, valid for 10 minutes (configured in `auth.json`)

---

## Complete .env Reference

All external-setup env vars in one place. Copy this and fill in what you need:

```bash
# ──────────────────────────────────────────
# OAUTH PROVIDERS
# ──────────────────────────────────────────

# Google
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=

# GitHub
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

# Microsoft
OAUTH_MICROSOFT_CLIENT_ID=
OAUTH_MICROSOFT_CLIENT_SECRET=

# Facebook
OAUTH_FACEBOOK_CLIENT_ID=
OAUTH_FACEBOOK_CLIENT_SECRET=

# Twitter / X
OAUTH_TWITTER_CLIENT_ID=
OAUTH_TWITTER_CLIENT_SECRET=

# Apple (requires Developer Program - $99/year)
OAUTH_APPLE_CLIENT_ID=
OAUTH_APPLE_CLIENT_SECRET=
OAUTH_APPLE_TEAM_ID=
OAUTH_APPLE_KEY_ID=
OAUTH_APPLE_PRIVATE_KEY=

# Discord
OAUTH_DISCORD_CLIENT_ID=
OAUTH_DISCORD_CLIENT_SECRET=

# LinkedIn
OAUTH_LINKEDIN_CLIENT_ID=
OAUTH_LINKEDIN_CLIENT_SECRET=

# Slack
OAUTH_SLACK_CLIENT_ID=
OAUTH_SLACK_CLIENT_SECRET=

# Spotify
OAUTH_SPOTIFY_CLIENT_ID=
OAUTH_SPOTIFY_CLIENT_SECRET=

# Twitch
OAUTH_TWITCH_CLIENT_ID=
OAUTH_TWITCH_CLIENT_SECRET=

# GitLab
OAUTH_GITLAB_CLIENT_ID=
OAUTH_GITLAB_CLIENT_SECRET=

# Bitbucket
OAUTH_BITBUCKET_CLIENT_ID=
OAUTH_BITBUCKET_CLIENT_SECRET=

# Dropbox
OAUTH_DROPBOX_CLIENT_ID=
OAUTH_DROPBOX_CLIENT_SECRET=

# Reddit
OAUTH_REDDIT_CLIENT_ID=
OAUTH_REDDIT_CLIENT_SECRET=

# Zoom
OAUTH_ZOOM_CLIENT_ID=
OAUTH_ZOOM_CLIENT_SECRET=

# ──────────────────────────────────────────
# SSO — SAML
# ──────────────────────────────────────────
SAML_SP_ENTITY_ID=celestial-auth-sp
SAML_SP_ACS_URL=http://localhost:5001/api/v1/auth/sso/saml/callback
SAML_IDP_SSO_URL=
SAML_IDP_CERT=
SAML_SP_PRIVATE_KEY=
SAML_SP_CERT=

# ──────────────────────────────────────────
# SSO — OIDC (Generic)
# ──────────────────────────────────────────
SSO_OIDC_ISSUER=
SSO_OIDC_CLIENT_ID=
SSO_OIDC_CLIENT_SECRET=

# ──────────────────────────────────────────
# SSO — Okta
# ──────────────────────────────────────────
SSO_OKTA_DOMAIN=
SSO_OKTA_CLIENT_ID=
SSO_OKTA_CLIENT_SECRET=

# ──────────────────────────────────────────
# SSO — Auth0
# ──────────────────────────────────────────
SSO_AUTH0_DOMAIN=
SSO_AUTH0_CLIENT_ID=
SSO_AUTH0_CLIENT_SECRET=

# ──────────────────────────────────────────
# PASSKEY / WEBAUTHN
# ──────────────────────────────────────────
WEBAUTHN_RP_NAME=Celestial Auth
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# ──────────────────────────────────────────
# EMAIL (SMTP)
# ──────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# ──────────────────────────────────────────
# SMS (Twilio)
# ──────────────────────────────────────────
SMS_PROVIDER=console
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```
