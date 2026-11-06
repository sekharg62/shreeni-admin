import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { Category, ProductImage, UploadedImage } from '../types/models'

/**
 * Image uploads go to AWS S3 through the backend. The backend decides the
 * folder from the route (banners/, categories/{id}/, products/{id}/),
 * converts every image to WebP and strips its metadata.
 * Limits: MAX_IMAGE_SIZE_MB / MAX_IMAGES_PER_UPLOAD in constants/app.
 */

type ProgressFn = (percent: number) => void

// Uploads use multipart, not the client's JSON default, and get a longer timeout.
function multipartConfig(onProgress?: ProgressFn) {
  return {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
    onUploadProgress: (e: { loaded: number; total?: number }) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  }
}

export const s3UploadService = {
  /**
   * Add images to a product's gallery (1–10 per call) → products/{productId}/.
   * The product must already exist. Returns the product's full, ordered gallery.
   */
  async uploadProductImages(
    productId: string,
    files: File[],
    onProgress?: ProgressFn,
  ): Promise<ProductImage[]> {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    const { data } = await apiClient.post<ProductImage[]>(
      ENDPOINTS.products.imagesUpload(productId),
      form,
      multipartConfig(onProgress),
    )
    return data
  },

  /**
   * Set a category's banner or poster → categories/{categoryId}/.
   * The old image is deleted automatically. Returns the updated category.
   */
  async uploadCategoryImage(
    categoryId: string,
    kind: 'banner' | 'poster',
    file: File,
    onProgress?: ProgressFn,
  ): Promise<Category> {
    const form = new FormData()
    form.append('file', file)
    const url =
      kind === 'banner' ? ENDPOINTS.categories.banner(categoryId) : ENDPOINTS.categories.poster(categoryId)
    const { data } = await apiClient.post<Category>(url, form, multipartConfig(onProgress))
    return data
  },

  /**
   * Upload a homepage banner image → banners/. Use the returned `url` as
   * `imageUrl` (or `mobileImageUrl`) in bannerService.create/update.
   */
  async uploadBannerImage(file: File, onProgress?: ProgressFn): Promise<UploadedImage> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<UploadedImage>(
      ENDPOINTS.uploads.banner,
      form,
      multipartConfig(onProgress),
    )
    return data
  },

  /**
   * Discard an uploaded image that was never saved on a record
   * (e.g. the admin uploaded a banner image, then clicked Cancel).
   * The backend refuses (409) if any product/category/banner/review still uses it —
   * delete those through their own record instead.
   */
  async discardUpload(url: string): Promise<{ deleted: true; key: string }> {
    const { data } = await apiClient.delete<{ deleted: true; key: string }>(ENDPOINTS.uploads.root, {
      data: { url },
    })
    return data
  },
}
