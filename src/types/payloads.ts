/**
 * Request bodies and list filters, mirroring the backend DTOs.
 * Money is in PAISE (use lib/money.ts → rupeesToPaise).
 *
 * Conventions:
 *   Create*  → POST  (create)
 *   Replace* → PUT   (full replace: optional fields you omit go back to defaults)
 *   Update*  → PATCH (only the fields you send change)
 */
import type {
  CatalogStatus,
  DiscountType,
  Gender,
  OrderStatus,
  ReviewStatus,
  SpecGroup,
  SupportReason,
  SupportStatus,
} from '../constants/enums'
import type { GstRate } from '../constants/app'
import type { PaginationQuery } from './api'

// ── Categories ──────────────────────────────────────────────────────────────
export interface CreateCategoryPayload {
  name: string
  /** auto-generated from name when omitted */
  slug?: string
  description?: string
  /** null / omitted = top-level */
  parentId?: string | null
  gender?: Gender
  bannerUrl?: string
  posterUrl?: string
  sortOrder?: number
  status?: CatalogStatus
}
export type ReplaceCategoryPayload = CreateCategoryPayload
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>
export interface CategoryQuery extends PaginationQuery {
  status?: CatalogStatus
  /** a parent id, or "root" for top-level only */
  parentId?: string | 'root'
  gender?: Gender
  sortBy?: 'createdAt' | 'name' | 'sortOrder'
}

// ── Tags / Colors / Collections ─────────────────────────────────────────────
export interface CreateTagPayload {
  name: string
  slug?: string
  /** hex, e.g. "#b88646" */
  color?: string
}
export type ReplaceTagPayload = CreateTagPayload
export type UpdateTagPayload = Partial<CreateTagPayload>
export interface TagQuery extends PaginationQuery {
  sortBy?: 'createdAt' | 'name'
}

export interface CreateColorPayload {
  name: string
  hexCode?: string
}
export type ReplaceColorPayload = CreateColorPayload
export type UpdateColorPayload = Partial<CreateColorPayload>
export interface ColorQuery extends PaginationQuery {
  sortBy?: 'createdAt' | 'name'
}

export interface CreateCollectionPayload {
  name: string
  slug?: string
  description?: string
  isActive?: boolean
}
export type ReplaceCollectionPayload = CreateCollectionPayload
export type UpdateCollectionPayload = Partial<CreateCollectionPayload>
export interface CollectionQuery extends PaginationQuery {
  isActive?: boolean
  sortBy?: 'createdAt' | 'name'
}

// ── Product children ────────────────────────────────────────────────────────
export interface CreateProductImagePayload {
  url: string
  sortOrder?: number
  isPrimary?: boolean
}
export type ReplaceProductImagePayload = CreateProductImagePayload
export type UpdateProductImagePayload = Partial<CreateProductImagePayload>

export interface CreateProductVariantPayload {
  /** e.g. "Free Size", "XS" */
  size: string
  /** unique, e.g. "SUTAMIH618-XS" */
  sku: string
  stock?: number
  /** paise */
  priceOverride?: number
  isActive?: boolean
}
export type ReplaceProductVariantPayload = CreateProductVariantPayload
export type UpdateProductVariantPayload = Partial<CreateProductVariantPayload>

export interface CreateProductSpecificationPayload {
  group: SpecGroup
  label: string
  value: string
  sortOrder?: number
}
export type ReplaceProductSpecificationPayload = CreateProductSpecificationPayload
export type UpdateProductSpecificationPayload = Partial<CreateProductSpecificationPayload>

export interface SetProductColorsPayload {
  primaryColorId: string
  /** omit or null for none */
  secondaryColorId?: string | null
}

