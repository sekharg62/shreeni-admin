import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { HomePick } from '../types/models'

export type CreateHomePickPayload = {
  productId: string
  badge?: string | null
  isActive?: boolean
  /** ISO date-time; null = from now */
  startsAt?: string | null
  /** ISO date-time; null = no end */
  endsAt?: string | null
}

/** Fields left out stay as they are; null clears. */
export type UpdateHomePickPayload = Omit<Partial<CreateHomePickPayload>, 'productId'>

/**
 * Homepage "Handpicked for You" list (max 24). Each row says whether it is live on the
 * homepage right now and, if not, why (`hiddenReason`).
 */
export const homePickService = {
  /** Every pick in homepage order. */
  async list(): Promise<HomePick[]> {
    const { data } = await apiClient.get<HomePick[]>(ENDPOINTS.homePicks.root)
    return data
  },

  /** Adds the product at the end of the list. 409 if it's already there. */
  async create(payload: CreateHomePickPayload): Promise<HomePick> {
    const { data } = await apiClient.post<HomePick>(ENDPOINTS.homePicks.root, payload)
    return data
  },

  async update(id: string, payload: UpdateHomePickPayload): Promise<HomePick> {
    const { data } = await apiClient.patch<HomePick>(ENDPOINTS.homePicks.byId(id), payload)
    return data
  },

  /** ids in homepage order (first = shown first). Returns the whole list, ordered. */
  async reorder(ids: string[]): Promise<HomePick[]> {
    const { data } = await apiClient.patch<HomePick[]>(ENDPOINTS.homePicks.reorder, { ids })
    return data
  },

  /** Takes the product off the list; the product itself is untouched. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.homePicks.byId(id))
  },
}
