<script setup lang="ts">
import { Search, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div
    class="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
  >
    <Search class="h-5 w-5 text-slate-400" />
    <input
      :value="props.modelValue"
      type="text"
      class="h-full flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      placeholder="Search apps and workspaces..."
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white"
      aria-label="Decorative search action"
      tabindex="-1"
    >
      <Sparkles class="h-[18px] w-[18px]" />
    </button>
  </div>
</template>
