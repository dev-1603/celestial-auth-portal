/**
 * routes/guards/authGuard.tsx
 * Purpose: Protect /app/* routes — ensure user is authenticated or restore session from getSession().
 * Inputs: children (React node).
 * Outputs: Renders children if authenticated; redirects to /login otherwise.
 * Dependencies: auth/store/authStore, auth/services/authService, next/navigation.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/auth/store/authStore";
import { getSession } from "@/auth/services/authService";
import { setSession } from "@/auth/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    getSession().then((resp) => {
      if (cancelled) return;
      if (resp.user != null) {
        setSession(resp);
        setChecked(true);
      } else {
        router.replace("/login");
      }
    }).catch(() => {
      if (!cancelled) router.replace("/login");
    }).finally(() => {
      if (!cancelled) setChecked(true);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, router]);

  if (!checked) return null;
  if (!useAuthStore.getState().isAuthenticated) return null;
  return <>{children}</>;
}
