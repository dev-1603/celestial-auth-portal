<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--surface)]">
    <div class="w-full max-w-[400px] space-y-6">
      <h1 class="text-xl font-semibold text-[var(--foreground)] text-center">
        Sign in with API token
      </h1>
      <p class="text-sm text-muted-foreground text-center">
        Use your API token to authenticate. This page can be implemented to accept a bearer token for headless or CLI workflows.
      </p>
      <NuxtLink
        to="/auth/login"
        class="block text-center text-sm text-[var(--primary)] hover:underline"
      >
        ← Back to login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
</script>