// ── Products ────────────────────────────────────────────────────────────────
/** The product's own fields (PUT replaces these; images/variants/etc. use their own routes). */
export interface ProductCorePayload {
  name: string
  slug?: string
  shortDescription?: string
  description: string
  story?: string
  categoryId: string
  gender?: Gender
  fabric?: string
  collectionName?: string
  /** MRP in paise */
  originalPrice: number
  /** selling price in paise; must be < originalPrice */
  discountPrice?: number
  /** 4–8 digits */
  hsnCode?: string
  gstRate?: GstRate
  lengthCm?: number
  widthCm?: number
  blousePiece?: boolean
  blousePieceInfo?: string
  washCare?: string
  countryOfOrigin?: string
  manufacturedBy?: string
  manufacturerAddress?: string
  status?: CatalogStatus
  isFeatured?: boolean
  sortOrder?: number
}

/** POST /admin/products — core fields + everything that belongs to the product, saved together. */
export interface CreateProductPayload extends ProductCorePayload {
  images?: CreateProductImagePayload[]
  variants?: CreateProductVariantPayload[]
  specifications?: CreateProductSpecificationPayload[]
  tagIds?: string[]
  collectionIds?: string[]
  colors?: SetProductColorsPayload
  relatedProductIds?: string[]
}
export type ReplaceProductPayload = ProductCorePayload
export type UpdateProductPayload = Partial<ProductCorePayload>
export interface ProductQuery extends PaginationQuery {
  status?: CatalogStatus
  categoryId?: string
  gender?: Gender
  isFeatured?: boolean
  sortBy?: 'createdAt' | 'name' | 'originalPrice' | 'sortOrder' | 'publishedAt'
}

// ── Discounts ───────────────────────────────────────────────────────────────
export interface CreateDiscountPayload {
  /** stored uppercase, e.g. "DIWALI20" */
  code: string
  description?: string
  type: DiscountType
  /** PERCENTAGE → 1–100; FLAT → paise */
  value: number
  /** PERCENTAGE only, paise */
  maxDiscountAmount?: number
  /** paise */
  minOrderValue?: number
  usageLimit?: number
  perUserLimit?: number
  /** ISO date-time */
  startsAt?: string
  endsAt?: string
  isActive?: boolean
}
export type ReplaceDiscountPayload = CreateDiscountPayload
export type UpdateDiscountPayload = Partial<CreateDiscountPayload>
export interface DiscountQuery extends PaginationQuery {
  isActive?: boolean
  type?: DiscountType
  sortBy?: 'createdAt' | 'code' | 'endsAt'
}

// ── Banners ─────────────────────────────────────────────────────────────────
export interface CreateBannerPayload {
  title?: string
  subtitle?: string
  /** from bannerService.uploadImage */
  imageUrl: string
  mobileImageUrl?: string
  /** "/collections/diwali-edit" or a full URL */
  linkUrl?: string
  sortOrder?: number
  status?: CatalogStatus
}
export type ReplaceBannerPayload = CreateBannerPayload
export type UpdateBannerPayload = Partial<CreateBannerPayload>
export interface BannerQuery extends PaginationQuery {
  status?: CatalogStatus
  sortBy?: 'sortOrder' | 'createdAt'
}

// ── Reviews ─────────────────────────────────────────────────────────────────
export interface ReviewQuery extends PaginationQuery {
  status?: ReviewStatus
  productId?: string
  rating?: 1 | 2 | 3 | 4 | 5
  sortBy?: 'createdAt' | 'rating'
}

// ── Support ─────────────────────────────────────────────────────────────────
export interface SupportTicketQuery extends PaginationQuery {
  status?: SupportStatus
  reason?: SupportReason
  sortBy?: 'lastMessageAt' | 'createdAt'
}

// ── Orders ──────────────────────────────────────────────────────────────────
export interface OrderQuery extends PaginationQuery {
  status?: OrderStatus
  /** YYYY-MM-DD, inclusive */
  from?: string
  to?: string
  sortBy?: 'createdAt' | 'grandTotal'
}

/** PATCH /admin/orders/:id/status */
export interface OrderStatusPayload {
  status: OrderStatus
  /** Shown to the customer on the order timeline. Required for cancellation. */
  note?: string
  /** Required when marking SHIPPED. */
  deliveryPartner?: string
  awb?: string
}
