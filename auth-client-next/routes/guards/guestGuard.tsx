/**
 * routes/guards/guestGuard.tsx
 * Purpose: Guard /login, /signup, /forgot-password — redirect to /app if already authenticated.
 * Inputs: children (React node).
 * Outputs: Renders children if guest; redirects to /app if authenticated.
 * Dependencies: auth/store/authStore, next/navigation.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/auth/store/authStore";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (isAuthenticated) router.replace("/app");
  }, [checked, isAuthenticated, router]);

  if (!checked) return null;
  if (isAuthenticated) return null;
  return <>{children}</>;
}
