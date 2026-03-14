<!-- components/auth/PhoneOtpForm.vue -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Login with phone code</h2>

    <form v-if="step === 'phone'" @submit.prevent="onSend" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <div class="flex gap-2">
          <input
            v-model="countryCode"
            type="text"
            placeholder="+1"
            class="w-20 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model="phone"
            type="tel"
            placeholder="5551234567"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? "Sending..." : "Send code" }}
      </button>
    </form>

    <form v-else @submit.prevent="onVerify" class="space-y-4">
      <p class="text-sm text-slate-600">We sent a {{ digits }}-digit code to {{ countryCode }}{{ phone }}.</p>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Code</label>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
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
      <button type="button" class="text-sm text-blue-600 hover:underline" @click="step = 'phone'; code = ''">
        Use a different number
      </button>
    </form>

    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { usePhoneOtp } from "../../composables/usePhoneOtp";

const { sendSmsOtp, verifySmsOtp, digits, loading, error } = usePhoneOtp();

const step = ref<"phone" | "code">("phone");
const phone = ref("");
const countryCode = ref("+1");
const code = ref("");
const phoneError = ref("");
const codeError = ref("");

async function onSend() {
  phoneError.value = "";
  if (!phone.value.trim()) {
    phoneError.value = "Phone is required";
    return;
  }
  try {
    await sendSmsOtp({ phone: phone.value.trim(), countryCode: countryCode.value || "+1" });
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
    await verifySmsOtp({ phone: phone.value, code: code.value });
  } catch {
    // error set by composable
  }
}
</script>
