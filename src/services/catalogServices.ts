import apiClient from './apiClient'
import { createCrudService } from './crud'
import { ENDPOINTS } from '../constants/endpoints'
import type {
  Collection,
  CollectionWithCount,
  Color,
  ColorWithCount,
  Tag,
  TagWithCount,
} from '../types/models'
import type {
  CollectionQuery,
  ColorQuery,
  CreateCollectionPayload,
  CreateColorPayload,
  CreateTagPayload,
  ReplaceCollectionPayload,
  ReplaceColorPayload,
  ReplaceTagPayload,
  TagQuery,
  UpdateCollectionPayload,
  UpdateColorPayload,
  UpdateTagPayload,
} from '../types/payloads'

/** Tags shown as badges on products, e.g. "Saree with blouse piece". */
export const tagService = createCrudService<{
  item: TagWithCount
  detail: TagWithCount
  record: Tag
  create: CreateTagPayload
  replace: ReplaceTagPayload
  update: UpdateTagPayload
  query: TagQuery
}>(ENDPOINTS.tags)

/** Color palette used for product primary/secondary colors. */
export const colorService = createCrudService<{
  item: ColorWithCount
  detail: ColorWithCount
  record: Color
  create: CreateColorPayload
  replace: ReplaceColorPayload
  update: UpdateColorPayload
  query: ColorQuery
}>(ENDPOINTS.colors)

/** Marketing collections, e.g. "Diwali Edit". */
export const collectionService = {
  ...createCrudService<{
    item: CollectionWithCount
    detail: CollectionWithCount
    record: Collection
    create: CreateCollectionPayload
    replace: ReplaceCollectionPayload
    update: UpdateCollectionPayload
    query: CollectionQuery
  }>(ENDPOINTS.collections),

  async setActive(id: string, isActive: boolean): Promise<Collection> {
    const { data } = await apiClient.patch<Collection>(ENDPOINTS.collections.status(id), { isActive })
    return data
  },
}
