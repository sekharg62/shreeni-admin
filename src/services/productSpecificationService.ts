import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { SpecGroup } from '../constants/enums'
import type { ProductSpecification } from '../types/models'
import type {
  CreateProductSpecificationPayload,
  ReplaceProductSpecificationPayload,
  UpdateProductSpecificationPayload,
} from '../types/payloads'

const P = ENDPOINTS.products

/** "Details" and "Manufacturing information" rows of a product. */
export const productSpecificationService = {
  async list(productId: string, group?: SpecGroup): Promise<ProductSpecification[]> {
    const { data } = await apiClient.get<ProductSpecification[]>(P.specifications(productId), {
      params: { group },
    })
    return data
  },

  async create(productId: string, payload: CreateProductSpecificationPayload): Promise<ProductSpecification> {
    const { data } = await apiClient.post<ProductSpecification>(P.specifications(productId), payload)
    return data
  },

  async replace(
    productId: string,
    id: string,
    payload: ReplaceProductSpecificationPayload,
  ): Promise<ProductSpecification> {
    const { data } = await apiClient.put<ProductSpecification>(P.specificationById(productId, id), payload)
    return data
  },

  async update(
    productId: string,
    id: string,
    payload: UpdateProductSpecificationPayload,
  ): Promise<ProductSpecification> {
    const { data } = await apiClient.patch<ProductSpecification>(P.specificationById(productId, id), payload)
    return data
  },

  /** ids in the new display order. Returns all specs of the product. */
  async reorder(productId: string, ids: string[]): Promise<ProductSpecification[]> {
    const { data } = await apiClient.patch<ProductSpecification[]>(P.specificationsReorder(productId), { ids })
    return data
  },

  async remove(productId: string, id: string): Promise<ProductSpecification> {
    const { data } = await apiClient.delete<ProductSpecification>(P.specificationById(productId, id))
    return data
  },
}
