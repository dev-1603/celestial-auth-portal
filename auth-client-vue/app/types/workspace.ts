export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  isPlatformSuperadmin: boolean
}

export interface Organization {
  id: string
  name: string
  logoUrl: string | null
  iconBgColor: string
  role: string
  isCurrent: boolean
}

export interface Workspace {
  id: string
  name: string
  description: string
  icon: string
  iconColor: string
  environment: 'production' | 'sandbox'
  userRole: string | null
  accessLevel: 'full' | 'restricted'
  isPinned: boolean
  lastAccessed: string | null
  redirectUrl: string | null
}

export interface AdminItem {
  label: string
  description: string
  icon: string
  iconColor: string
  redirectUrl: string
  visible: boolean
}

export interface PlatformAdminItem extends AdminItem {
  isSuperadminOnly: boolean
}

export interface Administration {
  tenantConsole: AdminItem
  platformAdmin: PlatformAdminItem
}

export interface MockData {
  user: User
  organizations: Organization[]
  workspaces: Workspace[]
  administration: Administration
}

export type FilterTab = 'all' | 'pinned' | 'recent'
