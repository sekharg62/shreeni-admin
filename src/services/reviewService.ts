import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import { ReviewStatus } from '../constants/enums'
import type { Paginated } from '../types/api'
import type { Review, ReviewCounts } from '../types/models'
import type { ReviewQuery } from '../types/payloads'

/** Moderation of customer reviews. Admins approve/reject/delete — they can't write reviews. */
export const reviewService = {
  async list(query?: ReviewQuery): Promise<Paginated<Review>> {
    const { data } = await apiClient.get<Paginated<Review>>(ENDPOINTS.reviews.root, { params: query })
    return data
  },

  async get(id: string): Promise<Review> {
    const { data } = await apiClient.get<Review>(ENDPOINTS.reviews.byId(id))
    return data
  },

  /** Number of reviews per status, for the moderation tabs. */
  async counts(): Promise<ReviewCounts> {
    const { data } = await apiClient.get<ReviewCounts>(ENDPOINTS.reviews.counts)
    return data
  },

  /** Approve / reject many reviews at once (max 100). */
  async setManyStatus(ids: string[], status: ReviewStatus): Promise<{ updated: number; status: ReviewStatus }> {
    const { data } = await apiClient.patch<{ updated: number; status: ReviewStatus }>(
      ENDPOINTS.reviews.bulkStatus,
      { ids, status },
    )
    return data
  },

  async setStatus(id: string, status: ReviewStatus): Promise<Review> {
    const { data } = await apiClient.patch<Review>(ENDPOINTS.reviews.status(id), { status })
    return data
  },

  approve(id: string) {
    return this.setStatus(id, ReviewStatus.APPROVED)
  },

  reject(id: string) {
    return this.setStatus(id, ReviewStatus.REJECTED)
  },

  async remove(id: string): Promise<Review> {
    const { data } = await apiClient.delete<Review>(ENDPOINTS.reviews.byId(id))
    return data
  },
}
