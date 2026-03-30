<script setup lang="ts">
import type { FilterTab } from '~/types/workspace'

const props = defineProps<{
  activeTab: FilterTab
}>()

const emit = defineEmits<{
  (e: 'change', tab: FilterTab): void
}>()

const tabs: Array<{ key: FilterTab, label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'recent', label: 'Recently used' },
]
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="rounded-full border px-4 py-1.5 text-sm transition"
      :class="props.activeTab === tab.key
        ? 'border-indigo-500 bg-indigo-500 text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
      @click="emit('change', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
