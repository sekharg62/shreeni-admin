import apiClient from './apiClient'
import type { Paginated, PaginationQuery } from '../types/api'

/** The types one resource uses — passed once to createCrudService. */
export interface CrudTypes {
  /** item in the paginated list */
  item: unknown
  /** GET /:id response */
  detail: unknown
  /** POST / PUT / PATCH / DELETE response */
  record: unknown
  create: unknown
  replace: unknown
  update: unknown
  query: PaginationQuery
}

interface CrudPaths {
  root: string
  byId: (id: string) => string
}

/**
 * Standard admin CRUD for one resource:
 *   list    GET    /root?…filters     → { data, meta }
 *   get     GET    /root/:id
 *   create  POST   /root
 *   replace PUT    /root/:id          (full replace)
 *   update  PATCH  /root/:id          (partial)
 *   remove  DELETE /root/:id
 */
export function createCrudService<T extends CrudTypes>(paths: CrudPaths) {
  return {
    async list(query?: T['query']): Promise<Paginated<T['item']>> {
      const { data } = await apiClient.get<Paginated<T['item']>>(paths.root, { params: query })
      return data
    },

    async get(id: string): Promise<T['detail']> {
      const { data } = await apiClient.get<T['detail']>(paths.byId(id))
      return data
    },

    async create(payload: T['create']): Promise<T['record']> {
      const { data } = await apiClient.post<T['record']>(paths.root, payload)
      return data
    },

    async replace(id: string, payload: T['replace']): Promise<T['record']> {
      const { data } = await apiClient.put<T['record']>(paths.byId(id), payload)
      return data
    },

    async update(id: string, payload: T['update']): Promise<T['record']> {
      const { data } = await apiClient.patch<T['record']>(paths.byId(id), payload)
      return data
    },

    async remove(id: string): Promise<T['record']> {
      const { data } = await apiClient.delete<T['record']>(paths.byId(id))
      return data
    },
  }
}
