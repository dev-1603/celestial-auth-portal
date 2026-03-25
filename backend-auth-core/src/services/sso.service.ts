/**
 * SSO Service Abstraction
 *
 * Provides a unified interface for SAML and OIDC SSO flows.
 * Supports multiple providers (generic OIDC, Okta, Auth0, SAML IdPs).
 *
 * Dependencies (@node-saml/node-saml, openid-client) are dynamically imported
 * so the code compiles and starts even when they are not installed. The service
 * gracefully errors at runtime if the required library is missing.
 *
 * Usage:
 * ```typescript
 * import { getSAMLLoginUrl, validateSAMLResponse, getOIDCAuthorizationUrl, handleOIDCCallback } from './services/sso.service'
 *
 * // SAML flow
 * const loginUrl = await getSAMLLoginUrl(state)
 * const userInfo = await validateSAMLResponse(body)
 *
 * // OIDC flow
 * const authUrl = await getOIDCAuthorizationUrl('okta', redirectUri, state)
 * const userInfo = await handleOIDCCallback('okta', code, redirectUri)
 * ```
 */

import crypto from 'crypto'
import { env } from '../config/env.config'

export interface SSOUserInfo {
  providerId: string
  providerUserId: string // nameID for SAML, sub for OIDC
  email: string
  displayName?: string
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// CSRF state token
// ---------------------------------------------------------------------------

/**
 * Generate CSRF state token (same pattern as OAuth)
 */
export function generateSSOState(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ---------------------------------------------------------------------------
// SAML helpers
// ---------------------------------------------------------------------------

/**
 * Lazily create a SAML instance from @node-saml/node-saml.
 * Throws a clear error when the package is not installed.
 */
async function createSAMLInstance(): Promise<any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeSaml = await import('@node-saml/node-saml')
    const SAML = nodeSaml.SAML

    const saml = new SAML({
      callbackUrl: env.SAML_SP_ACS_URL,
      entryPoint: env.SAML_IDP_SSO_URL,
      issuer: env.SAML_SP_ENTITY_ID,
      cert: env.SAML_IDP_CERT,
      privateKey: env.SAML_SP_PRIVATE_KEY || undefined,
      decryptionPvk: env.SAML_SP_PRIVATE_KEY || undefined,
      wantAssertionsSigned: true,
    })

    return saml
  } catch {
    throw new Error(
      'SAML support requires @node-saml/node-saml package. Install it with: npm install @node-saml/node-saml'
    )
  }
}

/**
 * Get the SAML login URL for the configured IdP.
 * The caller should redirect the user to this URL.
 *
 * @param state - CSRF state token stored in a cookie by the handler
 * @returns The IdP login URL with a SAML AuthnRequest and RelayState
 */
export async function getSAMLLoginUrl(state: string): Promise<string> {
  const saml = await createSAMLInstance()

  const url: string = await saml.getAuthorizeUrlAsync(state, undefined, {})
  return url
}

/**
 * Validate a SAML response and extract user information.
 *
 * @param body - The POST body containing SAMLResponse (and optionally RelayState)
 * @param _state - Optional expected state for additional validation
 * @returns Normalised SSOUserInfo
 */
export async function validateSAMLResponse(
  body: { SAMLResponse: string },
  _state?: string,
): Promise<SSOUserInfo> {
  const saml = await createSAMLInstance()

  const { profile } = await saml.validatePostResponseAsync(body)

  if (!profile) {
    throw new Error('SAML response did not contain a valid profile')
  }

  const nameID: string = profile.nameID || ''
  const email: string =
    profile.email ||
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
    profile['urn:oid:0.9.2342.19200300.100.1.3'] ||
    nameID
  const displayName: string =
    profile.displayName ||
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    profile['urn:oid:2.16.840.1.113730.3.1.241'] ||
    ''

  if (!nameID || !email) {
    throw new Error('SAML assertion missing required attributes (nameID or email)')
  }

  return {
    providerId: 'saml',
    providerUserId: nameID,
    email,
    displayName: displayName || undefined,
    metadata: profile as unknown as Record<string, unknown>,
  }
}

/**
 * Generate SAML SP metadata XML.
 * This metadata can be provided to the IdP for automatic SP configuration.
 */
