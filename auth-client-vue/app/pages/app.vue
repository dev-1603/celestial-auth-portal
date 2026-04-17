<script setup lang="ts">
import Sidebar from '~/components/portal/Sidebar.vue'
import TopNavBar from '~/components/portal/TopNavBar.vue'
import WorkspaceGrid from '~/components/portal/WorkspaceGrid.vue'

definePageMeta({ layout: false })
</script>

<template>
  <div
    class="min-h-screen text-slate-900"
    style="background: radial-gradient(circle at center, #F8FAFF 0%, #F3F6FC 72%);"
  >
    <TopNavBar />

    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 sm:p-6 lg:flex-row">
      <main
        class="flex-1 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] sm:p-8"
      >
        <WorkspaceGrid />
      </main>

      <Sidebar />
    </div>
  </div>
</template>
