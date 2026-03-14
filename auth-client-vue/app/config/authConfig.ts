import rawConfig from "./auth.json";
import type { AuthConfig, AuthProvider } from "../types/authConfig.types";

/**
 * Validated Auth Configuration.
 * Casting to unknown first allows us to strictly enforce the AuthConfig interface
 * over the imported JSON object.
 */
export const authConfig = rawConfig as unknown as AuthConfig;

/**
 * Returns all enabled providers (OAuth + SSO) as a single flat array.
 */
export function getAllProviders(): AuthProvider[] {
    const oauth = authConfig.providers?.oauth || [];
    const sso = authConfig.providers?.sso || [];
    return [...oauth, ...sso].filter(p => p.enabled !== false);
}

/**
 * Safely gets a specific provider by ID.
 */
export function getProviderById(id: string): AuthProvider | undefined {
    return getAllProviders().find(p => p.id === id);
}

/**
 * Returns the icon name for a given auth method ID, if configured.
 */
export function getMethodIcon(methodId: string): string | undefined {
    return authConfig.methodIcons?.[methodId];
}