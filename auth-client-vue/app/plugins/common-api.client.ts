/**
 * Initializes the common API instance with refresh and security context.
 * Client-only (.client.ts) so it runs only in the browser – avoids SSR and keeps hydration in sync.
 * Access tokens live in the BFF session (HttpOnly cookie + server store); no Bearer from the client.
 */

import { initCommonApi } from "~/lib/commonApi";
import { useAuthStore } from "~/stores/authStore";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const { refresh } = useAuth();

  initCommonApi({
    refresh,
    getContext: () => ({
      userId: authStore.user?.id,
      tenantId: authStore.user?.tenantId,
    }),
  });
});
