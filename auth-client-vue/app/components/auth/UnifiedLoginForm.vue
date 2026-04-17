<script setup lang="ts">
/**
 * Dynamic single-CTA login portal.
 * Active method toggles field visibility; one primary button; OAuth grid.
 */
import { loginWithPasswordSchema, type LoginWithPasswordInput } from '../../../schema/zod/authSchemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import OauthButtons from './OauthButtons.vue';
import { authConfig } from '~/config/authConfig';

type AuthMethod = 'email_password' | 'email_otp' | 'phone_sms_otp' | 'magic_link';
type OtpStep = 'request' | 'verify';

const { isEmailPasswordEnabled } = useAuth();
const { isEmailOtpEnabled } = useOtp();
const { isPhoneOtpEnabled } = usePhoneOtp();
const { isMagicLinkEnabled } = useMagicLink();
const { enabledProviders: enabledOauthProviders } = useOauth();
const { enabledSsoProviders } = useSso();

const { resolveIconOnly } = useCelestialViewport();
const providerIconOnly = (authConfig as { ui?: { providerIconOnly?: string | boolean } }).ui?.providerIconOnly ?? false;
const showProviderGrid = resolveIconOnly(providerIconOnly);

const hasSocialProviders = computed(
  () => enabledOauthProviders.value.length > 0 || enabledSsoProviders.value.length > 0
);

// ─── State ─────────────────────────────────────────────────────────────
const defaultMethod = (authConfig.defaultMethod as AuthMethod) || 'email_password';
const enabledMethods = computed(() => {
  const m: AuthMethod[] = [];
  if (isEmailPasswordEnabled.value) m.push('email_password');
  if (isEmailOtpEnabled.value) m.push('email_otp');
  if (isPhoneOtpEnabled.value) m.push('phone_sms_otp');
  if (isMagicLinkEnabled.value) m.push('magic_link');
  return m;
});
const currentMethod = ref<AuthMethod>(
  enabledMethods.value.includes(defaultMethod) ? defaultMethod : (enabledMethods.value[0] ?? 'email_password')
);
const otpStep = ref<OtpStep>('request');

// Shared form values
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const phone = ref('');
const countryCode = ref('+1');
const code = ref('');
const emailError = ref('');
const passwordError = ref('');

// Composables
const { loginWithPassword, loading: authLoading, error: authError } = useAuth();
const { sendEmailOtp, verifyEmailOtp, loading: otpLoading, error: otpError, digits: otpDigits } = useOtp();
const { sendSmsOtp, verifySmsOtp, loading: phoneLoading, error: phoneError, digits: phoneDigits } = usePhoneOtp();
const { requestMagicLink, loading: magicLoading, error: magicError, success: magicSuccess } = useMagicLink();

const loading = computed(() =>
  authLoading.value || otpLoading.value || phoneLoading.value || magicLoading.value
);
const error = computed(() =>
  authError.value || otpError.value || phoneError.value || magicError.value || null
);

const ctaLabel = computed(() => {
  if (loading.value) return 'Logging in...';
  if (currentMethod.value === 'email_password') return 'Continue with email';
  if (currentMethod.value === 'magic_link') return magicSuccess.value ? 'Link sent!' : 'Send link';
  if (currentMethod.value === 'email_otp' || currentMethod.value === 'phone_sms_otp') {
    return otpStep.value === 'verify' ? 'Verify' : 'Send code';
  }
  return 'Continue';
});

// Reset step when switching methods
watch(currentMethod, () => {
  otpStep.value = 'request';
  code.value = '';
});

function setMethod(m: AuthMethod) {
  currentMethod.value = m;
}

function setRememberMe(v: boolean | 'indeterminate') {
  rememberMe.value = !!v;
}

// ─── Submit handlers ───────────────────────────────────────────────────
async function onPasswordSubmit() {
  emailError.value = '';
  passwordError.value = '';
  const result = loginWithPasswordSchema.safeParse({
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  });
  if (!result.success) {
    const err = result.error.flatten().fieldErrors;
    emailError.value = err.email?.[0] ?? '';
    passwordError.value = err.password?.[0] ?? '';
    return;
  }
  await loginWithPassword({ ...result.data, rememberMe: result.data.rememberMe ?? false } as LoginWithPasswordInput);
}

async function onOtpSend() {
  if (!email.value.trim()) return;
  try {
    await sendEmailOtp(email.value.trim());
    otpStep.value = 'verify';
  } catch { /* error set by composable */ }
}

