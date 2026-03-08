/**
 * auth/store/authConfigStore.ts
 * Purpose: Tenant auth config and loading flag; helper to check enabled methods.
 * Inputs: setConfig(TenantAuthConfig), setLoading(boolean).
 * Outputs: Zustand store; isMethodEnabled(method) returns boolean.
 * Dependencies: auth/types (TenantAuthConfig).
 */

import { create } from "zustand";
import type { TenantAuthConfig } from "@/auth/types";

export type EnabledMethodKey = keyof TenantAuthConfig["enabledMethods"];

export interface AuthConfigState {
  config: TenantAuthConfig | null;
  loading: boolean;
}

export const useAuthConfigStore = create<AuthConfigState>(() => ({
  config: null,
  loading: false,
}));

export function setConfig(config: TenantAuthConfig | null): void {
  useAuthConfigStore.setState({ config });
}

export function setLoading(flag: boolean): void {
  useAuthConfigStore.setState({ loading: flag });
}

export function isMethodEnabled(method: EnabledMethodKey): boolean {
  const config = useAuthConfigStore.getState().config;
  if (config == null) return false;
  return config.enabledMethods[method] === true;
}
