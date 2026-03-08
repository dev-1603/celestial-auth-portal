<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">Auth Callback</h1>
    <p class="text-sm text-muted-foreground">
      Handling callback for provider: {{ provider }}
    </p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const provider = computed(() => route.params.provider as string);
</script>
