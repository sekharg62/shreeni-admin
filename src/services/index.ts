/**
 * All API services in one import:
 *   import { productService, categoryService, getApiErrorMessage } from '../services'
 *
 *   Resource                  Service
 *   ───────────────────────── ───────────────────────────────
 *   Auth                      authService
 *   Categories (+ tree)       categoryService
 *   Products                  productService
 *   └ images                  productImageService   (upload files: s3UploadService)
 *   └ variants (size/stock)   productVariantService
 *   └ specifications          productSpecificationService
 *   └ tags                    productTagService
 *   └ collections             productCollectionService
 *   └ primary/secondary color productColorService
 *   └ related products        relatedProductService
 *   Tags · Colors · Collections tagService · colorService · collectionService
 *   Discounts (coupons)       discountService
 *   Homepage banners          bannerService
 *   Reviews (moderation)      reviewService
 *   Support tickets           supportService
 *   Image uploads / discard   s3UploadService
 */
export { default as apiClient, getApiErrorMessage, AUTH_TOKEN_KEY } from './apiClient'
export { authService } from './authService'
export { categoryService } from './categoryService'
export { productService } from './productService'
export { productImageService } from './productImageService'
export { productVariantService } from './productVariantService'
export { productSpecificationService } from './productSpecificationService'
export {
  productTagService,
  productCollectionService,
  productColorService,
  relatedProductService,
} from './productLinkServices'
export { tagService, colorService, collectionService } from './catalogServices'
export { discountService } from './discountService'
export { bannerService } from './bannerService'
export { reviewService } from './reviewService'
export { supportService } from './supportService'
export { s3UploadService } from './s3UploadService'
