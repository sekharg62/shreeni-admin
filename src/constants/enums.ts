/**
 * Enum values — mirror the backend's Prisma enums (shreeni-backend/prisma/schema.prisma).
 * Keep these in sync when the schema changes.
 *
 * Each enum has:
 *   - the value object      (use in code:  CatalogStatus.PUBLISHED)
 *   - its type              (use in types: status: CatalogStatus)
 *   - *_LABELS              (human text for the UI)
 *   - *_OPTIONS             ({ label, value }[] — plug straight into Dropdown / RadioGroup / ChipFilter)
 */

/** Builds { label, value }[] from an enum object + labels map (in declaration order). */
function toOptions<T extends Record<string, string>>(
  values: T,
  labels: Record<T[keyof T], string>,
): { label: string; value: T[keyof T] }[] {
  return (Object.values(values) as T[keyof T][]).map((value) => ({ label: labels[value], value }))
}

// ── Users ───────────────────────────────────────────────────────────────────
export const Role = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const
export type Role = (typeof Role)[keyof typeof Role]
export const ROLE_LABELS: Record<Role, string> = { CUSTOMER: 'Customer', ADMIN: 'Admin' }
export const ROLE_OPTIONS = toOptions(Role, ROLE_LABELS)

// ── Catalog visibility (Category, Product, Banner) ─────────────────────────
export const CatalogStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
  DISCONTINUED: 'DISCONTINUED',
} as const
export type CatalogStatus = (typeof CatalogStatus)[keyof typeof CatalogStatus]
export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  UNPUBLISHED: 'Unpublished',
  DISCONTINUED: 'Discontinued',
}
export const CATALOG_STATUS_OPTIONS = toOptions(CatalogStatus, CATALOG_STATUS_LABELS)
/** Badge variant per status (matches components/ui/Badge). */
export const CATALOG_STATUS_BADGE: Record<CatalogStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  UNPUBLISHED: 'warning',
  DISCONTINUED: 'danger',
}

export const Gender = {
  WOMEN: 'WOMEN',
  MEN: 'MEN',
  UNISEX: 'UNISEX',
  GIRLS: 'GIRLS',
  BOYS: 'BOYS',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]
export const GENDER_LABELS: Record<Gender, string> = {
  WOMEN: 'Women',
  MEN: 'Men',
  UNISEX: 'Unisex',
  GIRLS: 'Girls',
  BOYS: 'Boys',
}
export const GENDER_OPTIONS = toOptions(Gender, GENDER_LABELS)

export const ColorType = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
} as const
export type ColorType = (typeof ColorType)[keyof typeof ColorType]
export const COLOR_TYPE_LABELS: Record<ColorType, string> = { PRIMARY: 'Primary', SECONDARY: 'Secondary' }
export const COLOR_TYPE_OPTIONS = toOptions(ColorType, COLOR_TYPE_LABELS)

export const SpecGroup = {
  DETAILS: 'DETAILS',
  MANUFACTURING: 'MANUFACTURING',
} as const
export type SpecGroup = (typeof SpecGroup)[keyof typeof SpecGroup]
export const SPEC_GROUP_LABELS: Record<SpecGroup, string> = {
  DETAILS: 'Details',
  MANUFACTURING: 'Manufacturing information',
}
export const SPEC_GROUP_OPTIONS = toOptions(SpecGroup, SPEC_GROUP_LABELS)

// ── Reviews ─────────────────────────────────────────────────────────────────
export const ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus]
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}
export const REVIEW_STATUS_OPTIONS = toOptions(ReviewStatus, REVIEW_STATUS_LABELS)
export const REVIEW_STATUS_BADGE: Record<ReviewStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

// ── Support ─────────────────────────────────────────────────────────────────
export const SupportStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const
export type SupportStatus = (typeof SupportStatus)[keyof typeof SupportStatus]
export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}
export const SUPPORT_STATUS_BADGE: Record<SupportStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
}

export const SupportReason = {
  ORDER_ISSUE: 'ORDER_ISSUE',
  DELIVERY: 'DELIVERY',
  PAYMENT: 'PAYMENT',
  RETURN_REFUND: 'RETURN_REFUND',
  PRODUCT_QUALITY: 'PRODUCT_QUALITY',
  ACCOUNT: 'ACCOUNT',
  OTHER: 'OTHER',
} as const
export type SupportReason = (typeof SupportReason)[keyof typeof SupportReason]
export const SUPPORT_REASON_LABELS: Record<SupportReason, string> = {
  ORDER_ISSUE: 'Order issue',
  DELIVERY: 'Delivery',
  PAYMENT: 'Payment',
  RETURN_REFUND: 'Return / refund',
  PRODUCT_QUALITY: 'Product quality',
  ACCOUNT: 'Account',
  OTHER: 'Other',
}
export const SUPPORT_REASON_OPTIONS = toOptions(SupportReason, SUPPORT_REASON_LABELS)

// ── Addresses ───────────────────────────────────────────────────────────────
export const AddressLabel = {
  HOME: 'HOME',
  WORK: 'WORK',
  OTHER: 'OTHER',
} as const
export type AddressLabel = (typeof AddressLabel)[keyof typeof AddressLabel]
export const ADDRESS_LABEL_LABELS: Record<AddressLabel, string> = { HOME: 'Home', WORK: 'Work', OTHER: 'Other' }
export const ADDRESS_LABEL_OPTIONS = toOptions(AddressLabel, ADDRESS_LABEL_LABELS)

// ── Discounts ───────────────────────────────────────────────────────────────
export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
} as const
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]
export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Percentage (%)',
  FLAT: 'Flat amount (₹)',
}
export const DISCOUNT_TYPE_OPTIONS = toOptions(DiscountType, DISCOUNT_TYPE_LABELS)

// ── Orders, payments, shipping (used by Phase 2 screens) ────────────────────
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
}
export const ORDER_STATUS_OPTIONS = toOptions(OrderStatus, ORDER_STATUS_LABELS)

export const PaymentMethod = {
  PREPAID: 'PREPAID',
  COD: 'COD',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PREPAID: 'Prepaid',
  COD: 'Cash on delivery',
}
export const PAYMENT_METHOD_OPTIONS = toOptions(PaymentMethod, PAYMENT_METHOD_LABELS)

export const PaymentStatus = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  CREATED: 'Created',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}
export const PAYMENT_STATUS_OPTIONS = toOptions(PaymentStatus, PAYMENT_STATUS_LABELS)

export const ShipmentStatus = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus]
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: 'Pending',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
}
export const SHIPMENT_STATUS_OPTIONS = toOptions(ShipmentStatus, SHIPMENT_STATUS_LABELS)
