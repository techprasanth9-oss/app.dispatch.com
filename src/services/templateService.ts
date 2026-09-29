import { api, getWorkspaceId } from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateVariable {
  slug: string
  name: string
  type: string
  defaultValue: string
}

export interface Template {
  _id: string
  workspaceId?: string
  createdBy?: string
  name: string
  slug: string
  categoryId?: string | null
  description?: string
  subjectLine?: string
  editorData?: Record<string, unknown>
  compiledHtml?: string | null
  variables?: TemplateVariable[]
  status: 'draft' | 'published'
  version?: number
  exportCount?: number
  isPredefined?: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TemplateListResponse {
  success: boolean
  data: Template[]
  meta: PaginationMeta
}

export interface TemplateSingleResponse {
  success: boolean
  data: Template
}

export interface TemplateExportResponse {
  success: boolean
  data: { output: string; format: string; rendered?: string }
}

export interface TemplatePreviewResponse {
  success: boolean
  data: { html: string }
}

export interface ListFilters {
  category?: string
  status?: 'draft' | 'published'
  search?: string
  page?: number
  limit?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wsPath(suffix: string): string {
  const wsId = getWorkspaceId()
  if (!wsId) throw new Error('No workspace selected')
  return `/workspaces/${wsId}${suffix}`
}

function qs(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const str = params.toString()
  return str ? `?${str}` : ''
}

// ── Workspace templates ───────────────────────────────────────────────────────

export function listTemplates(filters: ListFilters = {}): Promise<TemplateListResponse> {
  return api.get<TemplateListResponse>(wsPath(`/templates${qs(filters as Record<string, unknown>)}`))
}

export function getTemplate(tplId: string): Promise<TemplateSingleResponse> {
  return api.get<TemplateSingleResponse>(wsPath(`/templates/${tplId}`))
}

export function createTemplate(data: {
  name: string
  categoryId?: string
  description?: string
  subjectLine?: string
  editorData: Record<string, unknown>
  status?: 'draft' | 'published'
}): Promise<TemplateSingleResponse> {
  return api.post<TemplateSingleResponse>(wsPath('/templates'), data)
}

export function updateTemplate(
  tplId: string,
  data: {
    name?: string
    categoryId?: string | null
    description?: string
    subjectLine?: string
    editorData?: Record<string, unknown>
    status?: 'draft' | 'published'
  },
): Promise<TemplateSingleResponse> {
  return api.patch<TemplateSingleResponse>(wsPath(`/templates/${tplId}`), data)
}

export function deleteTemplate(tplId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(wsPath(`/templates/${tplId}`))
}

export function exportTemplate(
  tplId: string,
  format: 'ejs' | 'mjml' | 'html',
  variables?: Record<string, string>,
): Promise<TemplateExportResponse> {
  const body: Record<string, unknown> = { format }
  if (variables && Object.keys(variables).length) body.variables = variables
  return api.post<TemplateExportResponse>(wsPath(`/templates/${tplId}/export`), body)
}

export function previewTemplate(
  tplId: string,
  variables: Record<string, string>,
): Promise<TemplatePreviewResponse> {
  return api.post<TemplatePreviewResponse>(wsPath(`/templates/${tplId}/preview`), { variables })
}

export function duplicateTemplate(tplId: string): Promise<TemplateSingleResponse> {
  return api.post<TemplateSingleResponse>(wsPath(`/templates/${tplId}/duplicate`))
}

export function copyFromGallery(predefinedTplId: string): Promise<TemplateSingleResponse> {
  return api.post<TemplateSingleResponse>(wsPath(`/templates/from-gallery/${predefinedTplId}`))
}

// ── Test send ─────────────────────────────────────────────────────────────────

export interface TestSendResponse {
  success: boolean
  data: { messageId: string; delivered: number }
}

/**
 * Sends compiled HTML from the builder to a small list of recipients.
 * No template save required — drafts can be tested before persisting.
 */
export function sendTestEmail(
  to: string[],
  subject: string,
  html: string,
): Promise<TestSendResponse> {
  return api.post<TestSendResponse>(wsPath('/templates/test-send'), { to, subject, html })
}

// ── Version history ──────────────────────────────────────────────────────────

export interface TemplateVersion {
  _id: string
  templateId: string
  version: number
  name: string
  changeNote?: string | null
  createdBy: string
  createdAt: string
}

export interface VersionListResponse {
  success: boolean
  data: TemplateVersion[]
  meta?: PaginationMeta
}

export function listVersions(
  tplId: string,
  page = 1,
  limit = 20,
): Promise<VersionListResponse> {
  return api.get<VersionListResponse>(
    wsPath(`/templates/${tplId}/versions?page=${page}&limit=${limit}`),
  )
}

export function restoreVersion(
  tplId: string,
  versionId: string,
): Promise<TemplateSingleResponse> {
  return api.post<TemplateSingleResponse>(
    wsPath(`/templates/${tplId}/versions/${versionId}/restore`),
  )
}

// ── Gallery (predefined) ──────────────────────────────────────────────────────

export interface GalleryResponse {
  success: boolean
  data: Template[]
}

export function listGallery(category?: string): Promise<GalleryResponse> {
  const q = category ? `?category=${encodeURIComponent(category)}` : ''
  return api.get<GalleryResponse>(`/templates/gallery${q}`)
}
