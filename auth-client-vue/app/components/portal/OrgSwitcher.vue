<script setup lang="ts">
import { Building2, Check } from 'lucide-vue-next'
import type { Organization } from '~/types/workspace'

defineProps<{
  organizations: Organization[]
}>()

const emit = defineEmits<{
  (e: 'switch-org', orgId: string): void
}>()
</script>

<template>
  <section>
    <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
      Your organizations
    </p>
    <div class="space-y-2">
      <button
        v-for="org in organizations"
        :key="org.id"
        type="button"
        class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition"
        :class="org.isCurrent
          ? 'border border-slate-200 bg-white shadow-sm'
          : 'hover:bg-white/60'"
        @click="emit('switch-org', org.id)"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-lg text-white"
          :style="{ backgroundColor: org.iconBgColor }"
        >
          <Building2 class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-slate-800">{{ org.name }}</span>
          <span class="block text-xs text-slate-500">{{ org.role }}</span>
        </span>
        <span
          v-if="org.isCurrent"
          class="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white"
        >
          <Check class="h-3 w-3" />
        </span>
      </button>
    </div>
  </section>
</template>
