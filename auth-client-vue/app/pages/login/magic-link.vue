<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50">
    <div v-if="!token" class="w-full max-w-md">
      <MagicLinkForm />
    </div>
    <div v-else class="text-center">
      <p class="text-slate-600">Signing you in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import MagicLinkForm from "../../components/auth/MagicLinkForm.vue";

const route = useRoute();
const token = computed(() => route.query.token as string | undefined);

// If token in URL, redirect to BFF consume so it can set cookie and redirect to app
watch(
  token,
  (t) => {
    if (t && typeof window !== "undefined") {
      window.location.href = `/api/auth/magic-link/consume?token=${encodeURIComponent(t)}`;
    }
  },
  { immediate: true }
);
</script>
