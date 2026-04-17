/**
 * Password Policy Validator
 *
 * Pure function that validates a password against a configurable password policy.
 * Returns a result with a boolean and accumulated error messages.
 */

export interface PasswordPolicyConfig {
  minLength?: number
  requireUpper?: boolean
  requireLower?: boolean
  requireNumber?: boolean
  requireSpecial?: boolean
  allowCommon?: boolean
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Top 20 most common passwords.
 * Used when allowCommon is false to reject trivially guessable passwords.
 */
const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  'password',
  '123456',
  '123456789',
  '12345678',
  '12345',
  '1234567',
  'qwerty',
  'abc123',
  'password1',
  '111111',
  '1234567890',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'login',
  'princess',
  'football',
  'shadow',
])

/**
 * Validate a password against the given policy configuration.
 *
 * Each enabled rule is checked independently and all violations are
 * accumulated so the caller can display every issue at once.
 */
export function validatePasswordPolicy(
  password: string,
  policy: PasswordPolicyConfig,
): PasswordValidationResult {
  const errors: string[] = []

  // Minimum length check
  if (policy.minLength !== undefined && policy.minLength > 0) {
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`)
    }
  }

  // Uppercase letter check
  if (policy.requireUpper === true) {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
  }

  // Lowercase letter check
  if (policy.requireLower === true) {
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
  }

  // Number check
  if (policy.requireNumber === true) {
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
  }

  // Special character check
  if (policy.requireSpecial === true) {
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
  }

  // Common password check (allowCommon defaults to true when not set)
  if (policy.allowCommon === false) {
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
