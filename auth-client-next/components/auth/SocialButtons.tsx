/**
 * components/auth/SocialButtons.tsx
 * Purpose: OAuth buttons (Google, GitHub, Microsoft); call authService.startOAuth(provider, tenantId).
 * Inputs: providers[], tenantId?, loading?. If !isMethodEnabled("oauth") render null.
 * Outputs: Renders buttons or null.
 * Dependencies: auth/services/authService, auth/store/authConfigStore, Tailwind.
 */

"use client";

import React from "react";
import { startOAuth } from "@/auth/services/authService";
import { isMethodEnabled } from "@/auth/store/authConfigStore";
import { cn } from "@/lib/utils";

export type SocialProvider = "google" | "github" | "microsoft";

interface SocialButtonsProps {
  providers: SocialProvider[];
  tenantId?: string;
  loading?: boolean;
  className?: string;
}

const labels: Record<SocialProvider, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
};

export function SocialButtons({
  providers,
  tenantId,
  loading = false,
  className,
}: SocialButtonsProps) {
  if (!isMethodEnabled("oauth")) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={loading}
          onClick={() => startOAuth(provider, tenantId)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-background px-4 py-2 text-foreground",
            "hover:bg-muted disabled:opacity-50"
          )}
        >
          <span className="text-lg">{labels[provider]}</span>
          <span>Continue with {labels[provider]}</span>
        </button>
      ))}
    </div>
  );
}
