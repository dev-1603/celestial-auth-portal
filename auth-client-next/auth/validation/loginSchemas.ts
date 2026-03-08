/**
 * auth/validation/loginSchemas.ts
 * Purpose: Zod schemas for auth form validation before any service call (login, signup, OTP, MFA, password reset).
 * Inputs: Raw form/request payloads.
 * Outputs: Validated data via .parse() / .safeParse(); inferred types for each schema.
 * Dependencies: zod.
 */

import { z } from "zod";

export const LoginWithPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantId: z.string().optional(),
});
export type LoginWithPassword = z.infer<typeof LoginWithPasswordSchema>;

export const MagicLinkRequestSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().optional(),
});
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;

export const PhoneOtpRequestSchema = z.object({
  phone: z.string().min(6),
  tenantId: z.string().optional(),
});
export type PhoneOtpRequest = z.infer<typeof PhoneOtpRequestSchema>;

export const OtpVerifySchema = z.object({
  identifier: z.string(),
  code: z.string().length(6),
  channel: z.enum(["email", "sms", "whatsapp"]),
  tenantId: z.string().optional(),
});
export type OtpVerify = z.infer<typeof OtpVerifySchema>;

export const MfaVerifySchema = z.object({
  code: z.string().length(6).optional(),
  tenantId: z.string().optional(),
});
export type MfaVerify = z.infer<typeof MfaVerifySchema>;

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  tenantId: z.string().optional(),
});
export type Signup = z.infer<typeof SignupSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  tenantId: z.string().optional(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().optional(),
});
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  tenantId: z.string().optional(),
});
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
