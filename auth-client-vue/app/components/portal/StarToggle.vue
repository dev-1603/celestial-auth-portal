<script setup lang="ts">
import { Star } from 'lucide-vue-next'

defineProps<{
  pinned: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <button
    type="button"
    class="star-toggle flex h-6 w-6 items-center justify-center rounded transition duration-150 hover:scale-110"
    :class="pinned ? 'opacity-100 text-amber-500' : 'opacity-0 text-slate-300 group-hover:opacity-100'"
    aria-label="Toggle pinned workspace"
    @click.stop="emit('toggle')"
  >
    <Star class="h-[18px] w-[18px]" :fill="pinned ? 'currentColor' : 'none'" />
  </button>
</template>
