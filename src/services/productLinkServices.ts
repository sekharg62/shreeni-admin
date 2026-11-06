import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type {
  Collection,
  ProductColors,
  RelatedProductSummary,
  Tag,
} from '../types/models'
import type { SetProductColorsPayload } from '../types/payloads'

/**
 * Links between a product and existing records. Each call returns the
 * product's current list. link() is safe to repeat; set() replaces the whole
 * list ([] clears it); unlink() 404s if it wasn't linked.
 */
const P = ENDPOINTS.products

export const productTagService = {
  async list(productId: string): Promise<Tag[]> {
    return (await apiClient.get<Tag[]>(P.tags(productId))).data
  },
  async link(productId: string, tagId: string): Promise<Tag[]> {
    return (await apiClient.post<Tag[]>(P.tags(productId), { tagId })).data
  },
  async set(productId: string, tagIds: string[]): Promise<Tag[]> {
    return (await apiClient.put<Tag[]>(P.tags(productId), { tagIds })).data
  },
  async unlink(productId: string, tagId: string): Promise<Tag[]> {
    return (await apiClient.delete<Tag[]>(P.tagById(productId, tagId))).data
  },
}

export const productCollectionService = {
  async list(productId: string): Promise<Collection[]> {
    return (await apiClient.get<Collection[]>(P.collections(productId))).data
  },
  async link(productId: string, collectionId: string): Promise<Collection[]> {
    return (await apiClient.post<Collection[]>(P.collections(productId), { collectionId })).data
  },
  async set(productId: string, collectionIds: string[]): Promise<Collection[]> {
    return (await apiClient.put<Collection[]>(P.collections(productId), { collectionIds })).data
  },
  async unlink(productId: string, collectionId: string): Promise<Collection[]> {
    return (await apiClient.delete<Collection[]>(P.collectionById(productId, collectionId))).data
  },
}

/** "You may also like" products. */
export const relatedProductService = {
  async list(productId: string): Promise<RelatedProductSummary[]> {
    return (await apiClient.get<RelatedProductSummary[]>(P.related(productId))).data
  },
  async link(productId: string, relatedProductId: string): Promise<RelatedProductSummary[]> {
    return (await apiClient.post<RelatedProductSummary[]>(P.related(productId), { relatedProductId })).data
  },
  async set(productId: string, relatedProductIds: string[]): Promise<RelatedProductSummary[]> {
    return (await apiClient.put<RelatedProductSummary[]>(P.related(productId), { relatedProductIds })).data
  },
  async unlink(productId: string, relatedProductId: string): Promise<RelatedProductSummary[]> {
    return (await apiClient.delete<RelatedProductSummary[]>(P.relatedById(productId, relatedProductId))).data
  },
}

/** Primary (+ optional secondary) color of a product. */
export const productColorService = {
  async get(productId: string): Promise<ProductColors> {
    return (await apiClient.get<ProductColors>(P.colors(productId))).data
  },
  async set(productId: string, payload: SetProductColorsPayload): Promise<ProductColors> {
    return (await apiClient.put<ProductColors>(P.colors(productId), payload)).data
  },
  async clear(productId: string): Promise<ProductColors> {
    return (await apiClient.delete<ProductColors>(P.colors(productId))).data
  },
}
