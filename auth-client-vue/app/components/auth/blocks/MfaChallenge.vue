<script setup lang="ts">
/**
 * Atomic block: MFA challenge during login.
 * Uses useMfa and handles local loading/error states.
 */
import { ref } from 'vue';
import { useMfa } from '~/composables/useMfa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const { verifyMfa, loading, error } = useMfa();

const code = ref('');
const codeError = ref('');

async function onSubmit() {
  codeError.value = '';
  const re = /^[0-9]{6}$/;
  if (!re.test(code.value)) {
    codeError.value = 'Enter 6 digits';
    return;
  }
  try {
    await verifyMfa(code.value);
  } catch {
    // error set by composable
  }
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-[var(--foreground)]">Two-factor authentication</h2>
    <p class="text-sm text-muted-foreground">
      Enter the code from your authenticator app to sign in.
    </p>
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div class="space-y-2">
        <Label for="mfa-code">Code</Label>
        <Input
          id="mfa-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          :maxlength="6"
          placeholder="000000"
          class="w-full"
          :aria-invalid="!!codeError"
        />
        <p v-if="codeError" class="text-sm text-[var(--error)]">{{ codeError }}</p>
      </div>
      <Button
        type="submit"
        :disabled="loading"
        class="w-full"
      >
        {{ loading ? 'Verifying...' : 'Verify' }}
      </Button>
    </form>
    <p v-if="error" class="text-sm text-[var(--error)]">{{ error }}</p>
  </div>
</template>
