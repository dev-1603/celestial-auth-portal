/**
 * auth/store/authStore.ts
 * Purpose: Client-side auth state (user, tenant, isAuthenticated, mfaRequired).
 * Inputs: setSession(LoginResponse), clearSession(), setMfaRequired(boolean).
 * Outputs: Zustand store with state and methods.
 * Dependencies: auth/types (User, LoginResponse).
 */

import { create } from "zustand";
import type { LoginResponse, User } from "@/auth/types";

export interface AuthState {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  mfaRequired: boolean;
}

const defaults: AuthState = {
  user: null,
  tenantId: null,
  isAuthenticated: false,
  mfaRequired: false,
};

export const useAuthStore = create<AuthState>(() => ({ ...defaults }));

export function setSession(resp: LoginResponse): void {
  const user = resp.user ?? null;
  useAuthStore.setState({
    user,
    tenantId: user?.tenantId ?? null,
    isAuthenticated: user != null,
    mfaRequired: resp.nextStep === "MFA_REQUIRED",
  });
}

export function clearSession(): void {
  useAuthStore.setState({ ...defaults });
}

export function setMfaRequired(flag: boolean): void {
  useAuthStore.setState({ mfaRequired: flag });
}
