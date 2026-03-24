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
import { z } from 'zod'

// ESM has no __dirname; derive it from import.meta.url. (tsconfig is CommonJS so we suppress the check.)
const __dirname = path.dirname(
  // @ts-expect-error import.meta is valid at ESM runtime (package "type": "module"); TS only allows it for ESM module option
  fileURLToPath(import.meta.url)
)

// Default path: backend-auth-core/config/auth.json (relative to this file: src/config -> root)
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '..', '..', 'config/auth.json')

/**
 * Zod schema for AuthConfig validation
 */
const AuthConfigSchema = z.object({
  enabledMethods: z.array(z.string()).min(1, 'enabledMethods must be a non-empty array'),
  defaultMethod: z.string().optional(),
  signupMode: z.enum(['invite_only', 'open', 'closed']).optional(),
  passwordPolicy: z
    .object({
      minLength: z.number().optional(),
      requireUpper: z.boolean().optional(),
      requireLower: z.boolean().optional(),
      requireNumber: z.boolean().optional(),
      requireSpecial: z.boolean().optional(),
      allowCommon: z.boolean().optional(),
      maxAgeDays: z.number().optional(),
      historyCount: z.number().optional(),
      lockoutThreshold: z.number().optional(),
      lockoutMinutes: z.number().optional(),
    })
    .optional(),
  emailVerification: z.boolean().optional(),
  requireVerifiedEmail: z.boolean().optional(),
  mfa: z
    .object({
      required: z.boolean().optional(),
      policy: z.enum(['required', 'optional', 'disabled']).optional(),
      methods: z.array(z.string()).optional(),
    })
    .optional(),
  methodsConfig: z.record(z.string(), z.any()).optional(),
  providers: z
    .object({
      oauth: z
        .array(
          z.object({
            id: z.string(),
            enabled: z.boolean(),
            displayName: z.string().optional(),
            logo: z.string().optional(),
            buttonVariant: z.string().optional(),
          }).passthrough(), // Allow additional properties
        )
        .optional(),
      sso: z
        .array(
          z.object({
            id: z.string(),
            type: z.string().optional(),
            enabled: z.boolean(),
            displayName: z.string().optional(),
            logo: z.string().optional(),
          }).passthrough(), // Allow additional properties
        )
        .optional(),
    })
    .optional(),
  rateLimits: z
    .object({
      loginAttempts: z.number().optional(),
      windowMinutesLogin: z.number().optional(),
      resetRequests: z.number().optional(),
      windowMinutesReset: z.number().optional(),
      otpRequests: z.number().optional(),
      windowMinutesOtp: z.number().optional(),
      perIp: z.number().optional(),
      perUser: z.number().optional(),
    })
    .optional(),
  session: z
    .object({
      maxAgeDays: z.number().optional(),
      idleTimeoutMinutes: z.number().optional(),
      sameSite: z.enum(['strict', 'lax', 'none']).optional(),
      secure: z.boolean().optional(),
      cookieDomain: z.string().nullable().optional(),
      refreshTokenRotation: z.boolean().optional(),
      rememberMeMaxAgeDays: z.number().optional(),
    })
    .optional(),
  redirects: z
    .object({
      afterLogin: z.string().optional(),
      afterLogout: z.string().optional(),
      firstLogin: z.string().optional(),
      signupComplete: z.string().optional(),
      afterMfaEnroll: z.string().optional(),
      afterPasswordReset: z.string().optional(),
    })
    .optional(),
}).passthrough() // Allow extra keys for forward compatibility

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
    const rawConfig = JSON.parse(configContent)

    // Validate with Zod schema
    const validationResult = AuthConfigSchema.safeParse(rawConfig)
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      throw new Error(`Invalid auth config: ${errors}`)
    }

    const config = validationResult.data as AuthConfig

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
    // Re-throw validation errors as-is
    if (error.message?.startsWith('Invalid auth config:')) {
      throw error
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
 * Check if a method is enabled for mounting routes.
 * Returns true only if method is in enabledMethods AND methodsConfig.<method>.enabled !== false
 */
export function isMethodEnabledToMount(method: string): boolean {
  const config = getAuthConfig()
  if (!config.enabledMethods.includes(method)) {
    return false
  }
  const methodConfig = config.methodsConfig?.[method]
  // If methodsConfig.<method>.enabled is explicitly false, disable even if in enabledMethods
  return methodConfig?.enabled !== false
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
 * Check if SSO is enabled
 */
export function isSSOEnabled(): boolean {
  return isMethodEnabledToMount('sso')
}

/**
 * Check if QR Login is enabled
 */
export function isQRLoginEnabled(): boolean {
  return isMethodEnabledToMount('qr_login')
}

/**
 * Get QR Login config
 */
export function getQRLoginConfig() {
  return getMethodConfig('qr_login')
}

/**
 * Check if Passkey/WebAuthn is enabled
 */
export function isPasskeyEnabled(): boolean {
  return isMethodEnabledToMount('passkey')
}

/**
 * Get Passkey config
 */
export function getPasskeyConfig() {
  return getMethodConfig('passkey')
}

/**
 * Get signup mode
 */
export function getSignupMode(): 'invite_only' | 'open' | 'closed' {
  const config = getAuthConfig()
  return config.signupMode || 'open'
}

/**
 * Get password policy
 */
export function getPasswordPolicy() {
  const config = getAuthConfig()
  return config.passwordPolicy || {}
}

/**
 * Clear cached config (useful for testing or hot-reload)
 */
export function clearAuthConfigCache(): void {
  cachedConfig = null
}

// Export default config for convenience
export const authConfig = getAuthConfig()
