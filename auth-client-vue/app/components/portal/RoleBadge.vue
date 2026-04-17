<script setup lang="ts">
import { Gem } from 'lucide-vue-next'

defineProps<{
  role: string
}>()
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
    Role: {{ role }}
    <Gem class="h-3 w-3 text-indigo-400" />
  </span>
</template>
