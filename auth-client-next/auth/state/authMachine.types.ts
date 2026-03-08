/**
 * auth/state/authMachine.types.ts
 * Purpose: Types for auth XState machine (context, events, state names).
 * Inputs: None.
 * Outputs: AuthContext, AuthEvent, AuthStateValue.
 * Dependencies: auth/types (User).
 */

import type { User } from "@/auth/types";

export type OtpChannel = "email" | "sms" | "whatsapp";

export interface AuthContext {
  tenantId: string;
  user: User | null;
  error: string | null;
  otpChannel: OtpChannel | null;
  mfaPending: boolean;
}

export type AuthEvent =
  | { type: "GO_TO_LOGIN" }
  | { type: "LOGIN_WITH_PASSWORD"; payload: { email: string; password: string; tenantId?: string } }
  | { type: "REQUEST_MAGIC_LINK"; payload: { email: string; tenantId?: string } }
  | { type: "REQUEST_OTP_EMAIL"; payload: { email: string; tenantId?: string } }
  | { type: "REQUEST_OTP_SMS"; payload: { phone: string; tenantId?: string } }
  | { type: "VERIFY_OTP"; payload: { identifier: string; code: string; channel: OtpChannel; tenantId?: string } }
  | { type: "START_OAUTH"; payload: { provider: string; tenantId?: string } }
  | { type: "OAUTH_CALLBACK"; payload: { provider: string; query: Record<string, string> } }
  | { type: "VERIFY_MFA"; payload: { code?: string; tenantId?: string } }
  | { type: "LOGOUT" }
  | { type: "NAVIGATE_MAGIC_LINK" }
  | { type: "NAVIGATE_PHONE" }
  | { type: "RETRY" };

export type AuthStateValue =
  | "anonymous"
  | "primaryLogin"
  | "awaitingOtp"
  | "mfaRequired"
  | "authenticated"
  | "error";
