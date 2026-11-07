import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { Paginated } from '../types/api'
import type { SupportCounts, SupportTicket, SupportTicketListItem } from '../types/models'
import type { SupportTicketQuery } from '../types/payloads'

/** Customer support inbox: read, reply, resolve, close. */
export const supportService = {
  /** Open first, then in progress, resolved, closed; latest activity first within each. */
  async list(query?: SupportTicketQuery): Promise<Paginated<SupportTicketListItem>> {
    const { data } = await apiClient.get<Paginated<SupportTicketListItem>>(ENDPOINTS.support.root, { params: query })
    return data
  },

  /** Tickets per status, for the tabs and the sidebar badge. */
  async counts(): Promise<SupportCounts> {
    const { data } = await apiClient.get<SupportCounts>(ENDPOINTS.support.counts)
    return data
  },

  async get(id: string): Promise<SupportTicket> {
    const { data } = await apiClient.get<SupportTicket>(ENDPOINTS.support.byId(id))
    return data
  },

  /** Reply as support. Moves the ticket to In progress. Returns the updated ticket. */
  async reply(id: string, body: string): Promise<SupportTicket> {
    const { data } = await apiClient.post<SupportTicket>(ENDPOINTS.support.messages(id), { body })
    return data
  },

  async setStatus(id: string, status: 'RESOLVED' | 'CLOSED'): Promise<SupportTicket> {
    const { data } = await apiClient.patch<SupportTicket>(ENDPOINTS.support.status(id), { status })
    return data
  },
}
