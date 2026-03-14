import rawConfig from "./brand.json";

export const brandConfig = {
    ...rawConfig,
} as const;

export type BrandConfig = typeof brandConfig;

/** CSS variable names used by default classes (aligned with main.css @theme) */
export const brandCssVarNames = {
    primary: "--primary",
    primaryDark: "--primary-dark",
    secondary: "--secondary",
    background: "--background",
    surface: "--surface",
    error: "--error",
    success: "--success",
    warning: "--warning",
    radius: "--radius",
    shadow: "--shadow",
    fontHeading: "--font-heading",
    fontBody: "--font-body",
} as const;

/** Brand token values as CSS custom properties for :root injection */
export function getBrandCssVars(
    source: { tokens: BrandConfig["tokens"] } = brandConfig
): Record<string, string> {
    const { tokens } = source;
    return {
        /* Raw brand tokens */
        "--primary": tokens.primary,
        "--primary-dark": tokens.primaryDark,
        "--secondary": tokens.secondary,
        "--background": tokens.background,
        "--surface": tokens.surface,
        "--error": tokens.error,
        "--success": tokens.success,
        "--warning": tokens.warning,
        "--radius": tokens.radius,
        "--shadow": tokens.shadow,
        "--font-heading": tokens.fontHeading,
        "--font-body": tokens.fontBody,
        /* Semantic vars for Tailwind @theme (used by default) */
        "--primary-foreground": "#f9fafb",
        "--foreground": tokens.secondary,
        "--card": tokens.surface,
        "--card-foreground": tokens.secondary,
        "--popover": tokens.surface,
        "--popover-foreground": tokens.secondary,
        "--destructive": tokens.error,
    };
}

/** Utility class names for default brand styling (use these in components) */
export const brandClasses = {
    /** Primary CTA button / brand accent */
    primary: "brand-primary",
    /** Surface (cards, modals) */
    surface: "brand-surface",
    /** Page background */
    background: "brand-background",
    /** Primary text color */
    secondary: "brand-secondary",
    /** Error state */
    error: "brand-error",
    /** Success state */
    success: "brand-success",
    /** Warning state */
    warning: "brand-warning",
    /** Default border radius */
    radius: "brand-radius",
    /** Default shadow */
    shadow: "brand-shadow",
    /** Heading font */
    fontHeading: "brand-font-heading",
    /** Body font */
    fontBody: "brand-font-body",
} as const;
