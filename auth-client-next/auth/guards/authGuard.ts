/**
 * auth/guards/authGuard.ts
 * Purpose: Protect /app/* routes — ensure user is authenticated or try getSession, else redirect to /login.
 * Inputs: Router (from next/navigation useRouter); authStore, authService.
 * Outputs: runAuthGuard() — call from client layout/page; redirects if unauthenticated.
 * Dependencies: auth/store/authStore, auth/services/authService, next/navigation.
 */

import { useAuthStore, setSession } from "@/auth/store/authStore";
import * as authService from "@/auth/services/authService";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function runAuthGuard(router: AppRouterInstance): Promise<boolean> {
  if (useAuthStore.getState().isAuthenticated) return true;
  const session = await authService.getSession();
  if (session?.user) {
    setSession(session);
    return true;
  }
  router.push("/login");
  return false;
}
