/**
 * Email Registration Handler
 *
 * Handles new user registration with email and password.
 *
 * Flow:
 * 1. Validate email and password are present
 * 2. Check if signup is allowed (method config + signup mode)
 * 3. Validate invite token if signup mode is invite_only
 * 4. Validate password against password policy
 * 5. Check if user already exists
 * 6. Hash password, create user and auth identity
 * 7. Mark invitation as accepted (if invite_only)
 * 8. Build tokens and return 201
 */

import type { Request, Response, NextFunction } from 'express'
import { getAuthConfig, getMethodConfig, getSignupMode, getPasswordPolicy } from '../../../config/auth-config.loader'
import { findGlobalUserByEmail, createGlobalUser } from '../../../repositories/user.repository'
import { createAuthIdentity } from '../../../repositories/auth-identity.repository'
import { hashPasswordForUser, buildLoginTokens } from '../../../services/token.service'
import { validatePasswordPolicy } from '../../../lib/password-policy'
import { prisma } from '../../../lib/prisma'
import type { JWTPayload, GlobalRole } from '../../../lib/jwt'

export const registerWithEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, inviteToken } = req.body ?? {}

    // 1. Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // 2. Check if email_password method allows signup
    const methodConfig = getMethodConfig('email_password')
    if (methodConfig.allowSignup === false) {
      res.status(403).json({ error: 'Email registration is not allowed' })
      return
    }

    // 3. Check signup mode
    const signupMode = getSignupMode()
    let invitation: any = null

    if (signupMode === 'closed') {
      res.status(403).json({ error: 'Signup is currently disabled' })
      return
    }

    if (signupMode === 'invite_only') {
      invitation = await prisma.invitation.findFirst({
        where: {
          email: email.toLowerCase(),
          token: inviteToken,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      })

      if (!invitation) {
        res.status(403).json({ error: 'Valid invitation required' })
        return
      }
    }

    // 4. Validate password against policy
    const passwordPolicy = getPasswordPolicy()
    const policyResult = validatePasswordPolicy(password, passwordPolicy)

    if (!policyResult.valid) {
      res.status(400).json({ error: 'Password does not meet requirements', details: policyResult.errors })
      return
    }

    // 5. Check if user already exists
    const existingUser = await findGlobalUserByEmail(email)

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    // 6. Hash password and create user
    const passwordHash = await hashPasswordForUser(password)
    const newUser = await createGlobalUser({ email, passwordHash })

    // 7. Create AuthIdentity for email provider
    await createAuthIdentity({
      userId: newUser.id,
      providerType: 'email',
      providerUserId: email,
      email,
      authMethodType: 'PASSWORD',
    })

    // 8. Mark invitation as accepted if invite_only
    if (signupMode === 'invite_only' && invitation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true },
      })
    }

    // 9. Build JWT payload and tokens
    const payload: JWTPayload = {
      userId: newUser.id,
      tenantId: '',
      tenantSlug: undefined,
      email: newUser.email,
      role: 'USER' as GlobalRole,
    }

    const { accessToken, refreshCookie } = buildLoginTokens(payload)

    // 10. Set refresh cookie and return 201
    res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    res.status(201).json({
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        tenantId: '',
        tenantSlug: undefined,
      },
      message: 'Registration successful',
    })
  } catch (err) {
    next(err)
  }
}
