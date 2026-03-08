/**
 * config/appConfig.ts
 * Purpose: Central app configuration and design tokens for the Celestial Auth Portal frontend.
 * Inputs: Environment variables (NEXT_PUBLIC_API_URL, VITE_API_URL).
 * Outputs: appConfig object (apiBaseUrl, defaultTenantId, tokens).
 * Dependencies: None (reads process.env at load time).
 */

export const appConfig = {
  apiBaseUrl:
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL ??
        process.env.VITE_API_URL ??
        "http://localhost:5001"
      : "http://localhost:5001",

  defaultTenantId: "default" as const,

  tokens: {
    colors: {
      /** Maps to Tailwind/shadcn :root --background */
      background: "var(--background)",
      /** Maps to Tailwind/shadcn :root --foreground */
      textPrimary: "var(--foreground)",
      /** Maps to Tailwind/shadcn :root --muted-foreground */
      textSecondary: "var(--muted-foreground)",
      /** Maps to Tailwind/shadcn :root --border */
      border: "var(--border)",
      /** Maps to Tailwind/shadcn :root --primary */
      primary: "var(--primary)",
      /** Maps to Tailwind/shadcn :root --accent */
      accent: "var(--accent)",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radii: {
      sm: 4,
      md: 8,
      lg: 16,
    },
    typography: {
      fontFamily: "Inter",
      baseSize: 14,
    },
  },
} as const;

export type AppConfig = typeof appConfig;
