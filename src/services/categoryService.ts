import apiClient from './apiClient'
import { createCrudService } from './crud'
import { ENDPOINTS } from '../constants/endpoints'
import type { CatalogStatus } from '../constants/enums'
import type { Category, CategoryDetail, CategoryListItem, CategoryTreeNode } from '../types/models'
import type {
  CategoryQuery,
  CreateCategoryPayload,
  ReplaceCategoryPayload,
  UpdateCategoryPayload,
} from '../types/payloads'

/**
 * Categories (parent/child tree). Banner & poster uploads:
 * s3UploadService.uploadCategoryImage(id, 'banner' | 'poster', file).
 */
export const categoryService = {
  ...createCrudService<{
    item: CategoryListItem
    detail: CategoryDetail
    record: Category
    create: CreateCategoryPayload
    replace: ReplaceCategoryPayload
    update: UpdateCategoryPayload
    query: CategoryQuery
  }>(ENDPOINTS.categories),

  /** Full nested tree — for parent pickers. */
  async tree(): Promise<CategoryTreeNode[]> {
    const { data } = await apiClient.get<CategoryTreeNode[]>(ENDPOINTS.categories.tree)
    return data
  },

  /** Sibling ids (same parent) in display order. Returns the refreshed tree. */
  async reorder(ids: string[]): Promise<CategoryTreeNode[]> {
    const { data } = await apiClient.patch<CategoryTreeNode[]>(ENDPOINTS.categories.reorder, { ids })
    return data
  },

  async setStatus(id: string, status: CatalogStatus): Promise<Category> {
    const { data } = await apiClient.patch<Category>(ENDPOINTS.categories.status(id), { status })
    return data
  },
}
