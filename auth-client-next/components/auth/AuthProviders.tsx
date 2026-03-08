"use client";

import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { AuthBoot } from "@/components/auth/AuthBoot";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      <AuthBoot>{children}</AuthBoot>
    </AuthErrorBoundary>
  );
}
