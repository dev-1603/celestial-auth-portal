/**
 * auth/services/tenantConfigService.ts
 * Purpose: Fetch tenant auth config from backend; safe defaults on error or offline.
 * Inputs: tenantId (string).
 * Outputs: getTenantConfig() returns Promise<TenantAuthConfig>.
 * Dependencies: config/appConfig, auth/types (TenantAuthConfig).
 */

import { appConfig } from "@/config/appConfig";
import type { TenantAuthConfig } from "@/auth/types";

const SAFE_DEFAULTS: TenantAuthConfig = {
  signupMode: "OPEN",
  enabledMethods: {
    password: true,
    magicLink: true,
    emailOtp: true,
    smsOtp: true,
    oauth: true,
    sso: true,
  },
  mfaPolicy: "OFF",
  theme: {
    logoUrl: "",
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    backgroundVariant: "solid",
  },
};

export type { TenantAuthConfig };

export async function getTenantConfig(tenantId: string): Promise<TenantAuthConfig> {
  const base = appConfig.apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/auth/config?tenantId=${encodeURIComponent(tenantId)}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return SAFE_DEFAULTS;
    const body = (await res.json()) as TenantAuthConfig;
    return body;
  } catch {
    return SAFE_DEFAULTS;
  }
}
