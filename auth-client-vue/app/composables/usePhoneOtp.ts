/**
 * Phone OTP composable – sendSmsOtp, verifySmsOtp.
 */

import { authConfig } from "../config/authConfig";
import { sendSmsOtp as serviceSend, verifySmsOtp as serviceVerify } from "../services/authClientService";

export function usePhoneOtp() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const isPhoneOtpEnabled = computed(
    () => authConfig.methodsConfig?.phone_sms_otp?.enabled === true,
  );

  const digits = computed(() => authConfig.methodsConfig?.phone_sms_otp?.digits ?? 6);

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function sendSmsOtp(payload: { phone: string; countryCode?: string }) {
    if (!isPhoneOtpEnabled.value) return;
    loading.value = true;
    error.value = null;
    try {
      await serviceSend(payload);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Send failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function verifySmsOtp(payload: { phone: string; code: string }) {
    if (!isPhoneOtpEnabled.value) return;
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
    sendSmsOtp,
    verifySmsOtp,
    isPhoneOtpEnabled,
    digits,
    loading,
    error,
  };
}

