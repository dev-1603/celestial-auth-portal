/**
 * Forgot password composable – request reset email, redirect from config on success.
 */

import { authConfig } from "../../config/authConfig";
import { requestPasswordReset } from "../services/authClientService";

export function useForgotPassword() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);
  const router = useRouter();

  async function submit(email: string) {
    loading.value = true;
    error.value = null;
    success.value = false;
    try {
      await requestPasswordReset(email);
      success.value = true;
      const redirectTo = authConfig.redirects?.afterPasswordReset ?? "/auth/login";
      await router.push(redirectTo);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Request failed";
    } finally {
      loading.value = false;
    }
  }

  return {
    submit,
    loading,
    error,
    success,
  };
}
