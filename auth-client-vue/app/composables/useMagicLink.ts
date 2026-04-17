/**
 * Magic link composable – requestMagicLink(email); guard by methodsConfig.magic_link.enabled.
 */

import { authConfig } from "../config/authConfig";
import { requestMagicLink as serviceRequest } from "../services/authClientService";

export function useMagicLink() {
  const isMagicLinkEnabled = computed(
    () => authConfig.methodsConfig?.magic_link?.enabled === true
  );

  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  async function requestMagicLink(email: string) {
    if (!isMagicLinkEnabled.value) return;
    loading.value = true;
    error.value = null;
    success.value = false;
    try {
      await serviceRequest(email);
      success.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Request failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    requestMagicLink,
    isMagicLinkEnabled,
    loading,
    error,
    success,
  };
}
