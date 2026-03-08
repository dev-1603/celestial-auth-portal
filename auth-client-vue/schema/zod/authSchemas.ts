// auth/validation/authSchemas.ts
import { z } from "zod";
import { getAuthRules } from "./authConfigHelpers";

// Single place where config is pulled in:
const authRules = getAuthRules();

// ============ Core login ============

export const loginWithPasswordSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z
        .string()
        .min(
            authRules.passwordMinLength,
            `Password must be at least ${authRules.passwordMinLength} characters`,
        ),
    rememberMe: z.boolean().optional(),
});

export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;

// Email OTP request (send code to email)
export const emailOtpRequestSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

export type EmailOtpRequestInput = z.infer<typeof emailOtpRequestSchema>;

// Email OTP verify
export const emailOtpVerifySchema = z.object({
    email: z.string().email(),
    code: z
        .string()
        .regex(
            new RegExp(`^[0-9]{${authRules.otpDigitsEmail}}$`),
            `Enter ${authRules.otpDigitsEmail} digits`,
        ),
});

export type EmailOtpVerifyInput = z.infer<typeof emailOtpVerifySchema>;

// Magic link
export const magicLinkSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

// Phone SMS OTP request
export const smsOtpRequestSchema = z.object({
    phone: z.string().min(authRules.minPhoneDigits, "Enter a valid phone number"),
    countryCode: z.string().default(authRules.defaultCountryCode),
});

export type SmsOtpRequestInput = z.infer<typeof smsOtpRequestSchema>;

// Phone SMS OTP verify
export const smsOtpVerifySchema = z.object({
    phone: z.string().min(authRules.minPhoneDigits),
    code: z
        .string()
        .regex(
            new RegExp(`^[0-9]{${authRules.otpDigitsPhone}}$`),
            `Enter ${authRules.otpDigitsPhone} digits`,
        ),
});

export type SmsOtpVerifyInput = z.infer<typeof smsOtpVerifySchema>;

// ============ MFA ============

export const mfaTotpSchema = z.object({
    code: z
        .string()
        .regex(
            new RegExp(`^[0-9]{${authRules.otpDigitsMfa}}$`),
            `Enter ${authRules.otpDigitsMfa} digits`,
        ),
});

export type MfaTotpInput = z.infer<typeof mfaTotpSchema>;

// Optional WebAuthn payload (frontends can refine later)
export const mfaWebauthnSchema = z.object({
    assertion: z.any(), // placeholder; real type from WebAuthn library
});

export type MfaWebauthnInput = z.infer<typeof mfaWebauthnSchema>;

// ============ Signup & password reset ============

export const signupSchema = z.object({
    email: z.string().email("Enter a valid work email"),
    password: z
        .string()
        .min(
            authRules.passwordMinLength,
            `Password must be at least ${authRules.passwordMinLength} characters`,
        ),
    name: z.string().min(1, "Name is required").optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const signupRequestSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    company: z.string().optional(),
    message: z.string().optional(),
});

export type SignupRequestInput = z.infer<typeof signupRequestSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        token: z.string().min(authRules.resetTokenMinLength),
        password: z
            .string()
            .min(
                authRules.passwordMinLength,
                `Password must be at least ${authRules.passwordMinLength} characters`,
            ),
        confirmPassword: z.string().min(authRules.passwordMinLength),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
