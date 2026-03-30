/**
 * MFA composable – enableMfa, verifyMfaSetup, verifyMfa, disableMfa; redirect after enroll from config.
 */

import { authConfig } from "../config/authConfig";
import {
  enableMfa as serviceEnable,
  verifyMfaSetup as serviceVerifySetup,
  verifyMfa as serviceVerify,
  disableMfa as serviceDisable,
} from "../services/authClientService";

export function useMfa() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function enableMfa() {
    loading.value = true;
    error.value = null;
    try {
      return await serviceEnable();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Enable failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function verifyMfaSetup(code: string) {
    loading.value = true;
    error.value = null;
    try {
      await serviceVerifySetup(code);
      const redirectTo = authConfig.redirects?.afterMfaEnroll ?? "/app";
      await router.push(redirectTo);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Verify failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function verifyMfa(code: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await serviceVerify(code);
      if (result) {
        setAuth(result.user);
        const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
        await router.push(redirectTo);
        return true;
      }
      error.value = "Invalid code";
      return false;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Verify failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function disableMfa() {
    loading.value = true;
    error.value = null;
    try {
      await serviceDisable();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Disable failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    enableMfa,
    verifyMfaSetup,
    verifyMfa,
    disableMfa,
    loading,
    error,
  };
}
