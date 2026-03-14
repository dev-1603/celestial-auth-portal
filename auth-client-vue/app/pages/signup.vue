<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50">
    <div v-if="signupMode !== 'closed'" class="w-full max-w-md">
      <RequestAccessForm v-if="signupMode === 'invite_only'" />
      <template v-else-if="signupMode === 'open'">
        <SignupForm />
        <div v-if="enabledOauthProviders.length" class="mt-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="flex-1 border-t border-slate-200" />
            <span class="text-xs text-slate-400 uppercase">or</span>
            <div class="flex-1 border-t border-slate-200" />
          </div>
          <OauthButtons />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import RequestAccessForm from "../components/auth/RequestAccessForm.vue";
import SignupForm from "../components/auth/SignupForm.vue";
import OauthButtons from "../components/auth/OauthButtons.vue";
import { authConfig } from "../config/authConfig";
import { useOauth } from "../composables/useOauth";

const router = useRouter();
const signupMode = computed(() => authConfig.signupMode ?? "open");

const { enabledProviders: enabledOauthProviders } = useOauth();

watch(
  signupMode,
  (mode) => {
    if (mode === "closed") router.replace("/auth/login");
  },
  { immediate: true }
);
</script>
