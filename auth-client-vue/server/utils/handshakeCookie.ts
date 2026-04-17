/**
 * Encrypted auth_handshake cookie for OAuth state + code_verifier.
 * No sensitive data reaches the client; BFF stores and verifies server-side.
 */

import { getCookie, setCookie, deleteCookie } from 'h3';
import * as crypto from 'node:crypto';

const COOKIE_NAME = 'auth_handshake';
const DEFAULT_TTL = 300; // 5 minutes

type HandshakePayload = {
  state: string;
  code_verifier: string;
  createdAt: number;
};

function getSecret(): string {
  const config = useRuntimeConfig();
  const secret = (config as { authHandshakeSecret?: string }).authHandshakeSecret;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_HANDSHAKE_SECRET must be set and at least 16 characters');
  }
  return secret;
}

function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
}

function decrypt(encrypted: string, secret: string): string {
  const combined = Buffer.from(encrypted, 'base64url');
  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const data = combined.subarray(32);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(data) + decipher.final('utf8');
}

/** Store state + code_verifier in encrypted HttpOnly cookie */
export function setHandshakeCookie(
  event: any,
  state: string,
  code_verifier: string,
  ttlSeconds: number = DEFAULT_TTL,
): void {
  const secret = getSecret();
  const payload: HandshakePayload = {
    state,
    code_verifier,
    createdAt: Date.now(),
  };
  const value = encrypt(JSON.stringify(payload), secret);

  setCookie(event, COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ttlSeconds,
    path: '/',
  });
}

/** Read and verify handshake; returns code_verifier if state matches. Deletes cookie after use. */
export function getAndVerifyHandshake(event: any, expectedState: string): string | null {
  const raw = getCookie(event, COOKIE_NAME);
  if (!raw) return null;

  deleteCookie(event, COOKIE_NAME, { path: '/' });

  try {
    const secret = getSecret();
    const json = decrypt(raw, secret);
    const payload = JSON.parse(json) as HandshakePayload;

    if (payload.state !== expectedState) return null;

    const maxAge = (useRuntimeConfig() as { authHandshakeTtlSeconds?: number }).authHandshakeTtlSeconds ?? DEFAULT_TTL;
    const expiresAt = payload.createdAt + maxAge * 1000;
    if (Date.now() > expiresAt) return null;

    return payload.code_verifier;
  } catch {
    return null;
  }
}
