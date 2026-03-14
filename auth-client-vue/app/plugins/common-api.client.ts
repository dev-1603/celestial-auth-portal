/**
 * Initializes the common API instance with auth getToken and refresh.
 * Client-only (.client.ts) so it runs only in the browser – avoids SSR and keeps hydration in sync.
 */

import { initCommonApi } from "~/lib/commonApi";
import { useAuthStore } from "~/stores/authStore";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtPlugin(() => {
  const { accessToken, user } = useAuthStore();
  const { refresh } = useAuth();

  initCommonApi({
    getToken: () => accessToken.value,
    refresh,
    getContext: () => ({
      userId: user.value?.id,
      tenantId: user.value?.tenantId,
    }),
  });
});
