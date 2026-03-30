<script setup lang="ts">
import { ChevronDown, Sparkles } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { useWorkspaces } from '~/composables/useWorkspaces'

const { currentOrg, user } = useWorkspaces()

const initials = computed(() => {
  const name = user.value.name || ''
  if (!name) return ''
  const words = name.trim().split(/\s+/)
  let result = ''
  if (words[0]) result += words[0][0]?.toUpperCase() || ''
  if (words[1]) result += words[1][0]?.toUpperCase() || ''
  return result
})
</script>

<template>
  <header class="sticky top-0 z-30 h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md">
    <div class="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
      <div class="flex items-center gap-2.5">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-l-to-br from-indigo-500 to-emerald-400 text-white">
          <Sparkles class="h-4 w-4" />
        </span>
        <p class="text-[18px] leading-none">
          <span class="font-semibold text-slate-800">Celestial</span>
          <span class="font-normal text-slate-500"> Portal</span>
        </p>
      </div>

      <div class="flex items-center gap-3 sm:gap-4">
        <div v-if="user.isPlatformSuperadmin"
          class="hidden items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-600 sm:flex">
          <span class="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <span>Superadmin Access</span>
        </div>

        <button type="button" class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100">
          <Avatar class="h-9 w-9">
            <AvatarImage v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.name" />
            <AvatarFallback class="bg-indigo-100 text-indigo-600">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <span class="hidden text-left md:block">
            <span class="block text-sm font-semibold text-slate-800">
              {{ user.name }}
            </span>
            <span class="block text-xs text-slate-500">
              {{ currentOrg?.role || 'Admin' }} • {{ currentOrg?.name || 'Celestial Labs' }}
            </span>
          </span>
          <ChevronDown class="hidden h-4 w-4 text-slate-400 md:block" />
        </button>
      </div>
    </div>
  </header>
</template>
