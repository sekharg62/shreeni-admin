import apiClient from './apiClient'
import { createCrudService } from './crud'
import { ENDPOINTS } from '../constants/endpoints'
import type { CatalogStatus } from '../constants/enums'
import type { Banner } from '../types/models'
import type {
  BannerQuery,
  CreateBannerPayload,
  ReplaceBannerPayload,
  UpdateBannerPayload,
} from '../types/payloads'

/**
 * Homepage carousel slides.
 * Flow: s3UploadService.uploadBannerImage(file) → create({ imageUrl: url, … }).
 * Changing imageUrl or deleting a banner removes the old file from S3.
 */
export const bannerService = {
  ...createCrudService<{
    item: Banner
    detail: Banner
    record: Banner
    create: CreateBannerPayload
    replace: ReplaceBannerPayload
    update: UpdateBannerPayload
    query: BannerQuery
  }>(ENDPOINTS.banners),

  async setStatus(id: string, status: CatalogStatus): Promise<Banner> {
    const { data } = await apiClient.patch<Banner>(ENDPOINTS.banners.status(id), { status })
    return data
  },

  /** ids in carousel order (first = shown first). Returns all banners, ordered. */
  async reorder(ids: string[]): Promise<Banner[]> {
    const { data } = await apiClient.patch<Banner[]>(ENDPOINTS.banners.reorder, { ids })
    return data
  },
}
