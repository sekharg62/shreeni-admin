/**
 * Records returned by the admin API. Money fields are in PAISE.
 * Dates are ISO strings. Decimals (lengthCm/widthCm) arrive as strings.
 */
import type {
  AddressLabel,
  CatalogStatus,
  ColorType,
  DiscountType,
  Gender,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReviewStatus,
  Role,
  SpecGroup,
  SupportReason,
  SupportStatus,
} from '../constants/enums'

interface Timestamps {
  createdAt: string
  updatedAt: string
}

// ── Categories ──────────────────────────────────────────────────────────────
export interface Category extends Timestamps {
  id: string
  name: string
  slug: string
  description: string | null
  tagline: string | null
  parentId: string | null
  gender: Gender | null
  bannerUrl: string | null
  posterUrl: string | null
  sortOrder: number
  status: CatalogStatus
  publishedAt: string | null
}

/** Item in GET /admin/categories */
export interface CategoryListItem extends Category {
  parent: { id: string; name: string } | null
  _count: { products: number; children: number }
}

/** GET /admin/categories/:id */
export interface CategoryDetail extends Category {
  parent: { id: string; name: string; slug: string } | null
  children: { id: string; name: string; slug: string; status: CatalogStatus }[]
  _count: { products: number }
}

/** GET /admin/categories/tree */
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  status: CatalogStatus
  sortOrder: number
  gender: Gender | null
  bannerUrl: string | null
  posterUrl: string | null
  productCount: number
  children: CategoryTreeNode[]
}

// ── Simple catalog records ──────────────────────────────────────────────────
export interface Tag extends Timestamps {
  id: string
  name: string
  slug: string
  /** hex, e.g. "#b88646" */
  color: string | null
}
export interface TagWithCount extends Tag {
  _count: { products: number }
}

export interface Color extends Timestamps {
  id: string
  name: string
  hexCode: string | null
}
export interface ColorWithCount extends Color {
  _count: { products: number }
}

export interface Collection extends Timestamps {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
}
export interface CollectionWithCount extends Collection {
  _count: { products: number }
}

// ── Products ────────────────────────────────────────────────────────────────
export interface ProductImage extends Timestamps {
  id: string
  productId: string
  url: string
  sortOrder: number
  isPrimary: boolean
}

export interface ProductVariant extends Timestamps {
  id: string
  productId: string
  size: string
  sku: string
  stock: number
  /** Held by in-progress checkouts; available = stock − reservedStock. */
  reservedStock: number
  /** paise */
  priceOverride: number | null
  isActive: boolean
}

export interface ProductSpecification extends Timestamps {
  id: string
  productId: string
  group: SpecGroup
  label: string
  value: string
  sortOrder: number
}

export interface Product extends Timestamps {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  description: string
  story: string | null
  categoryId: string
  gender: Gender
  fabric: string | null
  collectionName: string | null
  /** paise */
  originalPrice: number
  /** paise */
  discountPrice: number | null
  hsnCode: string | null
  gstRate: number
  /** Decimal → string, e.g. "550" */
  lengthCm: string | null
  widthCm: string | null
  blousePiece: boolean
  blousePieceInfo: string | null
  washCare: string | null
  countryOfOrigin: string | null
  manufacturedBy: string | null
  manufacturerAddress: string | null
  status: CatalogStatus
  isFeatured: boolean
  sortOrder: number
  publishedAt: string | null
}

/** Item in GET /admin/products */
export interface ProductListItem extends Product {
  category: { id: string; name: string }
  /** Only the primary image (0 or 1 items). */
  images: ProductImage[]
  variants: Pick<ProductVariant, 'id' | 'size' | 'sku' | 'stock' | 'reservedStock' | 'isActive'>[]
  _count: { images: number; variants: number; reviews: number }
}

/** GET /admin/products/:id (and every create/update response) */
export interface ProductDetail extends Product {
  category: { id: string; name: string; slug: string }
  images: ProductImage[]
  variants: ProductVariant[]
  specifications: ProductSpecification[]
  colors: (Timestamps & {
    id: string
    productId: string
    colorId: string
    colorType: ColorType
    color: Color
  })[]
  tags: (Timestamps & { id: string; productId: string; tagId: string; tag: Tag })[]
  collections: (Timestamps & {
    id: string
    productId: string
    collectionId: string
    collection: { id: string; name: string; slug: string }
  })[]
  relatedFrom: (Timestamps & {
    id: string
    productId: string
    relatedProductId: string
    relatedProduct: { id: string; name: string; slug: string; status: CatalogStatus }
  })[]
}

/** GET/PUT /admin/products/:id/colors */
export interface ProductColors {
  primary: Color | null
  secondary: Color | null
}

/** Items of GET /admin/products/:id/related */
export interface RelatedProductSummary {
  id: string
  name: string
  slug: string
  status: CatalogStatus
  originalPrice: number
  discountPrice: number | null
  images: { url: string }[]
}

// ── Discounts ───────────────────────────────────────────────────────────────
export interface Discount extends Timestamps {
  id: string
  code: string
  description: string | null
  type: DiscountType
  /** PERCENTAGE → percent; FLAT → paise */
  value: number
  /** paise */
  maxDiscountAmount: number | null
  /** paise */
  minOrderValue: number | null
  usageLimit: number | null
  usedCount: number
  perUserLimit: number | null
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}
export interface DiscountWithCount extends Discount {
  _count: { orders: number }
}

