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
  user: { id: string; email: string; tenantId?: string; tenantSlug?: string; role?: string };
};

export type AuthApiError = { error: string; code?: string };

export type MeUser = { id: string; email: string; tenantId?: string; tenantSlug?: string; role?: string };

/**
 * Login with email and password. Calls BFF POST /api/auth/email-password/login.
 */
export async function loginWithPassword(
  payload: LoginWithPasswordInput
): Promise<LoginWithPasswordResult> {
  try {
    const body = {
      email: payload.email,
      password: payload.password,
      remember_me: payload.rememberMe ?? false,
    };

    const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>(
      "/api/auth/email-password/login",
      { body, auth: false }
    );
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
    return res as LoginWithPasswordResult;
  } catch (error) {
    throw error;
  }
}

/**
 * Logout. Calls BFF POST /api/auth/email-password/logout with cookies.
 */
export async function logout(): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>(
      "/api/auth/email-password/logout",
      { body: {}, auth: false, credentials: "include" }
    );
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh access token. Calls BFF POST /api/auth/email-password/refresh with cookies.
 */
export async function refreshToken(): Promise<LoginWithPasswordResult | null> {
  try {
    const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>(
      "/api/auth/email-password/refresh",
      { body: {}, auth: false, credentials: "include" }
    );
    if (res && typeof res === "object" && "error" in res) {
      return null;
    }
    return res as LoginWithPasswordResult;
  } catch (error) {
    throw error;
  }
}

/**
 * Get current user. Uses common API with auth=true (Bearer from store).
 */
export async function getMe(): Promise<MeUser | null> {
  try {
    const res = await fetchGetRequest<MeUser | AuthApiError>("/api/auth/email-password/me", {
      auth: true,
    });
    if (res && typeof res === "object" && "error" in res) {
      return null;
    }
    return res as MeUser;
  } catch (error) {
    throw error;
  }
}

/**
 * Request password reset email.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/forgot-password", {
      body: { email },
      auth: false,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Verify password reset token and set new password.
 */
export async function verifyPasswordReset(payload: ResetPasswordInput): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/reset-password", {
      body: {
        token: payload.token,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
      },
      auth: false,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get BFF OAuth initiate URL for a provider. Client redirects here; BFF handles PKCE and IdP redirect.
 */
export function getOauthAuthorizeUrl(providerId: string): string {
  return `/api/auth/oauth/${encodeURIComponent(providerId)}/initiate`;
}

/**
 * Send email OTP to the given email.
 */
export async function sendEmailOtp(email: string): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/email-otp/send", {
      body: { email },
      auth: false,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Verify email OTP code and complete login (BFF sets cookie).
 */
export async function verifyEmailOtp(payload: { email: string; code: string }): Promise<LoginWithPasswordResult | null> {
  try {
    const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/email-otp/verify", {
      body: payload,
      auth: false,
      credentials: "include",
    });
    if (res && typeof res === "object" && "error" in res) {
      return null;
    }
    return res as LoginWithPasswordResult;
  } catch (error) {
    throw error;
  }
}

/**
 * Request magic link to the given email. User clicks link in email to complete login (BFF consume).
 */
export async function requestMagicLink(email: string): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/magic-link/request", {
      body: { email },
      auth: false,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}
export async function sendSmsOtp(payload: { phone: string; countryCode?: string }): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/phone-otp/send", {
      body: { phone: payload.phone, countryCode: payload.countryCode ?? "+1" },
      auth: false,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Verify phone SMS OTP and complete login (BFF sets cookie).
 */
export async function verifySmsOtp(payload: { phone: string; code: string }): Promise<LoginWithPasswordResult | null> {
  try {
    const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/phone-otp/verify", {
      body: payload,
      auth: false,
      credentials: "include",
    });
    if (res && typeof res === "object" && "error" in res) {
      return null;
    }
    return res as LoginWithPasswordResult;
  } catch (error) {
    throw error;
  }
}

/**
 * MFA: enable (start setup). Requires auth.
 */
export async function enableMfa(): Promise<unknown> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/enable", {
      body: {},
      auth: true,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
    return res;
  } catch (error) {
    throw error;
  }
}

/**
 * MFA: verify setup (complete enrollment with code). Requires auth.
 */
export async function verifyMfaSetup(code: string): Promise<unknown> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/verify-setup", {
      body: { code },
      auth: true,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
    return res;
  } catch (error) {
    throw error;
  }
}

/**
 * MFA: verify (login challenge). Requires auth (or session).
 */
export async function verifyMfa(code: string): Promise<LoginWithPasswordResult | null> {
  try {
    const res = await fetchPostRequest<LoginWithPasswordResult | AuthApiError>("/api/auth/mfa/verify", {
      body: { code },
      auth: true,
      credentials: "include",
    });
    if (res && typeof res === "object" && "error" in res) return null;
    return res as LoginWithPasswordResult;
  } catch (error) {
    throw error;
  }
}

/**
 * MFA: disable. Requires auth.
 */
export async function disableMfa(): Promise<void> {
  try {
    const res = await fetchPostRequest<unknown | AuthApiError>("/api/auth/mfa/disable", {
      body: {},
      auth: true,
    });
    if (res && typeof res === "object" && "error" in res) {
      throw new Error((res as AuthApiError).error);
    }
  } catch (error) {
    throw error;
  }
}
