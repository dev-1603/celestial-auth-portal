<script setup lang="ts">
import AdminSection from '~/components/portal/AdminSection.vue'
import OrgSwitcher from '~/components/portal/OrgSwitcher.vue'
import { useWorkspaces } from '~/composables/useWorkspaces'

const { administration, organizations, switchOrg, user } = useWorkspaces()
</script>

<template>
  <aside class="w-full flex-shrink-0 lg:w-[280px]">
    <div class="flex flex-col gap-6">
      <OrgSwitcher
        :organizations="organizations"
        @switch-org="switchOrg"
      />

      <AdminSection
        :user="user"
        :administration="administration"
      />
    </div>
  </aside>
</template>
