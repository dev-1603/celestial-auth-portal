<!-- components/auth/OauthButtons.vue -->
<template>
  <div class="space-y-2">
    <Button
      v-for="provider in enabledProviders"
      :key="provider.id"
      type="button"
      :variant="providerVariant(provider.buttonVariant)"
      class="w-full flex items-center justify-center gap-2"
      @click="redirectToProvider(provider.id)"
    >
      <img
        v-if="provider.logo"
        :src="provider.logo"
        :alt="provider.displayName"
        class="w-5 h-5"
      />
      <span>Continue with {{ provider.displayName }}</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "../ui/button";
import { useOauth } from "../../composables/useOauth";

const { enabledProviders, redirectToProvider } = useOauth();

function providerVariant(v?: string): "default" | "outline" | "secondary" {
  if (v === "primary") return "default";
  if (v === "outline" || v === "secondary") return v;
  return "outline";
}
</script>
