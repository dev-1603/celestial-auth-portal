<!-- components/auth/MagicLinkForm.vue -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Login with magic link</h2>

    <form v-if="!success" @submit.prevent="onSubmit" class="space-y-4">
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
        {{ loading ? "Sending..." : "Send link" }}
      </button>
    </form>

    <p v-else class="text-sm text-green-600">
      Check your email. Click the link to sign in.
    </p>

    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMagicLink } from "../../composables/useMagicLink";

const { requestMagicLink, loading, error, success } = useMagicLink();

const email = ref("");
const emailError = ref("");

async function onSubmit() {
  emailError.value = "";
  if (!email.value.trim()) {
    emailError.value = "Email is required";
    return;
  }
  try {
    await requestMagicLink(email.value.trim());
  } catch {
    // error set by composable
  }
}
</script>
