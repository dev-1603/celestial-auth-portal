/**
 * Reset password composable – verify token and set new password, redirect from config on success.
 */

import { authConfig } from "../../config/authConfig";
import { verifyPasswordReset } from "../services/authClientService";
import type { ResetPasswordInput } from "../../schema/zod/authSchemas";

export function useResetPassword() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const router = useRouter();

  async function submit(payload: ResetPasswordInput) {
    loading.value = true;
    error.value = null;
    try {
      await verifyPasswordReset(payload);
      const redirectTo = authConfig.redirects?.afterPasswordReset ?? "/auth/login?reset=success";
      await router.push(redirectTo);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Reset failed";
    } finally {
      loading.value = false;
    }
  }

  return {
    submit,
    loading,
    error,
  };
}
