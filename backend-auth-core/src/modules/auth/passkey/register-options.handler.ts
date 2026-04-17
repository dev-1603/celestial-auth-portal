/**
 * Passkey Registration Options Handler
 *
 * POST /passkey/register/options (requires Bearer token)
 *
 * Generates WebAuthn registration options for a logged-in user
 * who wants to add a passkey to their account.
 */

import type { Request, Response, NextFunction } from 'express'
import { isPasskeyEnabled } from '../../../config/auth-config.loader'
import { findWebAuthnCredentialsByUserId } from '../../../repositories/webauthn-credential.repository'
import {
  generatePasskeyRegistrationOptions,
  storeChallenge,
} from '../../../services/passkey.service'
import type { JWTPayload } from '../../../lib/jwt'

export const getPasskeyRegistrationOptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isPasskeyEnabled()) {
      res.status(403).json({ error: 'Passkey authentication is not enabled' })
      return
    }

    const user = (req as any).user as JWTPayload

    // Get existing credentials to exclude them from registration
    const existingCredentials = await findWebAuthnCredentialsByUserId(user.userId)

    const options = await generatePasskeyRegistrationOptions(
      { id: user.userId, email: user.email },
      existingCredentials.map(c => ({
        credentialId: c.credentialId,
        transports: c.transports as string[] | undefined,
      })),
    )

    // Store challenge for later verification
    storeChallenge(options.challenge, user.userId)

    res.status(200).json(options)
  } catch (err) {
    next(err)
  }
}
