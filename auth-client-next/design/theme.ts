/**
 * design/theme.ts
 * Purpose: Build merged theme from app config and tenant overrides; produce CSS variable map.
 * Inputs: appConfig (imported), optional TenantTheme (primaryColor, accentColor, logoUrl, backgroundVariant).
 * Outputs: Theme type, buildTheme(), getCssVars().
 * Dependencies: config/appConfig.
 */

import { appConfig } from "@/config/appConfig";

/** Tenant-provided theme overrides (partial). */
export interface TenantTheme {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  backgroundVariant?: "solid" | "gradient" | "image";
}

const DEFAULT_PRIMARY = "#3B82F6";
const DEFAULT_ACCENT = "#10B981";
const DEFAULT_LOGO_URL = "";
const DEFAULT_BACKGROUND_VARIANT = "solid" as const;

/** Full theme: app tokens + resolved tenant overrides. */
export type Theme = typeof appConfig.tokens & {
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  backgroundVariant: "solid" | "gradient" | "image";
};

/**
 * Merges appConfig.tokens with tenant overrides. Missing tenant fields use defaults.
 */
export function buildTheme(tenantTheme?: TenantTheme): Theme {
  return {
    ...appConfig.tokens,
    primaryColor: tenantTheme?.primaryColor ?? DEFAULT_PRIMARY,
    accentColor: tenantTheme?.accentColor ?? DEFAULT_ACCENT,
    logoUrl: tenantTheme?.logoUrl ?? DEFAULT_LOGO_URL,
    backgroundVariant: tenantTheme?.backgroundVariant ?? DEFAULT_BACKGROUND_VARIANT,
  };
}

/**
 * Returns a CSS variable map for the theme using Tailwind/shadcn :root variable names.
 * Apply to :root or a wrapper so Tailwind utilities (bg-primary, text-foreground, etc.) work.
 */
export function getCssVars(theme: Theme): Record<string, string> {
  return {
    "--primary": theme.primaryColor,
    "--accent": theme.accentColor,
    "--primary-foreground": getContrastForeground(theme.primaryColor),
    "--accent-foreground": getContrastForeground(theme.accentColor),
    "--background": theme.colors.background.startsWith("var(")
      ? "#ffffff"
      : theme.colors.background,
    "--foreground": theme.colors.textPrimary.startsWith("var(")
      ? "#111827"
      : theme.colors.textPrimary,
    "--muted-foreground": theme.colors.textSecondary.startsWith("var(")
      ? "#6B7280"
      : theme.colors.textSecondary,
    "--border": theme.colors.border.startsWith("var(")
      ? "#E5E7EB"
      : theme.colors.border,
    "--radius": "0.5rem", /* 8px, matches tokens.radii.md */
  };
}

/** Picks a readable foreground (white or black) for a given background color (hex). */
function getContrastForeground(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0a0a0a" : "#fafafa";
}
