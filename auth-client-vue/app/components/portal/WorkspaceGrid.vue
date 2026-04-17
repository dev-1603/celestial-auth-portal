<script setup lang="ts">
import { Lock } from 'lucide-vue-next'
import FilterTabs from '~/components/portal/FilterTabs.vue'
import SearchBar from '~/components/portal/SearchBar.vue'
import WorkspaceCard from '~/components/portal/WorkspaceCard.vue'
import { useWorkspaces } from '~/composables/useWorkspaces'

const {
  activeFilter,
  currentOrg,
  filteredWorkspaces,
  searchQuery,
  setFilter,
  setSearchQuery,
  togglePin,
} = useWorkspaces()

const restrictedVisibleWorkspaces = computed(() =>
  filteredWorkspaces.value.filter((workspace) => workspace.accessLevel === 'restricted'),
)

function requestAccess() {
  const target = restrictedVisibleWorkspaces.value[0]
  if (!target) return
  alert(`Access request submitted for ${target.name}`)
}
</script>

<template>
  <section>
    <h1 class="text-[28px] font-bold text-slate-800">
      Workspaces
    </h1>
    <p class="mt-1 text-sm text-slate-500">
      Managing assets for <span class="font-semibold text-slate-800">{{ currentOrg?.name || 'Celestial Labs' }}</span>
    </p>

    <div class="mt-6">
      <SearchBar
        :model-value="searchQuery"
        @update:model-value="setSearchQuery"
      />
    </div>

    <FilterTabs :active-tab="activeFilter" @change="setFilter" />

    <TransitionGroup
      name="ws-cards"
      tag="div"
      class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <WorkspaceCard
        v-for="workspace in filteredWorkspaces"
        :key="workspace.id"
        :workspace="workspace"
        @toggle-pin="togglePin"
      />
    </TransitionGroup>

    <button
      v-if="restrictedVisibleWorkspaces.length"
      type="button"
      class="mx-auto mt-10 flex items-center gap-2 text-[13px] font-bold tracking-wide text-slate-400 transition hover:text-slate-600"
      @click="requestAccess"
    >
      <Lock class="h-5 w-5" />
      REQUEST ACCESS
    </button>
  </section>
</template>

<style scoped>
.ws-cards-enter-active,
.ws-cards-leave-active {
  transition: all 0.3s ease;
}

.ws-cards-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.ws-cards-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.ws-cards-move {
  transition: transform 0.3s ease;
}
</style>
