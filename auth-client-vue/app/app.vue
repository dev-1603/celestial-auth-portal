<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <div class="celestial-app">
    <AuthThemeHandler />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <Toaster position="top-right" rich-colors />
    </ClientOnly>
  </div>
</template>
