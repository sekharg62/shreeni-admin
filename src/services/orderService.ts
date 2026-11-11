import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { Paginated } from '../types/api'
import type { AdminOrder, AdminOrderListItem, OrderCounts } from '../types/models'
import type { OrderQuery, OrderStatusPayload } from '../types/payloads'

/** Order desk: find orders and move them through confirm → pack → ship → deliver (or cancel / return). */
export const orderService = {
  async list(query?: OrderQuery): Promise<Paginated<AdminOrderListItem>> {
    const { data } = await apiClient.get<Paginated<AdminOrderListItem>>(ENDPOINTS.orders.root, { params: query })
    return data
  },

  /** Orders per status (tabs, sidebar badge) + today's orders and revenue (dashboard). */
  async counts(): Promise<OrderCounts> {
    const { data } = await apiClient.get<OrderCounts>(ENDPOINTS.orders.counts)
    return data
  },

  async get(id: string): Promise<AdminOrder> {
    const { data } = await apiClient.get<AdminOrder>(ENDPOINTS.orders.byId(id))
    return data
  },

  /** The order's invoice PDF (numbered on first download if it was confirmed before invoices existed). */
  async invoice(id: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(ENDPOINTS.orders.invoice(id), { responseType: 'blob', timeout: 30000 })
    return data
  },

  /** Printable shipping labels for these orders (A6, four per A4 page), oldest first. Max 100. */
  async labels(ids: string[]): Promise<Blob> {
    const { data } = await apiClient.post<Blob>(ENDPOINTS.orders.labels, { ids }, { responseType: 'blob', timeout: 60000 })
    return data
  },

  /** Stock, coupon use, shipment and refunds are handled by the server. Returns the updated order. */
  async setStatus(id: string, payload: OrderStatusPayload): Promise<AdminOrder> {
    const { data } = await apiClient.patch<AdminOrder>(ENDPOINTS.orders.status(id), payload)
    return data
  },
}
