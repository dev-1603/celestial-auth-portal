/**
 * auth/services/authService.ts
 * Purpose: Auth API client — all auth API calls go through this module only.
 * Inputs: Validated payloads (after Zod); appConfig for base URL.
 * Outputs: Auth methods return Promise<LoginResponse> or void; throw on validation or API error.
 * Dependencies: config/appConfig, auth/validation/loginSchemas, auth/types, zod (ZodError).
 */

import { appConfig } from "@/config/appConfig";
import {
  LoginWithPasswordSchema,
  MagicLinkRequestSchema,
  PhoneOtpRequestSchema,
  OtpVerifySchema,
  MfaVerifySchema,
  SignupSchema,
  SignupRequestSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/auth/validation/loginSchemas";
import type { LoginResponse, NextStepResponse } from "@/auth/types";
import { ZodError } from "zod";

function baseUrl(): string {
  return appConfig.apiBaseUrl.replace(/\/$/, "");
}

export interface AuthApiError {
  errorCode: string;
  message: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & AuthApiError;
  if (!res.ok) {
    throw {
      errorCode: body.errorCode ?? "UNKNOWN_ERROR",
      message: body.message ?? res.statusText,
    } as AuthApiError;
  }
  return body as T;
}

async function post<T>(path: string, payload: object): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse<T>(res);
}

async function postVoid(path: string, payload: object): Promise<void> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as AuthApiError;
    throw {
      errorCode: body.errorCode ?? "UNKNOWN_ERROR",
      message: body.message ?? res.statusText,
    } as AuthApiError;
  }
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${baseUrl()}${path}${q}`, { credentials: "include" });
  return handleResponse<T>(res);
}

// ——— Step 4: loginWithPassword ———
export async function loginWithPassword(payload: unknown): Promise<LoginResponse> {
  const parsed = LoginWithPasswordSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/email/login", parsed.data);
}

// ——— Step 5: magic link + email OTP ———
export async function requestMagicLink(payload: unknown): Promise<void> {
  const parsed = MagicLinkRequestSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  await postVoid("/auth/magic-link/request", parsed.data);
}

export async function requestEmailOtp(payload: unknown): Promise<NextStepResponse> {
  const parsed = MagicLinkRequestSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<NextStepResponse>("/auth/otp/email/request", parsed.data);
}

export async function verifyEmailOtp(payload: unknown): Promise<LoginResponse> {
  const parsed = OtpVerifySchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/otp/email/verify", parsed.data);
}

// ——— Step 6: SMS OTP ———
export async function requestSmsOtp(payload: unknown): Promise<NextStepResponse> {
  const parsed = PhoneOtpRequestSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<NextStepResponse>("/auth/otp/sms/request", parsed.data);
}

export async function verifySmsOtp(payload: unknown): Promise<LoginResponse> {
  const parsed = OtpVerifySchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/otp/sms/verify", parsed.data);
}

// ——— Step 7: OAuth ———
export function startOAuth(provider: string, tenantId?: string): void {
  const params = new URLSearchParams();
  if (tenantId) params.set("tenantId", tenantId);
  const q = params.toString() ? `?${params.toString()}` : "";
  window.location.href = `${baseUrl()}/auth/oauth/${provider}${q}`;
}

export async function handleOAuthCallback(
  provider: string,
  query: Record<string, string>
): Promise<LoginResponse> {
  const params = new URLSearchParams(query);
  return get<LoginResponse>(`/auth/oauth/${encodeURIComponent(provider)}/session`, Object.fromEntries(params));
}

// ——— Step 8: MFA, session, logout, signup, password ———
export async function verifyMfa(payload: unknown): Promise<LoginResponse> {
  const parsed = MfaVerifySchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/mfa/verify", parsed.data);
}

export async function getSession(): Promise<LoginResponse> {
  try {
    const res = await fetch(`${baseUrl()}/auth/session`, { credentials: "include" });
    if (!res.ok) return { user: null };
    const body = (await res.json()) as LoginResponse;
    return body;
  } catch {
    return { user: null };
  }
}

export async function logout(): Promise<void> {
  await postVoid("/auth/logout", {});
}

export async function signupWithPassword(payload: unknown): Promise<LoginResponse> {
  const parsed = SignupSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/email/signup", parsed.data);
}

export async function requestPasswordReset(payload: unknown): Promise<void> {
  const parsed = ForgotPasswordSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  await postVoid("/auth/password/forgot", parsed.data);
}

export async function resetPassword(payload: unknown): Promise<LoginResponse> {
  const parsed = ResetPasswordSchema.safeParse(payload);
  if (!parsed.success) throw parsed.error;
  return post<LoginResponse>("/auth/password/reset", parsed.data);
}
