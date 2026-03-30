<script setup lang="ts">
import type { Component } from 'vue'
import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  CreditCard,
  FlaskConical,
  Headset,
  Lock,
  Megaphone,
} from 'lucide-vue-next'
import EnvBadge from '~/components/portal/EnvBadge.vue'
import RoleBadge from '~/components/portal/RoleBadge.vue'
import StarToggle from '~/components/portal/StarToggle.vue'
import type { Workspace } from '~/types/workspace'

const props = defineProps<{
  workspace: Workspace
}>()

const emit = defineEmits<{
  (e: 'toggle-pin', workspaceId: string): void
}>()

const iconMap: Record<string, Component> = {
  'chart-bar': BarChart3,
  'credit-card': CreditCard,
  code: Code2,
  megaphone: Megaphone,
  headset: Headset,
  flask: FlaskConical,
  'lock-simple': Lock,
}

const workspaceIcon = computed<Component>(() => iconMap[props.workspace.icon] ?? BriefcaseBusiness)
const isRestricted = computed(() => props.workspace.accessLevel === 'restricted')

function openWorkspace() {
  if (isRestricted.value || !props.workspace.redirectUrl) return
  window.open(props.workspace.redirectUrl, '_blank')
}
</script>

<template>
  <article
    class="group rounded-[10px] border border-slate-200/60 bg-white p-5 transition-all duration-200"
    :class="[
      isRestricted
        ? 'cursor-default grayscale-[0.8] opacity-55'
        : 'cursor-pointer hover:border-slate-300/80 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]',
    ]"
    @click="openWorkspace"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg text-white"
        :style="{ backgroundColor: workspace.iconColor }"
      >
        <component :is="workspaceIcon" class="h-5 w-5" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px] font-semibold text-slate-800">
          {{ workspace.name }}
        </p>
        <p class="mt-0.5 truncate text-[13px] text-slate-500">
          {{ isRestricted ? 'Access restricted' : workspace.description }}
        </p>
      </div>

      <StarToggle
        v-if="!isRestricted"
        :pinned="workspace.isPinned"
        @toggle="emit('toggle-pin', workspace.id)"
      />
    </div>

    <div v-if="!isRestricted" class="mt-3 flex items-center gap-2">
      <EnvBadge :environment="workspace.environment" />
      <span class="text-slate-300">•</span>
      <RoleBadge :role="workspace.userRole || 'Viewer'" />
    </div>
  </article>
</template>
