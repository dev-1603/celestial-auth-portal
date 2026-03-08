/**
 * components/auth/SsoButton.tsx
 * Purpose: Single "Log in with SSO" button; navigates to /login/sso or shows inline email-domain input.
 * Inputs: None. If !isMethodEnabled("sso") render null.
 * Outputs: Renders button or null.
 * Dependencies: auth/store/authConfigStore, next/link or router, Tailwind.
 */

"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { isMethodEnabled } from "@/auth/store/authConfigStore";
import { cn } from "@/lib/utils";

interface SsoButtonProps {
  className?: string;
  disabled?: boolean;
}

export function SsoButton({ className, disabled }: SsoButtonProps) {
  if (!isMethodEnabled("sso")) return null;

  return (
    <Link
      href="/login/sso"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-background px-4 py-2 text-foreground",
        "hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      aria-disabled={disabled}
    >
      <Lock className="h-4 w-4" />
      <span>Log in with SSO</span>
    </Link>
  );
}
