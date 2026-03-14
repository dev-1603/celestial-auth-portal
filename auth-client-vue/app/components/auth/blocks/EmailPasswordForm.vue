<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="email" class="text-sm font-medium text-slate-700">
        Email
      </Label>
      <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="name@example.com"
        class="w-full h-10 rounded-lg border-slate-300 text-[15px]" :aria-invalid="!!emailError" />
      <p v-if="emailError" class="text-sm text-red-500">{{ emailError }}</p>
    </div>

    <div class="space-y-2">
      <Label for="password" class="text-sm font-medium text-slate-700">
        Password
      </Label>
      <div class="relative">
        <Input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password" class="w-full h-10 rounded-lg border-slate-300 text-[15px] pr-10"
          :aria-invalid="!!passwordError" />
        <button type="button" tabindex="-1"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
          <EyeOff v-if="showPassword" class="size-5" />
          <Eye v-else class="size-5" />
        </button>
      </div>
      <p v-if="passwordError" class="text-sm text-red-500">{{ passwordError }}</p>
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox v-model="rememberMe" class="rounded border-slate-300" />
        <span class="text-sm font-medium text-slate-700">Remember me</span>
      </label>
      <NuxtLink to="/forgot-password" class="text-sm font-medium text-primary hover:underline">
        Forgot password?
      </NuxtLink>
    </div>

    <Button type="submit" :disabled="loading"
      class="w-full h-11 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50">
      <span v-if="loading">Signing in...</span>
      <span v-else>Continue with email</span>
    </Button>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
/**
 * Atomic block: email/password login form.
 * Uses authService (useAuth) and handles local loading/error states.
 */
import { toTypedSchema } from '@vee-validate/zod';
import { useForm, useField } from 'vee-validate';
import {
  loginWithPasswordSchema,
  type LoginWithPasswordInput,
} from '../../../../schema/zod/authSchemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-vue-next';

const { loginWithPassword, loading, error } = useAuth();

const schema = toTypedSchema(loginWithPasswordSchema);

const { handleSubmit, setFieldValue } = useForm<LoginWithPasswordInput>({
  validationSchema: schema,
});

const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');
const { value: rememberMe } = useField<boolean>('rememberMe');

const showPassword = ref(false);

const onSubmit = handleSubmit(async (values) => {
  await loginWithPassword(values);
});
</script>