async function onOtpVerify() {
  const re = new RegExp(`^[0-9]{${otpDigits.value}}$`);
  if (!re.test(code.value)) return;
  try {
    await verifyEmailOtp({ email: email.value, code: code.value });
  } catch { /* error set by composable */ }
}

async function onPhoneSend() {
  if (!phone.value.trim()) return;
  try {
    await sendSmsOtp({ phone: phone.value.trim(), countryCode: countryCode.value || '+1' });
    otpStep.value = 'verify';
  } catch { /* error set by composable */ }
}

async function onPhoneVerify() {
  const re = new RegExp(`^[0-9]{${phoneDigits.value}}$`);
  if (!re.test(code.value)) return;
  try {
    await verifySmsOtp({ phone: phone.value, code: code.value });
  } catch { /* error set by composable */ }
}

async function onMagicLinkSubmit() {
  if (!email.value.trim()) return;
  try {
    await requestMagicLink(email.value.trim());
  } catch { /* error set by composable */ }
}

function handlePrimaryAction(e?: Event) {
  e?.preventDefault();
  if (loading.value) return;
  if (currentMethod.value === 'email_password') onPasswordSubmit();
  else if (currentMethod.value === 'email_otp') {
    if (otpStep.value === 'request') onOtpSend();
    else onOtpVerify();
  } else if (currentMethod.value === 'phone_sms_otp') {
    if (otpStep.value === 'request') onPhoneSend();
    else onPhoneVerify();
  } else if (currentMethod.value === 'magic_link') onMagicLinkSubmit();
}
</script>

