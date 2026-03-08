/**
 * Auth client service – HTTP only. Calls Nuxt BFF (/api/auth/*) via common API instance.
 * No Vue imports; used by useAuth and other composables.
 */

import { fetchGetRequest, fetchPostRequest } from "../lib/commonApi";
import type {
  LoginWithPasswordInput,
  ResetPasswordInput,
} from "../../schema/zod/authSchemas";

export type LoginWithPasswordResult = {
  accessToken: string;
  user: { id: string; email: string; tenantId?: string; role?: string };
};

export type AuthApiError = { error: string; code?: string };

export type MeUser = { id: string; email: string; tenantId?: string; role?: string };

function throwIfError<T>(res: T | AuthApiError): asserts res is T {
  if (res && typeof res === "object" && "error" in res) {
    throw new Error((res as AuthApiError).error);
  }
}

/**
 * Login with email and password. Calls BFF POST /api/auth/email-password/login.
 */
export async function loginWithPassword(
  payload: LoginWithPasswordInput
): Promise<LoginWithPasswordResult> {
  const body = {
    email: payload.email,
    password: payload.password,
    remember_me: payload.rememberMe ?? false,
  };

  const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>(
    "/api/auth/email-password/login",
    { body, auth: false }
  );

  throwIfError(res);
  return res as LoginWithPasswordResult;
}

/**
 * Logout. Calls BFF POST /api/auth/email-password/logout with cookies.
 */
export async function logout(): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>(
    "/api/auth/email-password/logout",
    { body: {}, auth: false, credentials: "include" }
  );
  throwIfError(res as AuthApiError);
}

/**
 * Refresh access token. Calls BFF POST /api/auth/email-password/refresh with cookies.
 */
export async function refreshToken(): Promise<LoginWithPasswordResult | null> {
  const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>(
    "/api/auth/email-password/refresh",
    { body: {}, auth: false, credentials: "include" }
  );
  if (res && typeof res === "object" && "error" in res) {
    return null;
  }
  return res as LoginWithPasswordResult;
}

/**
 * Get current user. Uses common API with auth=true (Bearer from store).
 */
export async function getMe(): Promise<MeUser | null> {
  const res = await fetchGetRequest<MeUser | AuthApiError>("/api/auth/email-password/me", {
    auth: true,
  });
  if (res && typeof res === "object" && "error" in res) {
    return null;
  }
  return res as MeUser;
}

/**
 * Request password reset email.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/forgot-password", {
    body: { email },
    auth: false,
  });
  throwIfError(res as AuthApiError);
}

/**
 * Verify password reset token and set new password.
 */
export async function verifyPasswordReset(payload: ResetPasswordInput): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/reset-password", {
    body: {
      token: payload.token,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    },
    auth: false,
  });
  throwIfError(res as AuthApiError);
}

/**
 * Get OAuth authorize URL for a provider. Client should do window.location.href = url.
 */
export async function getOauthAuthorizeUrl(providerId: string): Promise<string> {
  const res = await fetchGetRequest<{ url: string } | AuthApiError>(
    `/api/auth/oauth/authorize-url?${new URLSearchParams({ provider: providerId })}`,
    { auth: false }
  );
  if (res && typeof res === "object" && "error" in res) {
    throw new Error((res as AuthApiError).error);
  }
  return (res as { url: string }).url;
}

/**
 * Send email OTP to the given email.
 */
export async function sendEmailOtp(email: string): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/email-otp/send", {
    body: { email },
    auth: false,
  });
  throwIfError(res as AuthApiError);
}

/**
 * Verify email OTP code and complete login (BFF sets cookie).
 */
export async function verifyEmailOtp(payload: { email: string; code: string }): Promise<LoginWithPasswordResult | null> {
  const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/email-otp/verify", {
    body: payload,
    auth: false,
    credentials: "include",
  });
  if (res && typeof res === "object" && "error" in res) {
    return null;
  }
  return res as LoginWithPasswordResult;
}

/**
 * Request magic link to the given email. User clicks link in email to complete login (BFF consume).
 */
export async function requestMagicLink(email: string): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/magic-link/request", {
    body: { email },
    auth: false,
  });
  throwIfError(res as AuthApiError);
}
export async function sendSmsOtp(payload: { phone: string; countryCode?: string }): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/phone-otp/send", {
    body: { phone: payload.phone, countryCode: payload.countryCode ?? "+1" },
    auth: false,
  });
  throwIfError(res as AuthApiError);
}

/**
 * Verify phone SMS OTP and complete login (BFF sets cookie).
 */
export async function verifySmsOtp(payload: { phone: string; code: string }): Promise<LoginWithPasswordResult | null> {
  const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/phone-otp/verify", {
    body: payload,
    auth: false,
    credentials: "include",
  });
  if (res && typeof res === "object" && "error" in res) {
    return null;
  }
  return res as LoginWithPasswordResult;
}

/**
 * MFA: enable (start setup). Requires auth.
 */
export async function enableMfa(): Promise<unknown> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/enable", {
    body: {},
    auth: true,
  });
  throwIfError(res as AuthApiError);
  return res;
}

/**
 * MFA: verify setup (complete enrollment with code). Requires auth.
 */
export async function verifyMfaSetup(code: string): Promise<unknown> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/verify-setup", {
    body: { code },
    auth: true,
  });
  throwIfError(res as AuthApiError);
  return res;
}

/**
 * MFA: verify (login challenge). Requires auth (or session).
 */
export async function verifyMfa(code: string): Promise<LoginWithPasswordResult | null> {
  const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/mfa/verify", {
    body: { code },
    auth: true,
    credentials: "include",
  });
  if (res && typeof res === "object" && "error" in res) return null;
  return res as LoginWithPasswordResult;
}

/**
 * MFA: disable. Requires auth.
 */
export async function disableMfa(): Promise<void> {
  const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/disable", {
    body: {},
    auth: true,
  });
  throwIfError(res as AuthApiError);
}
