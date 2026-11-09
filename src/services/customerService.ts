import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { Paginated } from '../types/api'
import type { AdminCustomer, AdminCustomerDetail } from '../types/models'
import type { CustomerQuery } from '../types/payloads'

/**
 * Expanded-row details already fetched this session, so reopening a row doesn't call the API again.
 * Kept in memory only (not localStorage): it holds home addresses, and a page reload clears it,
 * which is how the admin gets fresh data.
 */
const detailCache = new Map<string, AdminCustomerDetail>()

/** Registered customers (read-only): order count, total spent, saved addresses. */
export const customerService = {
  async list(query?: CustomerQuery): Promise<Paginated<AdminCustomer>> {
    const { data } = await apiClient.get<Paginated<AdminCustomer>>(ENDPOINTS.customers.root, { params: query })
    return data
  },

  /** Served from the session cache after the first load. */
  async get(id: string): Promise<AdminCustomerDetail> {
    const hit = detailCache.get(id)
    if (hit) return hit
    const { data } = await apiClient.get<AdminCustomerDetail>(ENDPOINTS.customers.byId(id))
    detailCache.set(id, data)
    return data
  },

  /** Already-loaded details (shown instantly, no loading skeleton). */
  peek(id: string): AdminCustomerDetail | undefined {
    return detailCache.get(id)
  },
}
