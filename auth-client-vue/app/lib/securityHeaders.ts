/**
 * Config-driven security headers for API requests.
 * Resolves static, generate-uuid, from-context, from-env from auth config security.requestHeaders.
 */

import { authConfig } from "../../config/authConfig";

export type SecurityHeaderEntry = {
  name: string;
  value?: string;
  source?: "static" | "generate-uuid" | "from-context" | "from-env";
};

export type SecurityHeadersContext = {
  tenantId?: string;
  userId?: string;
};

function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolve security headers from config. Merge with auth headers in the same place (commonApi).
 */
export function getSecurityHeaders(context?: SecurityHeadersContext): Record<string, string> {
  const entries = (authConfig as { security?: { requestHeaders?: SecurityHeaderEntry[] } }).security?.requestHeaders;
  if (!Array.isArray(entries) || entries.length === 0) return {};

  const out: Record<string, string> = {};
  const config = useRuntimeConfig?.()?.public ?? {};

  for (const entry of entries) {
    const name = entry.name;
    if (!name) continue;

    let value: string | undefined;

    switch (entry.source) {
      case "generate-uuid":
        value = generateUuid();
        break;
      case "from-context":
        if (entry.name === "X-Tenant-ID" && context?.tenantId) value = context.tenantId;
        else if (entry.name === "X-User-ID" && context?.userId) value = context.userId;
        else if (context) value = (context as Record<string, string>)[entry.name] ?? entry.value;
        else value = entry.value;
        break;
      case "from-env":
        value = (config as Record<string, string>)[entry.name] ?? entry.value ?? "";
        break;
      case "static":
      default:
        value = entry.value ?? "";
        break;
    }

    if (value !== undefined && value !== "") {
      out[name] = String(value);
    }
  }

  return out;
}
