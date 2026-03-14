import rawConfig from "./tenant.json";

export const tenantConfig = {
    ...rawConfig,
} as const;

export type TenantConfig = typeof tenantConfig;