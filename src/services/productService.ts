import apiClient from './apiClient'
import { createCrudService } from './crud'
import { ENDPOINTS } from '../constants/endpoints'
import type { CatalogStatus } from '../constants/enums'
import type { Product, ProductDetail, ProductListItem } from '../types/models'
import type {
  CreateProductPayload,
  ProductQuery,
  ReplaceProductPayload,
  UpdateProductPayload,
} from '../types/payloads'

/**
 * Products.
 * - create() can include images (by URL), variants, specifications, tagIds,
 *   collectionIds, colors and relatedProductIds — all saved in one transaction.
 * - replace()/update() change the product's own fields only; edit its children
 *   with productImageService, productVariantService, etc.
 * - Upload new images after the product exists: s3UploadService.uploadProductImages(id, files).
 */
export const productService = {
  ...createCrudService<{
    item: ProductListItem
    detail: ProductDetail
    record: ProductDetail
    create: CreateProductPayload
    replace: ReplaceProductPayload
    update: UpdateProductPayload
    query: ProductQuery
  }>(ENDPOINTS.products),

  /** Change the status of many products at once (max 100). */
  async setManyStatus(ids: string[], status: CatalogStatus): Promise<{ updated: number; status: CatalogStatus }> {
    const { data } = await apiClient.patch<{ updated: number; status: CatalogStatus }>(
      ENDPOINTS.products.bulkStatus,
      { ids, status },
    )
    return data
  },

  /** Note: remove() returns the deleted product row (without relations). */
  async setStatus(id: string, status: CatalogStatus): Promise<Product> {
    const { data } = await apiClient.patch<Product>(ENDPOINTS.products.status(id), { status })
    return data
  },
}
