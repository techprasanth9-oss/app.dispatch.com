import { api } from './api'

export interface Workspace {
  _id: string
  name: string
  slug: string
  logo?: string | null
  website?: string | null
  description?: string | null
  industry?: string | null
  companySize?: string | null
  useCases?: string[]
  timezone?: string | null
  brandColor?: string | null
  brandFont?: string | null
  plan: string
  maxTemplates?: number
  maxMembers?: number
  maxExportsMo?: number
  exportsUsed?: number
  status: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  _id: string
  userId: string
  workspaceId: string
  role: 'owner' | 'admin' | 'manager'
  status: 'active' | 'invited'
  joinedAt: string | null
  createdAt: string
  user?: { _id: string; name: string; email: string; avatar?: string | null }
}

export interface WorkspaceListResponse {
  success: boolean
  data: Workspace[]
}

interface RawWorkspaceItem {
  workspace: Omit<Workspace, 'role'>
  role: string
}

export async function listMyWorkspaces(): Promise<WorkspaceListResponse> {
  const res = await api.get<{ success: boolean; data: RawWorkspaceItem[] }>('/workspaces')
  return {
    success: res.success,
    data: res.data.map((item) => ({ ...item.workspace, role: item.role })),
  }
}

export function createWorkspace(name: string) {
  return api.post<{ success: boolean; data: Workspace }>('/workspaces', { name })
}

export function getWorkspace(wsId: string) {
  return api.get<{ success: boolean; data: Workspace }>(`/workspaces/${wsId}`)
}

export function updateWorkspace(
  wsId: string,
  data: {
    name?: string
    logo?: string | null
    website?: string | null
    description?: string | null
    industry?: string | null
    companySize?: string | null
    useCases?: string[]
    timezone?: string | null
    brandColor?: string | null
    brandFont?: string | null
  },
) {
  return api.patch<{ success: boolean; data: Workspace }>(`/workspaces/${wsId}`, data)
}

export function deleteWorkspace(wsId: string) {
  return api.delete<{ success: boolean }>(`/workspaces/${wsId}`)
}

// ── Members ──────────────────────────────────────────────────────────────────

export function listMembers(wsId: string) {
  return api.get<{ success: boolean; data: WorkspaceMember[] }>(`/workspaces/${wsId}/members`)
}

export function inviteMember(wsId: string, email: string, role: 'admin' | 'manager') {
  return api.post<{ success: boolean; data: WorkspaceMember }>(
    `/workspaces/${wsId}/members`,
    { email, role },
  )
}

export function removeMember(wsId: string, userId: string) {
  return api.delete<{ success: boolean }>(`/workspaces/${wsId}/members/${userId}`)
}

export function changeMemberRole(wsId: string, userId: string, role: 'admin' | 'manager') {
  return api.patch<{ success: boolean; data: WorkspaceMember }>(
    `/workspaces/${wsId}/members/${userId}/role`,
    { role },
  )
}

export function transferOwnership(wsId: string, newOwnerId: string) {
  return api.post<{ success: boolean }>(`/workspaces/${wsId}/transfer`, { newOwnerId })
}

export function acceptInvite(token: string) {
  return api.post<{ success: boolean; data: WorkspaceMember }>(`/invites/${token}/accept`)
}
