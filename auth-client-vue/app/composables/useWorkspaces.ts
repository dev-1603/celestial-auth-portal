import { useDebounceFn } from '@vueuse/core'
import type {
  Administration,
  FilterTab,
  MockData,
  Organization,
  User,
  Workspace,
} from '~/types/workspace'
import rawMockData from '~/data/mock-workspaces.json'

const mockData = rawMockData as MockData

const user = ref<User>({ ...mockData.user })
const organizations = ref<Organization[]>(mockData.organizations.map((org) => ({ ...org })))
const workspaces = ref<Workspace[]>(mockData.workspaces.map((workspace) => ({ ...workspace })))
const administration = ref<Administration>({
  tenantConsole: { ...mockData.administration.tenantConsole },
  platformAdmin: { ...mockData.administration.platformAdmin },
})

const activeFilter = ref<FilterTab>('all')
const searchQuery = ref('')
const debouncedSearchQuery = ref('')

const setDebouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchQuery.value = query
}, 200)

const currentOrg = computed(() => organizations.value.find((org) => org.isCurrent) ?? null)

const filteredWorkspaces = computed<Workspace[]>(() => {
  const search = debouncedSearchQuery.value.trim().toLowerCase()

  let list = workspaces.value.filter((workspace) => {
    if (!search) return true

    return (
      workspace.name.toLowerCase().includes(search) ||
      workspace.description.toLowerCase().includes(search)
    )
  })

  if (activeFilter.value === 'pinned') {
    list = list.filter((workspace) => workspace.isPinned)
  }

  if (activeFilter.value === 'recent') {
    list = list
      .filter((workspace) => workspace.lastAccessed !== null)
      .sort((a, b) => {
        const aTime = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0
        const bTime = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0
        return bTime - aTime
      })
  }

  return list
})

function togglePin(workspaceId: string) {
  const idx = workspaces.value.findIndex((workspace) => workspace.id === workspaceId)
  if (idx < 0) return

  const target = workspaces.value[idx]
  if (!target) return
  workspaces.value[idx] = { ...target, isPinned: !target.isPinned }
}

function setFilter(tab: FilterTab) {
  activeFilter.value = tab
}

function setSearchQuery(query: string) {
  searchQuery.value = query
  setDebouncedSearch(query)
}

function switchOrg(orgId: string) {
  organizations.value = organizations.value.map((org) => ({
    ...org,
    isCurrent: org.id === orgId,
  }))
}

export function useWorkspaces() {
  return {
    user,
    organizations,
    workspaces,
    administration,
    currentOrg,
    activeFilter,
    searchQuery,
    filteredWorkspaces,
    togglePin,
    setFilter,
    setSearchQuery,
    switchOrg,
  }
}
