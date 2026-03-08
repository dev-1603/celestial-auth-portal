<!-- components/auth/RequestAccessForm.vue – invite_only signup. -->
<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Request access</h2>
    <p class="text-sm text-slate-600">Submit your details and we’ll get back to you.</p>
    <form @submit.prevent="onSubmit" class="space-y-4">
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
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Message (optional)</label>
        <textarea
          v-model="message"
          rows="3"
          class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? "Submitting..." : "Request access" }}
      </button>
    </form>
    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    <p v-if="success" class="text-sm text-green-600">Request received. We’ll be in touch.</p>
    <NuxtLink to="/auth/login" class="text-sm text-blue-600 hover:underline block mt-2">Back to login</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { fetchPostRequest } from "../../lib/commonApi";

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const email = ref("");
const name = ref("");
const message = ref("");
const emailError = ref("");

async function onSubmit() {
  emailError.value = "";
  error.value = null;
  if (!email.value.trim()) {
    emailError.value = "Email is required";
    return;
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.value)) {
    emailError.value = "Enter a valid email";
    return;
  }
  loading.value = true;
  try {
    await fetchPostRequest("/api/auth/request-access", {
      body: { email: email.value.trim(), name: name.value.trim() || undefined, message: message.value.trim() || undefined },
      auth: false,
    });
    success.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Request failed";
  } finally {
    loading.value = false;
  }
}
</script>