// ── Content ─────────────────────────────────────────────────────────────────
export interface Banner extends Timestamps {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  mobileImageUrl: string | null
  linkUrl: string | null
  sortOrder: number
  status: CatalogStatus
}

// ── Reviews ─────────────────────────────────────────────────────────────────
export interface Review extends Timestamps {
  id: string
  productId: string
  userId: string | null
  rating: number
  title: string
  body: string
  reviewerName: string
  reviewerEmail: string
  images: string[]
  videos: string[]
  status: ReviewStatus
  product: { id: string; name: string; slug: string }
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string
  } | null
}

/** GET /admin/reviews/counts */
export type ReviewCounts = Record<ReviewStatus | 'ALL', number>

// ── Support ─────────────────────────────────────────────────────────────────
export interface SupportCustomer {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string
  email: string | null
}

interface SupportTicketBase extends Timestamps {
  id: string
  /** shown as "SUP-1042" */
  ticketNumber: number
  reason: SupportReason
  status: SupportStatus
  description: string
  lastMessageAt: string
  closedAt: string | null
  user: SupportCustomer
}

/** A row in GET /admin/support-tickets */
export interface SupportTicketListItem extends SupportTicketBase {
  messageCount: number
  /** null = no replies yet */
  lastReplyFrom: 'CUSTOMER' | 'SUPPORT' | null
}

export interface SupportMessage {
  id: string
  body: string
  senderRole: 'CUSTOMER' | 'ADMIN'
  createdAt: string
  sender: { id: string; firstName: string | null; lastName: string | null }
}

/** GET /admin/support-tickets/:id */
export interface SupportTicket extends SupportTicketBase {
  messages: SupportMessage[]
}

export type SupportCounts = Record<SupportStatus | 'ALL', number>

// ── Uploads ─────────────────────────────────────────────────────────────────
/** POST /admin/uploads/banner */
export interface UploadedImage {
  url: string
  key: string
  width: number
  height: number
  /** bytes after WebP conversion */
  size: number
  /** bytes of the file that was sent */
  originalSize: number
}

// ── Orders ──────────────────────────────────────────────────────────────────
/** A row in GET /admin/orders (amounts in paise). */
export interface AdminOrderListItem {
  id: string
  /** e.g. "OD261108482913" */
  orderNumber: string
  status: OrderStatus
  createdAt: string
  grandTotal: number
  discountCode: string | null
  contactPhone: string
  contactEmail: string | null
  shipReceiverName: string
  shipCity: string
  shipState: string
  userId: string | null
  isGuest: boolean
  itemCount: number
  payment: { status: PaymentStatus; provider: string; method: PaymentMethod } | null
}

export interface AdminOrderEvent {
  id: string
  status: OrderStatus
  label: string
  note: string | null
  createdAt: string
  actor: { firstName: string | null; lastName: string | null; role: Role } | null
}

/** GET /admin/orders/:id */
export interface AdminOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  subtotal: number
  discountCode: string | null
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  contactEmail: string | null
  contactPhone: string
  shipReceiverName: string
  shipReceiverPhone: string
  shipFlatHouseNo: string
  shipApartmentSector: string | null
  shipLandmark: string | null
  shipCity: string
  shipState: string
  shipPincode: string
  shipCountry: string
  cancelledAt: string | null
  cancelReason: string | null
  isGuest: boolean
  user: { id: string; firstName: string | null; lastName: string | null; email: string | null; phone: string } | null
  items: {
    id: string
    name: string
    sku: string | null
    size: string | null
    image: string | null
    unitPrice: number
    quantity: number
    productId: string | null
    variantId: string | null
    product: { slug: string } | null
  }[]
  payments: {
    id: string
    provider: string
    method: PaymentMethod
    amount: number
    status: PaymentStatus
    gatewayOrderId: string | null
    gatewayTxnId: string | null
    paidAt: string | null
    createdAt: string
  }[]
  shipment: { deliveryPartner: string; awb: string | null; status: string; shippedAt: string | null; deliveredAt: string | null } | null
  events: AdminOrderEvent[]
  /** Statuses this order can move to next. */
  nextStatuses: OrderStatus[]
}

export type OrderCounts = Record<OrderStatus | 'ALL' | 'TO_FULFIL', number> & {
  today: { orders: number; revenue: number }
}

// ── Customers ───────────────────────────────────────────────────────────────
/** A row in GET /admin/customers. `totalSpent` is paise across confirmed/packed/shipped/delivered orders. */
export interface AdminCustomer {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string
  phoneVerified: boolean
  emailVerified: boolean
  createdAt: string
  addressCount: number
  /** Every order except ones still awaiting payment. */
  orderCount: number
  /** Cancelled or returned (included in orderCount, not in totalSpent). */
  cancelledCount: number
  totalSpent: number
  lastOrderAt: string | null
}

export interface CustomerAddress {
  id: string
  label: AddressLabel
  receiverName: string
  receiverPhone: string
  flatHouseNo: string
  apartmentSector: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
  createdAt: string
}

/** GET /admin/customers/:id — loaded when a row is expanded. */
export interface AdminCustomerDetail {
  id: string
  addresses: CustomerAddress[]
  /** 5 latest orders (not counting ones awaiting payment). */
  orders: { id: string; orderNumber: string; status: OrderStatus; grandTotal: number; createdAt: string }[]
}
