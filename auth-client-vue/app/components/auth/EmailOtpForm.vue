<!-- components/auth/EmailOtpForm.vue -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Login with email code</h2>

    <!-- Step 1: email + send -->
    <form v-if="step === 'email'" @submit.prevent="onSend" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
        />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? "Sending..." : "Send code" }}
      </button>
    </form>

    <!-- Step 2: code input + verify -->
    <form v-else @submit.prevent="onVerify" class="space-y-4">
      <p class="text-sm text-slate-600">We sent a {{ digits }}-digit code to {{ email }}.</p>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Code</label>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          :maxlength="digits"
          :placeholder="'Enter ' + digits + ' digits'"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
        />
        <p v-if="codeError" class="text-red-500 text-sm mt-1">{{ codeError }}</p>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? "Verifying..." : "Verify" }}
      </button>
      <button
        type="button"
        class="text-sm text-blue-600 hover:underline"
        @click="step = 'email'; code = ''"
      >
        Use a different email
      </button>
    </form>

    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useOtp } from "../../composables/useOtp";

const { sendEmailOtp, verifyEmailOtp, digits, loading, error } = useOtp();

const step = ref<"email" | "code">("email");
const email = ref("");
const code = ref("");
const emailError = ref("");
const codeError = ref("");

async function onSend() {
  emailError.value = "";
  if (!email.value.trim()) {
    emailError.value = "Email is required";
    return;
  }
  try {
    await sendEmailOtp(email.value.trim());
    step.value = "code";
  } catch {
    // error set by composable
  }
}

async function onVerify() {
  codeError.value = "";
  const re = new RegExp(`^[0-9]{${digits.value}}$`);
  if (!re.test(code.value)) {
    codeError.value = `Enter ${digits.value} digits`;
    return;
  }
  try {
    await verifyEmailOtp({ email: email.value, code: code.value });
  } catch {
    // error set by composable
  }
}
</script>
