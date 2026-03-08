// auth/validation/authConfigHelpers.ts
import { authConfig, type AuthConfig } from "../../config/authConfig";

const FALLBACKS = {
    passwordMinLength: 12,
    otpDigits: 6,
    minPhoneDigits: 6,
    countryCode: "+91",
    resetTokenMinLength: 1,
};

export type AuthRules = {
    passwordMinLength: number;
    otpDigitsEmail: number;
    otpDigitsPhone: number;
    otpDigitsMfa: number;
    minPhoneDigits: number;
    defaultCountryCode: string;
    resetTokenMinLength: number;
};

/**
 * Derive all validation numbers/strings from auth config,
 * with sane defaults as fallback.
 */
export function getAuthRules(auth: AuthConfig = authConfig): AuthRules {
    const passwordPolicy = auth.passwordPolicy;
    const methods = auth.methodsConfig;

    const passwordMinLength =
        passwordPolicy?.minLength ?? FALLBACKS.passwordMinLength;

    const otpDigitsEmail = methods.email_otp?.digits ?? FALLBACKS.otpDigits;

    const otpDigitsPhone = methods.phone_sms_otp?.digits ?? FALLBACKS.otpDigits;

    // For now we just reuse email_otp digits for MFA TOTP,
    // you can add a dedicated mfa.totp.digits later if needed.
    const otpDigitsMfa = otpDigitsEmail;

    const minPhoneDigits = FALLBACKS.minPhoneDigits; // extend config later if you want
    const defaultCountryCode = FALLBACKS.countryCode;

    const resetTokenMinLength = FALLBACKS.resetTokenMinLength; // plug config when you add it

    return {
        passwordMinLength,
        otpDigitsEmail,
        otpDigitsPhone,
        otpDigitsMfa,
        minPhoneDigits,
        defaultCountryCode,
        resetTokenMinLength,
    };
}
