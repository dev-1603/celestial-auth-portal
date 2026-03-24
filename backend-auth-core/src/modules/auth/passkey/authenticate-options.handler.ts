/**
 * Passkey Authentication Options Handler
 *
 * POST /passkey/authenticate/options (no auth required - this IS the login flow)
 *
 * Generates WebAuthn authentication options. If an email is provided,
 * scopes the allowed credentials to that user. Otherwise, allows
 * discoverable credentials (resident keys).
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../../lib/prisma'
import { isPasskeyEnabled } from '../../../config/auth-config.loader'
import { findWebAuthnCredentialsByUserId } from '../../../repositories/webauthn-credential.repository'
import {
  generatePasskeyAuthenticationOptions,
  storeChallenge,
} from '../../../services/passkey.service'

export const getPasskeyAuthenticationOptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!isPasskeyEnabled()) {
      res.status(403).json({ error: 'Passkey authentication is not enabled' })
      return
    }

    const { email } = req.body ?? {}

    let existingCredentials: Array<{ credentialId: string; transports?: string[] }> = []

    // If email is provided, scope allowed credentials to that user
    if (email) {
      const user = await prisma.globalUser.findUnique({ where: { email } })
      if (user) {
        const credentials = await findWebAuthnCredentialsByUserId(user.id)
        existingCredentials = credentials.map(c => ({
          credentialId: c.credentialId,
          transports: c.transports as string[] | undefined,
        }))
      }
    }

    const options = await generatePasskeyAuthenticationOptions(existingCredentials)

    // Store challenge for later verification
    storeChallenge(options.challenge)

    res.status(200).json(options)
  } catch (err) {
    next(err)
  }
}
