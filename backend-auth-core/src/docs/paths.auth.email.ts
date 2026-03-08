/**
 * OpenAPI path definitions for Auth Email module.
 * Kept in one file so swagger-jsdoc can scan and merge with base spec.
 * Paths are relative to servers[].url (e.g. /api/v1).
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: API root
 *     operationId: getApiRoot
 *     description: Returns a simple message indicating the Celestial Auth Core API is available.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Celestial Auth Core API
 */
const root = true

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     operationId: getHealth
 *     description: Liveness/readiness. Returns status, uptime, and timestamp.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
const health = true

/**
 * @openapi
 * /auth/email/login:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Login with email and password
 *     operationId: authEmailLogin
 *     description: |
 *       Validates credentials, returns access token and sets httpOnly refresh cookie.
 *       Multi-tenant; tenant is derived from TenantUserLink.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: celestial_refresh_token (httpOnly, 7d)
 *             schema:
 *               type: string
 *               example: celestial_refresh_token=eyJ...; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
 *       '400':
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Email and password are required"
 *       '401':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid credentials"
 */
const login = true

/**
 * @openapi
 * /auth/email/logout:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Logout
 *     operationId: authEmailLogout
 *     description: Clears the refresh token cookie. No body required.
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
const logout = true

/**
 * @openapi
 * /auth/email/refresh:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Refresh access token
 *     operationId: authEmailRefresh
 *     description: |
 *       Reads refresh token from cookie (celestial_refresh_token), validates it,
 *       resolves role from TenantUserLink, returns new access token and sets new refresh cookie.
 *     security:
 *       - cookieRefresh: []
 *     responses:
 *       '200':
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *         headers:
 *           Set-Cookie:
 *             description: New celestial_refresh_token (httpOnly, 7d)
 *             schema:
 *               type: string
 *       '401':
 *         description: No refresh token or invalid/expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noToken:
 *                 value: { error: "No refresh token provided" }
 *               invalid:
 *                 value: { error: "Invalid or expired refresh token" }
 *       '403':
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Email not verified"
 */
const refresh = true

/**
 * @openapi
 * /auth/email/me:
 *   get:
 *     tags:
 *       - Auth - Email
 *     summary: Get current user
 *     operationId: authEmailMe
 *     description: Returns the authenticated user (userId, email, tenantId, role, apps). Requires Bearer token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       '401':
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Authorization header must be in the format: Bearer <token>"
 */
const me = true

/**
 * @openapi
 * /auth/email/otp/send:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Send OTP code to email
 *     operationId: authEmailOtpSend
 *     description: |
 *       Generates and sends an OTP code to the user's email address.
 *       The code is hashed and stored. In development, the code is returned in the response for testing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent to email
 *                 otp:
 *                   type: string
 *                   description: Only returned in development mode
 *                   example: "123456"
 *       '400':
 *         description: Missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Email OTP is disabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const otpSend = true

/**
 * @openapi
 * /auth/email/otp/verify:
 *   post:
 *     tags:
 *       - Auth - Email
 *     summary: Verify OTP code and login
 *     operationId: authEmailOtpVerify
 *     description: |
 *       Verifies the OTP code sent to the user's email.
 *       If valid, returns access token and sets refresh token cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 description: OTP code (typically 6 digits)
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: Success - OTP verified and logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: celestial_refresh_token (httpOnly, 7d)
 *             schema:
 *               type: string
 *       '400':
 *         description: Missing email or code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid, expired, or max attempts exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid:
 *                 value: { error: "Invalid OTP code" }
 *               expired:
 *                 value: { error: "Invalid or expired OTP code" }
 *               maxAttempts:
 *                 value: { error: "Maximum attempts exceeded. Please request a new code." }
 *       '403':
 *         description: Email OTP is disabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const otpVerify = true

export { root, health, login, logout, refresh, me, otpSend, otpVerify }
