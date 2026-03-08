/**
 * auth/guards/guestGuard.ts
 * Purpose: Redirect authenticated users away from /login, /signup, /forgot-password.
 * Inputs: Router (from next/navigation useRouter).
 * Outputs: runGuestGuard() — call from client; redirects to /app if authenticated.
 * Dependencies: auth/store/authStore, next/navigation.
 */

import { useAuthStore } from "@/auth/store/authStore";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function runGuestGuard(router: AppRouterInstance): boolean {
  if (useAuthStore.getState().isAuthenticated) {
    router.push("/app");
    return false;
  }
  return true;
}
