import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { ProductImage } from '../types/models'
import type {
  CreateProductImagePayload,
  ReplaceProductImagePayload,
  UpdateProductImagePayload,
} from '../types/payloads'

const P = ENDPOINTS.products

/**
 * A product's image gallery. Every call returns the full gallery, ordered.
 * The backend keeps exactly one primary image and deletes removed files from S3.
 * Upload new files with s3UploadService.uploadProductImages(productId, files).
 */
export const productImageService = {
  async list(productId: string): Promise<ProductImage[]> {
    const { data } = await apiClient.get<ProductImage[]>(P.images(productId))
    return data
  },

  /** Add an already-hosted image by URL (uploads normally use s3UploadService). */
  async add(productId: string, payload: CreateProductImagePayload): Promise<ProductImage[]> {
    const { data } = await apiClient.post<ProductImage[]>(P.images(productId), payload)
    return data
  },

  async replace(productId: string, id: string, payload: ReplaceProductImagePayload): Promise<ProductImage[]> {
    const { data } = await apiClient.put<ProductImage[]>(P.imageById(productId, id), payload)
    return data
  },

  async update(productId: string, id: string, payload: UpdateProductImagePayload): Promise<ProductImage[]> {
    const { data } = await apiClient.patch<ProductImage[]>(P.imageById(productId, id), payload)
    return data
  },

  async setPrimary(productId: string, id: string): Promise<ProductImage[]> {
    const { data } = await apiClient.patch<ProductImage[]>(P.imagePrimary(productId, id))
    return data
  },

  /** Drag-to-reorder: pass EVERY image id of the product in the new order. */
  async reorder(productId: string, ids: string[]): Promise<ProductImage[]> {
    const { data } = await apiClient.patch<ProductImage[]>(P.imagesReorder(productId), { ids })
    return data
  },

  /** Deletes the row and its file in S3; promotes the next image if it was primary. */
  async remove(productId: string, id: string): Promise<ProductImage[]> {
    const { data } = await apiClient.delete<ProductImage[]>(P.imageById(productId, id))
    return data
  },
}
