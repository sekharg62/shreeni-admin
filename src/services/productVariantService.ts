import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { ProductVariant } from '../types/models'
import type {
  CreateProductVariantPayload,
  ReplaceProductVariantPayload,
  UpdateProductVariantPayload,
} from '../types/payloads'

const P = ENDPOINTS.products

/** Sizes + stock of a product. Stock can't go below reservedStock. */
export const productVariantService = {
  async list(productId: string): Promise<ProductVariant[]> {
    const { data } = await apiClient.get<ProductVariant[]>(P.variants(productId))
    return data
  },

  async get(productId: string, id: string): Promise<ProductVariant> {
    const { data } = await apiClient.get<ProductVariant>(P.variantById(productId, id))
    return data
  },

  async create(productId: string, payload: CreateProductVariantPayload): Promise<ProductVariant> {
    const { data } = await apiClient.post<ProductVariant>(P.variants(productId), payload)
    return data
  },

  async replace(productId: string, id: string, payload: ReplaceProductVariantPayload): Promise<ProductVariant> {
    const { data } = await apiClient.put<ProductVariant>(P.variantById(productId, id), payload)
    return data
  },

  async update(productId: string, id: string, payload: UpdateProductVariantPayload): Promise<ProductVariant> {
    const { data } = await apiClient.patch<ProductVariant>(P.variantById(productId, id), payload)
    return data
  },

  async setActive(productId: string, id: string, isActive: boolean): Promise<ProductVariant> {
    const { data } = await apiClient.patch<ProductVariant>(P.variantStatus(productId, id), { isActive })
    return data
  },

  async remove(productId: string, id: string): Promise<ProductVariant> {
    const { data } = await apiClient.delete<ProductVariant>(P.variantById(productId, id))
    return data
  },
}
