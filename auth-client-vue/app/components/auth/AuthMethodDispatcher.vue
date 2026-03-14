<template>
  <div class="space-y-6">
    <!-- Active method form -->
    <EmailPasswordForm v-if="currentMethod === 'email_password' && isEmailPasswordEnabled" />
    <EmailOtpForm v-else-if="currentMethod === 'email_otp' && isEmailOtpEnabled" />
    <PhoneOtpForm v-else-if="currentMethod === 'phone_sms_otp' && isPhoneOtpEnabled" />
    <MagicLinkForm v-else-if="currentMethod === 'magic_link' && isMagicLinkEnabled" />

    <!-- Inactive method buttons: 2-col grid, full-width for uniformity -->
    <div v-if="inactiveMethods.length > 0" class="grid grid-cols-2 gap-2">
      <Button v-for="m in inactiveMethods" :key="m.id" type="button" variant="outline" size="sm"
        class="w-full h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-input dark:text-muted-foreground justify-start"
        @click="setMethod(m.id)">
        <Icon v-if="m.icon" :name="m.icon" size="16" class="mr-1.5 shrink-0" />
        <span class="truncate">{{ m.label }}</span>
      </Button>
    </div>

    <!-- OAuth / SSO -->
    <template v-if="hasSocialProviders">
      <div class="flex items-center gap-3">
        <Separator class="flex-1" />
        <span class="text-xs text-slate-400 dark:text-muted-foreground">or continue with</span>
        <Separator class="flex-1" />
      </div>
      <OauthButtons :layout-class="showProviderGrid
        ? 'grid grid-cols-4 gap-4'
        : 'flex flex-col space-y-3'
        " :provider-size="showProviderGrid ? 'lg' : 'default'" mode="split" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Celestial Auth Method Dispatcher.
 * Shows active method's form; inactive methods as switch buttons.
 */
import { authConfig, getMethodIcon } from '~/config/authConfig';
import EmailPasswordForm from './EmailPasswordForm.vue';
import EmailOtpForm from './EmailOtpForm.vue';
import PhoneOtpForm from './PhoneOtpForm.vue';
import MagicLinkForm from './MagicLinkForm.vue';
import OauthButtons from './OauthButtons.vue';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type AuthMethod = 'email_password' | 'email_otp' | 'phone_sms_otp' | 'magic_link';

const { isEmailPasswordEnabled } = useAuth();
const { enabledProviders: enabledOauthProviders } = useOauth();
const { enabledSsoProviders } = useSso();
const { isEmailOtpEnabled } = useOtp();
const { isPhoneOtpEnabled } = usePhoneOtp();
const { isMagicLinkEnabled } = useMagicLink();

const { resolveIconOnly } = useCelestialViewport();
const providerIconOnly = (authConfig as { ui?: { providerIconOnly?: string | boolean } }).ui?.providerIconOnly ?? false;
const showProviderGrid = resolveIconOnly(providerIconOnly);

const hasSocialProviders = computed(
  () => enabledOauthProviders.value.length > 0 || enabledSsoProviders.value.length > 0
);

// Active method state
const defaultMethod = (authConfig.defaultMethod as AuthMethod) || 'email_password';
const enabledMethods = computed(() => {
  const m: { id: AuthMethod; label: string; icon?: string }[] = [];
  if (isEmailPasswordEnabled.value)
    m.push({
      id: 'email_password',
      label: 'Login with email & password',
      icon: getMethodIcon('email_password'),
    });
  if (isEmailOtpEnabled.value)
    m.push({
      id: 'email_otp',
      label: 'Use OTP instead',
      icon: getMethodIcon('email_otp'),
    });
  if (isPhoneOtpEnabled.value)
    m.push({
      id: 'phone_sms_otp',
      label: 'Login with phone',
      icon: getMethodIcon('phone_sms_otp'),
    });
  if (isMagicLinkEnabled.value)
    m.push({
      id: 'magic_link',
      label: 'Use magic link',
      icon: getMethodIcon('magic_link'),
    });
  return m;
});

const currentMethod = ref<AuthMethod>(
  enabledMethods.value.some((m) => m.id === defaultMethod) ? defaultMethod : (enabledMethods.value[0]?.id ?? 'email_password')
);

const inactiveMethods = computed(() =>
  enabledMethods.value.filter((m) => m.id !== currentMethod.value)
);

function setMethod(id: AuthMethod) {
  currentMethod.value = id;
}
</script>
