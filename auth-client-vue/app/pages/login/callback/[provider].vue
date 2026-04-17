<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">Auth Callback</h1>
    <p class="text-sm text-muted-foreground">
      Handling callback for provider: {{ provider }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const provider = computed(() => route.params.provider as string)
const { getMe } = useAuth()

// We wrap getMe inside useAsyncData
const { data, status, error, refresh, clear } = await useAsyncData(
  () => `auth-me:${route.path}`,

  // 2. The fetcher function calling your service
  () => getMe(),

  {
    // Nuxt 4 Tip: Since getMe returns null on error, 
    // we can use 'pick' or 'transform' if we wanted to 
    // modify the MeUser object before it hits the component.
    deep: false, // Performance boost: treat MeUser as immutable
  }
)
</script>
