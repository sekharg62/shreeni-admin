/** Shape of every paginated list response from the backend. */
export interface Paginated<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type SortOrder = 'asc' | 'desc'

/** Query params every list endpoint accepts (each resource adds filters + sortBy). */
export interface PaginationQuery {
  page?: number
  /** max 100 */
  limit?: number
  search?: string
  sortOrder?: SortOrder
}

/** Body for PATCH /reorder endpoints — ids in the desired display order. */
export interface ReorderPayload {
  ids: string[]
}
