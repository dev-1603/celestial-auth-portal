<script setup lang="ts">
import { ArrowRight, Settings, ShieldCheck } from 'lucide-vue-next'
import type { Administration, User } from '~/types/workspace'

const props = defineProps<{
  user: User
  administration: Administration
}>()

function openLink(url: string) {
  if (!url) return
  window.open(url, '_blank')
}
</script>

<template>
  <section>
    <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
      Administration
    </p>

    <button
      v-if="props.administration.tenantConsole.visible"
      type="button"
      class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50"
      @click="openLink(props.administration.tenantConsole.redirectUrl)"
    >
      <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
        <Settings class="h-[18px] w-[18px]" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold text-slate-800">
          {{ props.administration.tenantConsole.label }}
        </span>
        <span class="block text-xs text-slate-500">
          {{ props.administration.tenantConsole.description }}
        </span>
      </span>
    </button>

    <button
      v-if="props.administration.platformAdmin.visible && props.user.isPlatformSuperadmin"
      type="button"
      class="group mt-2 w-full rounded-xl bg-slate-800 p-4 text-left transition hover:bg-slate-700"
      @click="openLink(props.administration.platformAdmin.redirectUrl)"
    >
      <span class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
          <ShieldCheck class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-white">
            {{ props.administration.platformAdmin.label }}
          </span>
          <span class="block text-xs text-slate-400">
            {{ props.administration.platformAdmin.description }}
          </span>
        </span>
        <ArrowRight class="h-4 w-4 text-slate-400 transition group-hover:text-white" />
      </span>
      <span class="mt-1.5 block text-center text-xs font-medium text-amber-500">
        ✨ Internal Access Only
      </span>
    </button>
  </section>
</template>
