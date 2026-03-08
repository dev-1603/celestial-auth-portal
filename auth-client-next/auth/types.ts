/**
 * auth/types.ts
 * Purpose: Shared auth types for the Celestial Auth Portal frontend (match backend contract).
 * Inputs: None.
 * Outputs: Type exports (LoginResponse, NextStep, TenantId, etc.).
 * Dependencies: None.
 */

export type TenantId = string | null;

export type NextStep = "SUCCESS" | "MFA_REQUIRED" | "AWAITING_OTP";

export interface User {
  id: string;
  email: string;
  tenantId: TenantId;
  roles: string[];
}

export interface LoginResponse {
  nextStep?: NextStep;
  user?: User | null;
  errorCode?: string;
  message?: string;
}

/** Response shape for OTP/Magic link request endpoints */
export interface NextStepResponse {
  nextStep: NextStep;
}

/** Tenant auth config from backend (match .cursorrules). */
export interface TenantAuthConfig {
  signupMode: "OPEN" | "INVITE_ONLY" | "CLOSED";
  enabledMethods: {
    password: boolean;
    magicLink: boolean;
    emailOtp: boolean;
    smsOtp: boolean;
    oauth: boolean;
    sso: boolean;
  };
  mfaPolicy: "OFF" | "OPTIONAL" | "REQUIRED";
  theme: {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    backgroundVariant: "solid" | "gradient" | "image";
  };
}
