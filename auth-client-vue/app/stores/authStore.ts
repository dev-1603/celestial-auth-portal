/**
 * Minimal auth state – accessToken and user after login.
 * Used by authRequestProvider to add Authorization header; clear on logout.
 */

import { ref, readonly } from "vue";
import type { Ref } from "vue";

const accessToken: Ref<string | null> = ref(null);
const user: Ref<{ id: string; email: string; tenantId?: string; role?: string } | null> = ref(null);

export function useAuthState() {
  function setAuth(token: string, userPayload: { id: string; email: string; tenantId?: string; role?: string }) {
    accessToken.value = token;
    user.value = userPayload;
  }

  function clearAuth() {
    accessToken.value = null;
    user.value = null;
  }

  return {
    accessToken: readonly(accessToken),
    user: readonly(user),
    setAuth,
    clearAuth,
  };
}
