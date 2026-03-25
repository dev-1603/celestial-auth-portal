/**
 * Passkey Authentication Verify Handler
 *
 * POST /passkey/authenticate/verify (no auth required - this IS the login flow)
 *
 * Verifies the WebAuthn authentication response from the browser,
 * updates the credential counter, and issues JWT tokens.
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../../lib/prisma'
import { isPasskeyEnabled } from '../../../config/auth-config.loader'
import {
  findWebAuthnCredentialByCredentialId,
  updateWebAuthnCredentialCounter,
} from '../../../repositories/webauthn-credential.repository'
import {
  getAndDeleteChallenge,
  verifyPasskeyAuthentication,
} from '../../../services/passkey.service'
import { buildLoginTokens } from '../../../services/token.service'
import type { JWTPayload, GlobalRole } from '../../../lib/jwt'

export const verifyPasskeyAuthenticationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isPasskeyEnabled()) {
      res.status(403).json({ error: 'Passkey authentication is not enabled' })
      return
    }

    const { credential, challenge } = req.body ?? {}

    if (!credential || !challenge) {
      res.status(400).json({ error: 'credential and challenge are required' })
      return
    }

    // Verify the challenge is valid and not expired
    const challengeEntry = getAndDeleteChallenge(challenge)
    if (!challengeEntry) {
      res.status(400).json({ error: 'Invalid or expired challenge' })
      return
    }

    // Find the credential in the database
    const dbCredential = await findWebAuthnCredentialByCredentialId(credential.id)
    if (!dbCredential) {
      res.status(401).json({ error: 'Unknown credential' })
      return
    }

    // Verify the authentication response from the browser
    const verification = await verifyPasskeyAuthentication(
      credential,
      challenge,
      {
        credentialId: dbCredential.credentialId,
        publicKey: dbCredential.publicKey,
        counter: dbCredential.counter,
      },
    )

    if (!verification.verified) {
      res.status(401).json({ error: 'Authentication failed' })
      return
    }

    // Update the credential counter to prevent replay attacks
    await updateWebAuthnCredentialCounter(
      dbCredential.id,
      BigInt(verification.authenticationInfo.newCounter),
    )

    // Get user data with primary tenant membership
    const user = await prisma.globalUser.findUnique({
      where: { id: dbCredential.userId },
      include: {
        memberships: {
          where: { primary: true },
          include: { tenant: { select: { slug: true } } },
          take: 1,
        },
      },
    })

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const primaryMembership = user.memberships[0]
    const tenantId = primaryMembership?.tenantId || ''
    const tenantSlug = primaryMembership?.tenant?.slug

    // Determine role from tenant membership
    let role: GlobalRole = 'USER'
    if (primaryMembership?.isTenantOwner) {
      role = 'OWNER'
    }

    // Build JWT payload and issue tokens
    const payload: JWTPayload = {
      userId: user.id,
      tenantId,
      tenantSlug,
      email: user.email,
      role,
    }

    const { accessToken, refreshCookie } = buildLoginTokens(payload)

    res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options)
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        tenantId,
        tenantSlug,
      },
    })
  } catch (err) {
    next(err)
  }
}
