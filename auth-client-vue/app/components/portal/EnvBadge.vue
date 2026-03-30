<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'

defineProps<{
  environment: 'production' | 'sandbox'
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
    :class="environment === 'production' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'"
  >
    <ShieldCheck class="h-3 w-3" />
    {{ environment.toUpperCase() }}
  </span>
</template>
