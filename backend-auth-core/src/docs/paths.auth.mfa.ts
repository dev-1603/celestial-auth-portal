/**
 * OpenAPI path definitions for MFA module.
 * Paths are relative to servers[].url: /api/v1/auth/mfa/*
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * @openapi
 * /api/v1/auth/mfa/enable:
 *   post:
 *     tags:
 *       - Auth - MFA
 *     summary: Enable MFA (generate TOTP secret)
 *     operationId: authMfaEnable
 *     description: |
 *       Generates a TOTP secret and QR code for the user to set up MFA with an authenticator app.
 *       Stores the secret in AuthIdentity metadata (unverified until verify-setup is called).
 *       Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: MFA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: TOTP secret (base32 encoded, for manual entry)
 *                   example: "JBSWY3DPEHPK3PXP"
 *                 qrCode:
 *                   type: string
 *                   description: QR code as data URL (base64 image)
 *                   example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *                 manualEntryKey:
 *                   type: string
 *                   description: Same as secret, for manual entry in authenticator apps
 *                   example: "JBSWY3DPEHPK3PXP"
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Backup codes for account recovery (8 codes)
 *                   example: ["12345678", "87654321", ...]
 *                 message:
 *                   type: string
 *                   example: "Scan the QR code with your authenticator app, then verify with a code to complete setup."
 *       '400':
 *         description: MFA already enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: MFA is disabled in config
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const enable = true

/**
 * @openapi
 * /api/v1/auth/mfa/verify-setup:
 *   post:
 *     tags:
 *       - Auth - MFA
 *     summary: Verify MFA setup
 *     operationId: authMfaVerifySetup
 *     description: |
 *       Verifies the TOTP code during MFA setup to confirm the user has configured their authenticator app correctly.
 *       Marks MFA as verified and enabled. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: TOTP code from authenticator app (typically 6 digits)
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: MFA successfully enabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "MFA has been successfully enabled for your account"
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Backup codes (returned one more time for user to save)
 *       '400':
 *         description: MFA setup not started or already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid TOTP code or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const verifySetup = true

/**
 * @openapi
 * /api/v1/auth/mfa/verify:
 *   post:
 *     tags:
 *       - Auth - MFA
 *     summary: Verify MFA code during login
 *     operationId: authMfaVerify
 *     description: |
 *       Verifies a TOTP code or backup code during login when MFA is required.
 *       Called after initial authentication (email/password, etc.) if MFA is enabled.
 *       Returns access token and refresh cookie on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, email]
 *             properties:
 *               code:
 *                 type: string
 *                 description: TOTP code from authenticator app or backup code
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               userId:
 *                 type: string
 *                 description: User ID (optional, for internal use)
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID (optional, for internal use)
 *     responses:
 *       '200':
 *         description: MFA verified and logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: celestial_refresh_token (httpOnly)
 *             schema:
 *               type: string
 *       '400':
 *         description: Missing code or email, or MFA not enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid MFA code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const verify = true

/**
 * @openapi
 * /api/v1/auth/mfa/disable:
 *   post:
 *     tags:
 *       - Auth - MFA
 *     summary: Disable MFA
 *     operationId: authMfaDisable
 *     description: |
 *       Disables MFA for the authenticated user. Requires password verification for security.
 *       Removes TOTP secret and backup codes from AuthIdentity metadata.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's password (required for security)
 *                 example: "CurrentPassword123!"
 *     responses:
 *       '200':
 *         description: MFA successfully disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "MFA has been successfully disabled for your account"
 *       '400':
 *         description: Missing password or MFA not enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid password or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const disable = true

export { enable, verifySetup, verify, disable }
