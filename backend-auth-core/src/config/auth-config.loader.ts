/**
 * Auth Config Loader
 *
 * Loads auth configuration used by the backend. Keeps only backend-relevant
 * fields (enabledMethods, passwordPolicy, mfa, methodsConfig, providers id/enabled,
 * rateLimits, session, redirects). Frontend-only fields (displayName, logo,
 * buttonVariant, security) live in the frontend auth.json.
 *
 * Configuration is loaded from:
 * 1. Path specified in AUTH_CONFIG_PATH env var, or
 * 2. Default path: config/auth.json (inside backend-auth-core)
 *
 * Secrets (OAuth client secrets, JWT secrets, etc.) are NOT in the config file
 * and must be provided via environment variables.
 */

import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM has no __dirname; derive it from import.meta.url. (tsconfig is CommonJS so we suppress the check.)
const __dirname = path.dirname(
  // @ts-expect-error import.meta is valid at ESM runtime (package "type": "module"); TS only allows it for ESM module option
  fileURLToPath(import.meta.url)
)

// Default path: backend-auth-core/config/auth.json (relative to this file: src/config -> root)
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '..', '..', 'config/auth.json')

/**
 * Auth config structure matching frontend auth.json
 */
export interface AuthConfig {
  enabledMethods: string[]
  defaultMethod?: string
  signupMode?: 'invite_only' | 'open' | 'closed'
  passwordPolicy?: {
    minLength?: number
    requireUpper?: boolean
    requireLower?: boolean
    requireNumber?: boolean
    requireSpecial?: boolean
    allowCommon?: boolean
    maxAgeDays?: number
    historyCount?: number
    lockoutThreshold?: number
    lockoutMinutes?: number
  }
  emailVerification?: boolean
  requireVerifiedEmail?: boolean
  mfa?: {
    required?: boolean
    policy?: 'required' | 'optional' | 'disabled'
    methods?: string[]
  }
  methodsConfig?: {
    [key: string]: {
      enabled?: boolean
      allowSignup?: boolean
      digits?: number
      expiryMinutes?: number
      maxAttempts?: number
      provider?: string
      fromNumber?: string
      allowedDomains?: string[]
      sessionExpirySeconds?: number
      botName?: string
      userVerification?: string
      [key: string]: any // Allow additional method-specific config
    }
  }
  providers?: {
    oauth?: Array<{
      id: string
      enabled: boolean
      displayName?: string
      logo?: string
      buttonVariant?: string
      [key: string]: any
    }>
    sso?: Array<{
      id: string
      type?: string
      enabled: boolean
      displayName?: string
      logo?: string
      [key: string]: any
    }>
  }
  rateLimits?: {
    loginAttempts?: number
    windowMinutesLogin?: number
    resetRequests?: number
    windowMinutesReset?: number
    otpRequests?: number
    windowMinutesOtp?: number
    perIp?: number
    perUser?: number
  }
  session?: {
    maxAgeDays?: number
    idleTimeoutMinutes?: number
    sameSite?: 'strict' | 'lax' | 'none'
    secure?: boolean
    cookieDomain?: string | null
    refreshTokenRotation?: boolean
    rememberMeMaxAgeDays?: number
  }
  redirects?: {
    afterLogin?: string
    afterLogout?: string
    firstLogin?: string
    signupComplete?: string
    afterMfaEnroll?: string
    afterPasswordReset?: string
  }
}

let cachedConfig: AuthConfig | null = null

/**
 * Load auth config from file
 */
function loadAuthConfig(): AuthConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const configPath = process.env.AUTH_CONFIG_PATH || DEFAULT_CONFIG_PATH

  try {
    const configContent = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent) as AuthConfig

    // Validate required fields
    if (!config.enabledMethods || !Array.isArray(config.enabledMethods)) {
      throw new Error('auth.json must have enabledMethods as an array')
    }

    cachedConfig = config
    return config
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Auth config file not found at ${configPath}. ` +
        `Set AUTH_CONFIG_PATH env var or ensure auth.json exists at the default path.`
      )
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in auth config file: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get the loaded auth config
 */
export function getAuthConfig(): AuthConfig {
  return loadAuthConfig()
}

/**
 * Check if a method is enabled
 */
export function isMethodEnabled(method: string): boolean {
  const config = getAuthConfig()
  return config.enabledMethods.includes(method)
}

/**
 * Get config for a specific method
 */
export function getMethodConfig(method: string) {
  const config = getAuthConfig()
  return config.methodsConfig?.[method] || {}
}

/**
 * Get enabled OAuth providers
 */
export function getEnabledOAuthProviders() {
  const config = getAuthConfig()
  return config.providers?.oauth?.filter((p) => p.enabled) || []
}

/**
 * Get enabled SSO providers
 */
export function getEnabledSSOProviders() {
  const config = getAuthConfig()
  return config.providers?.sso?.filter((p) => p.enabled) || []
}

/**
 * Get OAuth provider config by ID
 */
export function getOAuthProviderConfig(providerId: string) {
  const config = getAuthConfig()
  return config.providers?.oauth?.find((p) => p.id === providerId)
}

/**
 * Get SSO provider config by ID
 */
export function getSSOProviderConfig(providerId: string) {
  const config = getAuthConfig()
  return config.providers?.sso?.find((p) => p.id === providerId)
}

/**
 * Check if MFA is enabled
 */
export function isMFAEnabled(): boolean {
  const config = getAuthConfig()
  return config.mfa?.policy !== 'disabled'
}

/**
 * Clear cached config (useful for testing or hot-reload)
 */
export function clearAuthConfigCache(): void {
  cachedConfig = null
}

// Export default config for convenience
export const authConfig = getAuthConfig()
