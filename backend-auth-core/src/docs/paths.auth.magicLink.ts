/**
 * OpenAPI path definitions for Auth Magic Link module.
 * Paths are relative to servers[].url. Versioned: /api/v1/auth/magic-link/*
 */

/**
 * @openapi
 * /api/v1/auth/magic-link/send:
 *   post:
 *     tags:
 *       - Auth - Magic Link
 *     summary: Send magic link to email
 *     operationId: authMagicLinkSend
 *     description: |
 *       Generates a secure magic link token and sends it to the user's email address.
 *       The token is hashed and stored. The link expires based on config (default: 20 minutes).
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
 *         description: Magic link sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Magic link sent to email
 *                 magicLink:
 *                   type: string
 *                   description: Only returned in development mode
 *                   example: "http://localhost:5001/api/v1/auth/magic-link/verify?token=abc123&email=user@example.com"
 *       '400':
 *         description: Missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Magic link disabled or email domain not allowed
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
const send = true

/**
 * @openapi
 * /api/v1/auth/magic-link/verify:
 *   get:
 *     tags:
 *       - Auth - Magic Link
 *     summary: Verify magic link token and login (GET)
 *     operationId: authMagicLinkVerifyGet
 *     description: |
 *       Verifies the magic link token from email and logs the user in.
 *       Supports browser redirects - can redirect to frontend URL with token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Magic link token from email
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address associated with the magic link
 *       - in: query
 *         name: redirect
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional redirect URL (if provided, redirects instead of returning JSON)
 *     responses:
 *       '200':
 *         description: Success - logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: celestial_refresh_token (httpOnly, 7d)
 *             schema:
 *               type: string
 *       '302':
 *         description: Redirect (when redirect query param provided)
 *       '400':
 *         description: Missing token or email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid or expired magic link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Magic link is disabled
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
 *   post:
 *     tags:
 *       - Auth - Magic Link
 *     summary: Verify magic link token and login (POST)
 *     operationId: authMagicLinkVerifyPost
 *     description: |
 *       Verifies the magic link token and logs the user in.
 *       Accepts token and email in request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, email]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Magic link token from email
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address associated with the magic link
 *     responses:
 *       '200':
 *         description: Success - logged in
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
 *         description: Missing token or email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid or expired magic link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Magic link is disabled
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
const verify = true

export { send, verify }
