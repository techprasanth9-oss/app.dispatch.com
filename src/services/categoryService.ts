import { api, getWorkspaceId } from './api'

export interface Category {
  _id: string
  workspaceId: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CategoryListResponse {
  success: boolean
  data: Category[]
}

export interface CategorySingleResponse {
  success: boolean
  data: Category
}

function wsPath(suffix: string): string {
  const wsId = getWorkspaceId()
  if (!wsId) throw new Error('No workspace selected')
  return `/workspaces/${wsId}${suffix}`
}

export function listCategories(): Promise<CategoryListResponse> {
  return api.get<CategoryListResponse>(wsPath('/categories'))
}

export function createCategory(name: string): Promise<CategorySingleResponse> {
  return api.post<CategorySingleResponse>(wsPath('/categories'), { name })
}

export function updateCategory(
  catId: string,
  name: string,
): Promise<CategorySingleResponse> {
  return api.patch<CategorySingleResponse>(wsPath(`/categories/${catId}`), { name })
}

export function deleteCategory(catId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(wsPath(`/categories/${catId}`))
}

export function reorderCategories(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<CategoryListResponse> {
  return api.patch<CategoryListResponse>(wsPath('/categories/reorder'), { items })
}