<template>
  <div class="w-full min-w-0">
    <form @submit.prevent="handlePrimaryAction" class="space-y-4">
      <!-- Fixed-height container to prevent layout shift -->
      <div class="min-h-[280px]">
        <Transition name="method-fade" mode="out-in">
          <!-- Email + Password -->
          <div v-if="currentMethod === 'email_password' && isEmailPasswordEnabled" key="email_password" class="space-y-4">
            <div class="space-y-2">
              <Label for="work-email" class="text-sm font-medium text-slate-700 dark:text-foreground">Work email</Label>
              <Input
                id="work-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                class="w-full h-10 rounded-lg"
                :aria-invalid="!!emailError"
              />
              <p v-if="emailError" class="text-sm text-red-500">{{ emailError }}</p>
            </div>
            <div class="space-y-2">
              <Label for="password" class="text-sm font-medium text-slate-700 dark:text-foreground">Password</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full h-10 rounded-lg"
                :aria-invalid="!!passwordError"
              />
              <p v-if="passwordError" class="text-sm text-red-500">{{ passwordError }}</p>
            </div>
            <div class="flex items-center justify-between gap-4">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  :checked="rememberMe"
                  @update:checked="setRememberMe"
                  class="rounded"
                />
                <span class="text-sm font-medium text-slate-700 dark:text-foreground">Remember me</span>
              </label>
              <NuxtLink to="/forgot-password" class="text-sm font-medium text-[var(--primary)] hover:underline">
                Forgot password?
              </NuxtLink>
            </div>
            <div v-if="isEmailOtpEnabled || isMagicLinkEnabled || isPhoneOtpEnabled" class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <button v-if="isEmailOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_otp')">
                Use OTP instead
              </button>
              <button v-if="isPhoneOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('phone_sms_otp')">
                Login with phone
              </button>
              <button v-if="isMagicLinkEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('magic_link')">
                Use magic link
              </button>
            </div>
          </div>

          <!-- Email OTP - request -->
          <div v-else-if="currentMethod === 'email_otp' && isEmailOtpEnabled && otpStep === 'request'" key="email_otp_req" class="space-y-4">
            <div class="space-y-2">
              <Label for="otp-email" class="text-sm font-medium text-slate-700 dark:text-foreground">Email</Label>
              <Input
                id="otp-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                class="w-full h-10 rounded-lg"
              />
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <button v-if="isEmailPasswordEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_password')">
                Login with password
              </button>
              <button v-if="isPhoneOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('phone_sms_otp')">
                Login with phone
              </button>
              <button v-if="isMagicLinkEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('magic_link')">
                Use magic link
              </button>
            </div>
          </div>

          <!-- Email OTP - verify -->
          <div v-else-if="currentMethod === 'email_otp' && isEmailOtpEnabled && otpStep === 'verify'" key="email_otp_verify" class="space-y-4">
            <p class="text-sm text-muted-foreground">We sent a {{ otpDigits }}-digit code to {{ email }}.</p>
            <div class="space-y-2">
              <Label for="otp-code" class="text-sm font-medium text-slate-700 dark:text-foreground">Code</Label>
              <Input
                id="otp-code"
                v-model="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                :maxlength="otpDigits"
                :placeholder="`Enter ${otpDigits} digits`"
                class="w-full h-10 rounded-lg"
              />
            </div>
            <button type="button" class="text-sm text-[var(--primary)] hover:underline" @click="otpStep = 'request'; code = ''">
              Use a different email
            </button>
          </div>

          <!-- Phone OTP - request -->
          <div v-else-if="currentMethod === 'phone_sms_otp' && isPhoneOtpEnabled && otpStep === 'request'" key="phone_otp_req" class="space-y-4">
            <div class="space-y-2">
              <Label for="phone" class="text-sm font-medium text-slate-700 dark:text-foreground">Phone</Label>
              <div class="flex gap-2">
                <Input
                  v-model="countryCode"
                  type="text"
                  placeholder="+1"
                  class="w-20 h-10 rounded-lg shrink-0"
                />
                <Input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  placeholder="5551234567"
                  class="flex-1 h-10 rounded-lg"
                />
              </div>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <button v-if="isEmailPasswordEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_password')">
                Login with email
              </button>
              <button v-if="isEmailOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_otp')">
                Use OTP instead
              </button>
              <button v-if="isMagicLinkEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('magic_link')">
                Use magic link
              </button>
            </div>
          </div>

          <!-- Phone OTP - verify -->
          <div v-else-if="currentMethod === 'phone_sms_otp' && isPhoneOtpEnabled && otpStep === 'verify'" key="phone_otp_verify" class="space-y-4">
            <p class="text-sm text-muted-foreground">We sent a {{ phoneDigits }}-digit code to {{ countryCode }}{{ phone }}.</p>
            <div class="space-y-2">
              <Label for="phone-code" class="text-sm font-medium text-slate-700 dark:text-foreground">Code</Label>
              <Input
                id="phone-code"
                v-model="code"
                type="text"
                inputmode="numeric"
                :maxlength="phoneDigits"
                :placeholder="`Enter ${phoneDigits} digits`"
                class="w-full h-10 rounded-lg"
              />
            </div>
            <button type="button" class="text-sm text-[var(--primary)] hover:underline" @click="otpStep = 'request'; code = ''">
              Use a different number
            </button>
          </div>

          <!-- Magic Link -->
          <div v-else-if="currentMethod === 'magic_link' && isMagicLinkEnabled" key="magic_link" class="space-y-4">
            <div v-if="!magicSuccess">
              <div class="space-y-2">
                <Label for="magic-email" class="text-sm font-medium text-slate-700 dark:text-foreground">Email</Label>
                <Input
                  id="magic-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  class="w-full h-10 rounded-lg"
                />
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                <button v-if="isEmailPasswordEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_password')">
                  Login with password
                </button>
                <button v-if="isEmailOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('email_otp')">
                  Use OTP instead
                </button>
                <button v-if="isPhoneOtpEnabled" type="button" class="text-[var(--primary)] hover:underline" @click="setMethod('phone_sms_otp')">
                  Login with phone
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-green-600 dark:text-green-500">
              Check your email. Click the link to sign in.
            </p>
          </div>
        </Transition>
      </div>

      <!-- Single CTA -->
      <Button
        v-if="!(currentMethod === 'magic_link' && magicSuccess)"
        type="submit"
        :disabled="loading"
        class="w-full h-11 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
      >
        {{ ctaLabel }}
      </Button>

      <p v-if="error" class="text-sm text-red-500 dark:text-destructive">{{ error }}</p>
    </form>

    <!-- OAuth / SSO grid -->
    <template v-if="hasSocialProviders">
      <div class="flex items-center gap-3 my-6">
        <div class="flex-1 border-t border-slate-200 dark:border-input" />
        <span class="text-xs text-slate-400 dark:text-muted-foreground">or continue with</span>
        <div class="flex-1 border-t border-slate-200 dark:border-input" />
      </div>
      <OauthButtons
        :layout-class="
          showProviderGrid
            ? 'grid grid-cols-4 gap-4'
            : 'flex flex-col space-y-3'
        "
        :provider-size="showProviderGrid ? 'lg' : 'default'"
      />
    </template>

    <!-- API token shortcut -->
    <p class="text-[11px] text-center text-muted-foreground mt-6">
      <NuxtLink to="/auth/api-token" class="text-muted-foreground hover:text-foreground hover:underline">
        Use API token instead
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.method-fade-enter-active,
.method-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.method-fade-enter-from,
.method-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
