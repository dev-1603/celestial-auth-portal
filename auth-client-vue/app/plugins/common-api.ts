/**
 * Initializes the common API instance with auth getToken and refresh.
 * Must run in Nuxt context so useAuthState and useAuth are available.
 */

import { initCommonApi } from "../lib/commonApi";
import { useAuthState } from "../composables/useAuthState";
import { useAuth } from "../composables/useAuth";

export default defineNuxtPlugin(() => {
  const { accessToken, user } = useAuthState();
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
