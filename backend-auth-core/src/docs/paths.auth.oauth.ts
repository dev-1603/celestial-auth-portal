/**
 * @fileoverview OpenAPI/Swagger documentation for OAuth authentication endpoints
 */

/**
 * @openapi
 * /auth/oauth/providers:
 *   get:
 *     tags:
 *       - Auth - OAuth
 *     summary: Get list of enabled OAuth providers
 *     description: |
 *       Returns a list of OAuth providers that are enabled in the configuration.
 *       Frontend can use this to dynamically render OAuth login buttons.
 *     operationId: getOAuthProviders
 *     responses:
 *       '200':
 *         description: List of enabled OAuth providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "google"
 *                       displayName:
 *                         type: string
 *                         example: "Google"
 *                       logo:
 *                         type: string
 *                         example: "/logos/google.svg"
 *                       buttonVariant:
 *                         type: string
 *                         example: "outline"
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /auth/oauth/{provider}/initiate:
 *   get:
 *     tags:
 *       - Auth - OAuth
 *     summary: Initiate OAuth flow
 *     description: |
 *       Initiates OAuth authentication flow by redirecting the user to the OAuth provider's authorization page.
 *       
 *       **Flow:**
 *       1. User clicks "Sign in with {Provider}" button
 *       2. Frontend redirects to this endpoint
 *       3. Backend generates CSRF state token
 *       4. Backend redirects to OAuth provider
 *       5. User authorizes on provider's page
 *       6. Provider redirects back to `/auth/oauth/{provider}/callback`
 *       
 *       **State Parameter:**
 *       - CSRF protection token stored in httpOnly cookie
 *       - Validated in callback to prevent CSRF attacks
 *       
 *       **Redirect Parameter:**
 *       - Optional: URL to redirect to after successful login
 *       - Stored in cookie and used in callback
 *     operationId: initiateOAuth
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, microsoft]
 *         description: OAuth provider ID
 *         example: "google"
 *       - in: query
 *         name: redirect
 *         required: false
 *         schema:
 *           type: string
 *           format: uri
 *         description: URL to redirect to after successful login
 *         example: "http://localhost:3000/app"
 *     responses:
 *       '302':
 *         description: Redirect to OAuth provider authorization page
 *         headers:
 *           Location:
 *             description: OAuth provider authorization URL
 *             schema:
 *               type: string
 *               example: "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
 *           Set-Cookie:
 *             description: CSRF state token cookie
 *             schema:
 *               type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /auth/oauth/{provider}/callback:
 *   get:
 *     tags:
 *       - Auth - OAuth
 *     summary: Handle OAuth callback
 *     description: |
 *       Handles the OAuth callback from the provider after user authorization.
 *       
 *       **Flow:**
 *       1. OAuth provider redirects here with `code` and `state` query parameters
 *       2. Backend validates state (CSRF protection)
 *       3. Backend exchanges authorization code for access token
 *       4. Backend fetches user info from provider
 *       5. Backend finds or creates user account
 *       6. Backend links OAuth account to user (if email matches existing user)
 *       7. Backend issues JWT tokens
 *       8. Backend redirects to frontend (if redirect URL provided) or returns JSON
 *       
 *       **Account Linking:**
 *       - If OAuth email matches existing user, OAuth account is linked
 *       - User can sign in with either method after linking
 *       - Controlled by `allowLinking` config (default: true)
 *       
 *       **New User Signup:**
 *       - If email doesn't exist, new user account is created
 *       - Controlled by `allowSignup` config (default: true)
 *     operationId: handleOAuthCallback
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, microsoft]
 *         description: OAuth provider ID
 *         example: "google"
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from OAuth provider
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF state token (must match cookie)
 *       - in: query
 *         name: error
 *         required: false
 *         schema:
 *           type: string
 *         description: OAuth error (if user denied authorization)
 *     responses:
 *       '200':
 *         description: OAuth callback successful, user logged in
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '302':
 *         description: Redirect to frontend (if redirect URL was provided)
 *         headers:
 *           Location:
 *             description: Frontend URL with access token
 *             schema:
 *               type: string
 *               example: "http://localhost:3000/app?token=eyJ..."
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '409':
 *         description: Account linking not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An account with this email already exists. Please use a different sign-in method."
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
