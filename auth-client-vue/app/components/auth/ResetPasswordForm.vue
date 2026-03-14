<!-- components/auth/ResetPasswordForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { resetPasswordSchema, type ResetPasswordInput } from "../../../schema/zod/authSchemas";

const route = useRoute();
const { submit, loading, error } = useResetPassword();

const schema = toTypedSchema(resetPasswordSchema);

const tokenFromQuery = computed(() => (route.query.token as string) ?? "");

const { handleSubmit, setFieldValue } = useForm<ResetPasswordInput>({
  validationSchema: schema,
  initialValues: {
    token: "",
    password: "",
    confirmPassword: "",
  },
});

watch(tokenFromQuery, (t) => {
  setFieldValue("token", t);
}, { immediate: true });

const { value: token, errorMessage: tokenError } = useField("token");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField("confirmPassword");

const onSubmit = handleSubmit(async (values) => {
  await submit(values);
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <h1 class="text-xl font-semibold mb-4">Reset password</h1>
    <p class="text-sm text-slate-500 mb-4">
      Enter your new password below.
    </p>
    <input v-model="token" type="hidden" />
    <p v-if="tokenError" class="text-red-500 text-sm">{{ tokenError }}</p>
    <div v-if="!token" class="text-amber-600 text-sm">
      No reset token found. Use the link from your email.
    </div>
    <div v-else class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">New password</label>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p v-if="confirmPasswordError" class="text-red-500 text-sm mt-1">{{ confirmPasswordError }}</p>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <span v-if="loading">Resetting...</span>
        <span v-else>Reset password</span>
      </button>
    </div>
    <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
    <NuxtLink to="/auth/login" class="text-sm text-blue-600 hover:underline block mt-2">
      Back to login
    </NuxtLink>
  </form>
</template>
