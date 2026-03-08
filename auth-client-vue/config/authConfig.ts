// auth/config/authConfig.ts
import rawConfig from "./auth.json"; // or build from env / backend fetch

// Normalize / fill defaults if needed
export const authConfig = {
    ...rawConfig,
    // you can massage / ensure fields here
} as const;

// Reusable types inferred from the value
export type AuthConfig = typeof authConfig;

