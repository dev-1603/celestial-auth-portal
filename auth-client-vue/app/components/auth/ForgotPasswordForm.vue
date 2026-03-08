<!-- components/auth/ForgotPasswordForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../../../schema/zod/authSchemas";

const { submit, loading, error } = useForgotPassword();

const schema = toTypedSchema(forgotPasswordSchema);

const { handleSubmit } = useForm<ForgotPasswordInput>({
  validationSchema: schema,
});

const { value: email, errorMessage: emailError } = useField("email");

const onSubmit = handleSubmit(async (values) => {
  await submit(values.email);
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <h1 class="text-xl font-semibold mb-4">Forgot password</h1>
    <p class="text-sm text-slate-500 mb-4">
      Enter your email and we'll send you a link to reset your password.
    </p>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
    </div>
    <button
      type="submit"
      :disabled="loading"
      class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <span v-if="loading">Sending...</span>
      <span v-else>Send reset link</span>
    </button>
    <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
    <NuxtLink to="/auth/login" class="text-sm text-blue-600 hover:underline block mt-2">
      Back to login
    </NuxtLink>
  </form>
</template>
