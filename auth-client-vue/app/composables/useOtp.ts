/**
 * Email OTP composable – sendEmailOtp, verifyEmailOtp; only when methodsConfig.email_otp.enabled.
 */

import { authConfig } from "../config/authConfig";
import { sendEmailOtp as serviceSend, verifyEmailOtp as serviceVerify } from "../services/authClientService";

export function useOtp() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const isEmailOtpEnabled = computed(
    () => authConfig.methodsConfig?.email_otp?.enabled === true,
  );

  const digits = computed(() => authConfig.methodsConfig?.email_otp?.digits ?? 6);

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function sendEmailOtp(email: string) {
    if (!isEmailOtpEnabled.value) return;
    loading.value = true;
    error.value = null;
    try {
      await serviceSend(email);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Send failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function verifyEmailOtp(payload: { email: string; code: string }) {
    if (!isEmailOtpEnabled.value) return;
    loading.value = true;
    error.value = null;
    try {
      const result = await serviceVerify(payload);
      if (result) {
        setAuth(result.user);
        const redirectTo = authConfig.redirects?.afterLogin ?? "/app";
        await router.push(redirectTo);
      } else {
        error.value = "Invalid or expired code";
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Verify failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    sendEmailOtp,
    verifyEmailOtp,
    isEmailOtpEnabled,
    digits,
    loading,
    error,
  };
}
