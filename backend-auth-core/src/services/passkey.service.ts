import { env } from '../config/env.config'

// In-memory challenge store (Map with TTL)
// For production, use Redis. For MVP this is sufficient.
const challengeStore = new Map<string, { userId?: string; expiresAt: number }>()

// Cleanup expired challenges periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of challengeStore) {
    if (value.expiresAt < now) challengeStore.delete(key)
  }
}, 60_000) // every minute

export function storeChallenge(challenge: string, userId?: string): void {
  challengeStore.set(challenge, { userId, expiresAt: Date.now() + 5 * 60 * 1000 }) // 5 min TTL
}

export function getAndDeleteChallenge(challenge: string): { userId?: string } | null {
  const entry = challengeStore.get(challenge)
  if (!entry || entry.expiresAt < Date.now()) {
    challengeStore.delete(challenge)
    return null
  }
  challengeStore.delete(challenge)
  return { userId: entry.userId }
}

function getRPConfig() {
  return {
    rpName: env.WEBAUTHN_RP_NAME,
    rpID: env.WEBAUTHN_RP_ID,
    origin: env.WEBAUTHN_ORIGIN,
  }
}

export async function generatePasskeyRegistrationOptions(
  user: { id: string; email: string },
  existingCredentials: Array<{ credentialId: string; transports?: string[] }>,
) {
  const { generateRegistrationOptions } = await import('@simplewebauthn/server')
  const rp = getRPConfig()

  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpID,
    userName: user.email,
    userDisplayName: user.email,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(c => ({
      id: c.credentialId,
      transports: (c.transports || []) as any[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  return options
}

export async function verifyPasskeyRegistration(
  response: any,
  expectedChallenge: string,
) {
  const { verifyRegistrationResponse } = await import('@simplewebauthn/server')
  const rp = getRPConfig()

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
  })

  return verification
}

export async function generatePasskeyAuthenticationOptions(
  existingCredentials: Array<{ credentialId: string; transports?: string[] }>,
) {
  const { generateAuthenticationOptions } = await import('@simplewebauthn/server')
  const rp = getRPConfig()

  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    allowCredentials: existingCredentials.length > 0
      ? existingCredentials.map(c => ({
          id: c.credentialId,
          transports: (c.transports || []) as any[],
        }))
      : undefined,
    userVerification: 'preferred',
  })

  return options
}

export async function verifyPasskeyAuthentication(
  response: any,
  expectedChallenge: string,
  credential: { credentialId: string; publicKey: Buffer; counter: bigint },
) {
  const { verifyAuthenticationResponse } = await import('@simplewebauthn/server')
  const rp = getRPConfig()

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
    credential: {
      id: credential.credentialId,
      publicKey: credential.publicKey,
      counter: Number(credential.counter),
    },
  })

  return verification
}
