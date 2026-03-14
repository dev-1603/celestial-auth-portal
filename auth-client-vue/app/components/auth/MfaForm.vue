<!-- components/auth/MfaForm.vue – TOTP code input, verify (login challenge or setup). -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">{{ isSetup ? 'Complete MFA setup' : 'Two-factor authentication' }}</h2>
    <p class="text-sm text-slate-600">
      {{ isSetup ? 'Enter the code from your authenticator app.' : 'Enter the code from your authenticator app to sign in.' }}
    </p>
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Code</label>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          :maxlength="6"
          placeholder="000000"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
        />
        <p v-if="codeError" class="text-red-500 text-sm mt-1">{{ codeError }}</p>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Verifying...' : (isSetup ? 'Complete setup' : 'Verify') }}
      </button>
    </form>
    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMfa } from "../../composables/useMfa";

const props = defineProps<{ isSetup?: boolean }>();
const isSetup = computed(() => props.isSetup ?? false);

const { verifyMfaSetup, verifyMfa, loading, error } = useMfa();

const code = ref("");
const codeError = ref("");

async function onSubmit() {
  codeError.value = "";
  const re = /^[0-9]{6}$/;
  if (!re.test(code.value)) {
    codeError.value = "Enter 6 digits";
    return;
  }
  try {
    if (isSetup.value) {
      await verifyMfaSetup(code.value);
    } else {
      await verifyMfa(code.value);
    }
  } catch {
    // error set by composable
  }
}
</script>
