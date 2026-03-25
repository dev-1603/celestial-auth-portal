/**
 * Passkey Registration Verify Handler
 *
 * POST /passkey/register/verify (requires Bearer token)
 *
 * Verifies the WebAuthn registration response from the browser,
 * stores the credential, and creates an AuthIdentity for the passkey.
 */

import type { Request, Response, NextFunction } from 'express'
import { isPasskeyEnabled } from '../../../config/auth-config.loader'
import { createWebAuthnCredential } from '../../../repositories/webauthn-credential.repository'
import { createAuthIdentity } from '../../../repositories/auth-identity.repository'
import {
  getAndDeleteChallenge,
  verifyPasskeyRegistration,
} from '../../../services/passkey.service'
import type { JWTPayload } from '../../../lib/jwt'

export const verifyPasskeyRegistrationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isPasskeyEnabled()) {
      res.status(403).json({ error: 'Passkey authentication is not enabled' })
      return
    }

    const { credential, challenge, friendlyName } = req.body ?? {}
    const user = (req as any).user as JWTPayload

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

    // Verify the registration response from the browser
    const verification = await verifyPasskeyRegistration(credential, challenge)

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Registration verification failed' })
      return
    }

    const { registrationInfo } = verification

    // Store the credential in the database
    await createWebAuthnCredential({
      userId: user.userId,
      credentialId: registrationInfo.credential.id,
      publicKey: Buffer.from(registrationInfo.credential.publicKey),
      counter: BigInt(registrationInfo.credential.counter),
      transports: credential.response?.transports || [],
      deviceType: registrationInfo.credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
      friendlyName: friendlyName || 'Passkey',
    })

    // Create an AuthIdentity linking this passkey to the user
    await createAuthIdentity({
      userId: user.userId,
      providerType: 'passkey',
      providerUserId: registrationInfo.credential.id,
      email: user.email,
      authMethodType: 'PASSKEY',
    })

    res.status(201).json({
      success: true,
      credentialId: registrationInfo.credential.id,
    })
  } catch (err) {
    next(err)
  }
}