export function generateSAMLMetadata(): string {
  const entityID = env.SAML_SP_ENTITY_ID
  const acsUrl = env.SAML_SP_ACS_URL
  const cert = env.SAML_SP_CERT

  if (!entityID || !acsUrl) {
    throw new Error(
      'SAML SP metadata generation requires SAML_SP_ENTITY_ID and SAML_SP_ACS_URL environment variables'
    )
  }

  let keyDescriptor = ''
  if (cert) {
    // Strip PEM headers/footers and whitespace for the X509Certificate element
    const cleanCert = cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s+/g, '')

    keyDescriptor = `
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${cleanCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${entityID}">
  <SPSSODescriptor AuthnRequestsSigned="true"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">${keyDescriptor}
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                             Location="${acsUrl}"
                             index="0"
                             isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`
}

// ---------------------------------------------------------------------------
// OIDC helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the OIDC issuer URL for a given provider type.
 */
function getOIDCIssuerUrl(providerType: string): string {
  switch (providerType) {
    case 'oidc':
      return env.SSO_OIDC_ISSUER
    case 'okta':
      return `https://${env.SSO_OKTA_DOMAIN}`
    case 'auth0':
      return `https://${env.SSO_AUTH0_DOMAIN}`
    default:
      throw new Error(`Unknown OIDC provider: ${providerType}`)
  }
}

/**
 * Resolve the OIDC client credentials for a given provider type.
 */
function getOIDCCredentials(providerType: string): { clientId: string; clientSecret: string } {
  switch (providerType) {
    case 'oidc':
      return { clientId: env.SSO_OIDC_CLIENT_ID, clientSecret: env.SSO_OIDC_CLIENT_SECRET }
    case 'okta':
      return { clientId: env.SSO_OKTA_CLIENT_ID, clientSecret: env.SSO_OKTA_CLIENT_SECRET }
    case 'auth0':
      return { clientId: env.SSO_AUTH0_CLIENT_ID, clientSecret: env.SSO_AUTH0_CLIENT_SECRET }
    default:
      throw new Error(`Unknown OIDC provider: ${providerType}`)
  }
}

/**
 * Discover an OIDC issuer and create a client using openid-client.
 * Throws if the library is not installed.
 */
async function discoverOIDCClient(providerType: string, redirectUri: string): Promise<{ client: any }> {
  try {
    const openidClient = await import('openid-client')
    const Issuer = openidClient.Issuer

    const issuerUrl = getOIDCIssuerUrl(providerType)
    if (!issuerUrl) {
      throw new Error(`OIDC issuer URL not configured for provider: ${providerType}`)
    }

    const creds = getOIDCCredentials(providerType)
    if (!creds.clientId || !creds.clientSecret) {
      throw new Error(`OIDC client credentials not configured for provider: ${providerType}`)
    }

    const issuer = await Issuer.discover(issuerUrl)
    const client = new issuer.Client({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uris: [redirectUri],
      response_types: ['code'],
    })

    return { client }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Cannot find module')) {
      throw new Error(
        'OIDC support requires openid-client package. Install it with: npm install openid-client'
      )
    }
    throw err
  }
}

/**
 * Get the OIDC authorization URL for the given provider.
 *
 * @param providerType - 'oidc' | 'okta' | 'auth0'
 * @param redirectUri  - The callback URL registered with the OIDC provider
 * @param state        - CSRF state token
 * @returns The authorization URL to redirect the user to
 */
export async function getOIDCAuthorizationUrl(
  providerType: string,
  redirectUri: string,
  state: string,
): Promise<string> {
  const { client } = await discoverOIDCClient(providerType, redirectUri)

  const url: string = client.authorizationUrl({
    scope: 'openid email profile',
    state,
    redirect_uri: redirectUri,
  })

  return url
}

/**
 * Handle the OIDC callback: exchange the authorization code for tokens and
 * retrieve user info.
 *
 * @param providerType - 'oidc' | 'okta' | 'auth0'
 * @param code         - Authorization code from the callback
 * @param redirectUri  - Must match the one used during initiation
 * @returns Normalised SSOUserInfo
 */
export async function handleOIDCCallback(
  providerType: string,
  code: string,
  redirectUri: string,
): Promise<SSOUserInfo> {
  const { client } = await discoverOIDCClient(providerType, redirectUri)

  const tokenSet = await client.callback(redirectUri, { code })

  const userinfo = await client.userinfo(tokenSet.access_token!)

  const sub: string = userinfo.sub || ''
  const email: string = userinfo.email || ''
  const displayName: string = userinfo.name || ''

  if (!sub || !email) {
    throw new Error(`OIDC provider ${providerType} did not return required claims (sub, email)`)
  }

  return {
    providerId: providerType,
    providerUserId: sub,
    email,
    displayName: displayName || undefined,
    metadata: userinfo as unknown as Record<string, unknown>,
  }
}
