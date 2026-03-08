/**
 * @fileoverview OpenAPI/Swagger documentation for Phone OTP authentication endpoints
 */

/**
 * @openapi
 * /auth/phone/otp/send:
 *   post:
 *     tags:
 *       - Auth - Phone
 *     summary: Send OTP code to phone number
 *     description: |
 *       Generates a one-time password (OTP) code and sends it to the user's phone number via SMS.
 *       The code is hashed and stored in the database. The code expires after the configured time.
 *       
 *       **Phone Number Format:**
 *       - Must be in E.164 format (e.g., +1234567890)
 *       - 10-digit US numbers will be automatically normalized to +1XXXXXXXXXX
 *       
 *       **Development Mode:**
 *       - When `SMS_PROVIDER=console`, the OTP code is logged to console
 *       - The OTP code is also returned in the response for testing
 *     operationId: sendPhoneOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +1234567890) or 10-digit US number
 *                 example: "+1234567890"
 *     responses:
 *       '200':
 *         description: OTP code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to phone"
 *                 otp:
 *                   type: string
 *                   description: OTP code (only in development mode)
 *                   example: "123456"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /auth/phone/otp/verify:
 *   post:
 *     tags:
 *       - Auth - Phone
 *     summary: Verify OTP code and login
 *     description: |
 *       Verifies the OTP code sent to the user's phone number and logs them in if valid.
 *       Returns JWT access token and sets refresh token cookie.
 *       
 *       **Security:**
 *       - Codes expire after the configured time
 *       - Failed attempts are tracked
 *       - Maximum attempts are enforced (default: 5)
 *       - Once verified, the code is marked as used and cannot be reused
 *     operationId: verifyPhoneOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +1234567890) or 10-digit US number
 *                 example: "+1234567890"
 *               code:
 *                 type: string
 *                 description: OTP code received via SMS
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: OTP verified successfully, user logged in
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token cookie
 *             schema:
 *               type: string
 *               example: "celestial_refresh_token=...; HttpOnly; Secure; SameSite=Strict"
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
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
