<!-- components/auth/SignupForm.vue – email/password signup when signupMode open and allowSignup. -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Create account</h2>
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input v-model="email" type="email" autocomplete="email"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input v-model="password" type="password" autocomplete="new-password"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" />
        <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
        <input v-model="confirmPassword" type="password" autocomplete="new-password"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" />
        <p v-if="confirmError" class="text-red-500 text-sm mt-1">{{ confirmError }}</p>
      </div>
      <button type="submit" :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
        {{ loading ? "Creating account..." : "Sign up" }}
      </button>
    </form>
    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    <NuxtLink to="/auth/login" class="text-sm text-blue-600 hover:underline block mt-2">Already have an account? Log in
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { authConfig } from "../../config/authConfig";
import { getAuthRules } from "../../../schema/zod/authConfigHelpers";
import { fetchPostRequest } from "../../lib/commonApi";

const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const emailError = ref("");
const passwordError = ref("");
const confirmError = ref("");

const minLen = computed(() => getAuthRules(authConfig).passwordMinLength);

async function onSubmit() {
  emailError.value = "";
  passwordError.value = "";
  confirmError.value = "";
  error.value = null;

  let valid = true;
  if (!email.value.trim()) {
    emailError.value = "Email is required";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = "Enter a valid email";
    valid = false;
  }
  if (password.value.length < minLen.value) {
    passwordError.value = `Password must be at least ${minLen.value} characters`;
    valid = false;
  }
  if (password.value !== confirmPassword.value) {
    confirmError.value = "Passwords do not match";
    valid = false;
  }
  if (!valid) return;

  loading.value = true;
  try {
    await fetchPostRequest("/api/auth/signup/email-password", {
      body: { email: email.value, password: password.value },
      auth: false,
    });
    const redirectTo = authConfig.redirects?.signupComplete ?? "/verify-email";
    await router.push(redirectTo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    error.value = msg.includes("501") || msg.includes("not yet") ? "Signup is not available yet." : msg;
  } finally {
    loading.value = false;
  }
}
</script>
