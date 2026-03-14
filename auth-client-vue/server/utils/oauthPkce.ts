/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth.
 * Uses Node.js crypto - no client-side exposure.
 */

import { randomBytes, createHash } from 'node:crypto';

/**
 * Generate a cryptographically random code_verifier and its code_challenge.
 * code_challenge = base64url(SHA256(code_verifier))
 */
export function generatePKCE(): { code_verifier: string; code_challenge: string } {
  const code_verifier = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(code_verifier).digest();
  const code_challenge = hash.toString('base64url');
  return { code_verifier, code_challenge };
}
