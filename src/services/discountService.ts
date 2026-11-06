import apiClient from './apiClient'
import { createCrudService } from './crud'
import { ENDPOINTS } from '../constants/endpoints'
import type { Discount, DiscountWithCount } from '../types/models'
import type {
  CreateDiscountPayload,
  DiscountQuery,
  ReplaceDiscountPayload,
  UpdateDiscountPayload,
} from '../types/payloads'

/**
 * Coupon codes. The backend uppercases codes and checks the rules
 * (PERCENTAGE ≤ 100, no cap on FLAT, endsAt after startsAt) — also on update().
 */
export const discountService = {
  ...createCrudService<{
    item: DiscountWithCount
    detail: DiscountWithCount
    record: Discount
    create: CreateDiscountPayload
    replace: ReplaceDiscountPayload
    update: UpdateDiscountPayload
    query: DiscountQuery
  }>(ENDPOINTS.discounts),

  async setActive(id: string, isActive: boolean): Promise<Discount> {
    const { data } = await apiClient.patch<Discount>(ENDPOINTS.discounts.status(id), { isActive })
    return data
  },
}
