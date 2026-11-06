/**
 * Product form state ↔ API payloads, validation and small helpers.
 * The form works in rupees and strings (what the inputs hold); the API wants paise and numbers.
 */
import { CatalogStatus, Gender, SpecGroup } from '../../constants/enums'
import { DEFAULT_GST_RATE, type GstRate } from '../../constants/app'
import { paiseToRupees, rupeesToPaise } from '../../lib/money'
import { collectErrors, rules } from '../../lib/validators'
import type { ProductDetail } from '../../types/models'
import type { PickedProduct } from '../../components/ui/ProductPicker'
import type {
  CreateProductPayload,
  CreateProductSpecificationPayload,
  CreateProductVariantPayload,
  ProductCorePayload,
} from '../../types/payloads'

export type VariantRow = {
  /** stable React key */
  key: string
  /** set once saved on the server */
  id?: string
  size: string
  sku: string
  stock: string
  /** rupees; empty = use the product price */
  price: string
  isActive: boolean
  /** read-only, from the server */
  reservedStock: number
}

export type SpecRow = { key: string; id?: string; group: SpecGroup; label: string; value: string }

export type ProductValues = {
  name: string
  slug: string
  categoryId: string
  gender: Gender
  shortDescription: string
  description: string
  story: string
  originalPrice: string
  discountPrice: string
  gstRate: string
  hsnCode: string
  fabric: string
  collectionName: string
  lengthCm: string
  widthCm: string
  blousePiece: boolean
  blousePieceInfo: string
  washCare: string
  countryOfOrigin: string
  manufacturedBy: string
  manufacturerAddress: string
  status: CatalogStatus
  isFeatured: boolean
  variants: VariantRow[]
  specs: SpecRow[]
  tagIds: string[]
  collectionIds: string[]
  /** "You may also like" — kept with names so the chips can show them */
  related: PickedProduct[]
  primaryColorId: string
  secondaryColorId: string
}

let keySeq = 0
export const newKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`

export const blankVariant = (size = ''): VariantRow => ({
  key: newKey(),
  size,
  sku: '',
  stock: '',
  price: '',
  isActive: true,
  reservedStock: 0,
})

export const blankSpec = (group: SpecGroup, label = ''): SpecRow => ({ key: newKey(), group, label, value: '' })

export function emptyProduct(): ProductValues {
  return {
    name: '',
    slug: '',
    categoryId: '',
    gender: Gender.WOMEN,
    shortDescription: '',
    description: '',
    story: '',
    originalPrice: '',
    discountPrice: '',
    gstRate: String(DEFAULT_GST_RATE),
    hsnCode: '',
    fabric: '',
    collectionName: '',
    lengthCm: '',
    widthCm: '',
    blousePiece: false,
    blousePieceInfo: '',
    washCare: '',
    countryOfOrigin: 'India',
    manufacturedBy: '',
    manufacturerAddress: '',
    status: CatalogStatus.DRAFT,
    isFeatured: false,
    variants: [blankVariant('Free Size')],
    specs: [],
    tagIds: [],
    collectionIds: [],
    related: [],
    primaryColorId: '',
    secondaryColorId: '',
  }
}

const str = (v: string | number | null | undefined) => (v == null ? '' : String(v))
const rupees = (paise: number | null | undefined) => (paise == null ? '' : String(paiseToRupees(paise)))

/** Server product → form values. */
export function fromProduct(p: ProductDetail): ProductValues {
  return {
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    gender: p.gender,
    shortDescription: str(p.shortDescription),
    description: p.description,
    story: str(p.story),
    originalPrice: rupees(p.originalPrice),
    discountPrice: rupees(p.discountPrice),
    gstRate: String(p.gstRate),
    hsnCode: str(p.hsnCode),
    fabric: str(p.fabric),
    collectionName: str(p.collectionName),
    lengthCm: p.lengthCm == null ? '' : String(Number(p.lengthCm)),
    widthCm: p.widthCm == null ? '' : String(Number(p.widthCm)),
    blousePiece: p.blousePiece,
    blousePieceInfo: str(p.blousePieceInfo),
    washCare: str(p.washCare),
    countryOfOrigin: str(p.countryOfOrigin),
    manufacturedBy: str(p.manufacturedBy),
    manufacturerAddress: str(p.manufacturerAddress),
    status: p.status,
    isFeatured: p.isFeatured,
    variants: p.variants.map((v) => ({
      key: v.id,
      id: v.id,
      size: v.size,
      sku: v.sku,
      stock: String(v.stock),
      price: rupees(v.priceOverride),
      isActive: v.isActive,
      reservedStock: v.reservedStock,
    })),
    specs: p.specifications.map((s) => ({ key: s.id, id: s.id, group: s.group, label: s.label, value: s.value })),
    tagIds: p.tags.map((t) => t.tagId),
    collectionIds: p.collections.map((c) => c.collectionId),
    related: p.relatedFrom.map((r) => ({ id: r.relatedProductId, name: r.relatedProduct.name })),
    primaryColorId: p.colors.find((c) => c.colorType === 'PRIMARY')?.colorId ?? '',
    secondaryColorId: p.colors.find((c) => c.colorType === 'SECONDARY')?.colorId ?? '',
  }
}

const opt = (s: string) => s.trim() || undefined
const optNum = (s: string) => (s.trim() === '' ? undefined : Number(s))
const optPaise = (s: string) => (s.trim() === '' ? undefined : rupeesToPaise(Number(s)))

/** The product's own fields (PUT/POST body without children). */
export function toCorePayload(v: ProductValues, sortOrder?: number): ProductCorePayload {
  return {
    name: v.name.trim(),
    slug: opt(v.slug),
    categoryId: v.categoryId,
    gender: v.gender,
    shortDescription: opt(v.shortDescription),
    description: v.description.trim(),
    story: opt(v.story),
    originalPrice: rupeesToPaise(Number(v.originalPrice)),
    discountPrice: optPaise(v.discountPrice),
    gstRate: Number(v.gstRate) as GstRate,
    hsnCode: opt(v.hsnCode),
    fabric: opt(v.fabric),
    collectionName: opt(v.collectionName),
    lengthCm: optNum(v.lengthCm),
    widthCm: optNum(v.widthCm),
    blousePiece: v.blousePiece,
    blousePieceInfo: v.blousePiece ? opt(v.blousePieceInfo) : undefined,
    washCare: opt(v.washCare),
    countryOfOrigin: opt(v.countryOfOrigin),
    manufacturedBy: opt(v.manufacturedBy),
    manufacturerAddress: opt(v.manufacturerAddress),
    status: v.status,
    isFeatured: v.isFeatured,
    sortOrder,
  }
}

export const variantPayload = (r: VariantRow): CreateProductVariantPayload => ({
  size: r.size.trim(),
  sku: r.sku.trim(),
  stock: r.stock.trim() === '' ? 0 : Number(r.stock),
  priceOverride: optPaise(r.price),
  isActive: r.isActive,
})

export const specPayload = (r: SpecRow, sortOrder: number): CreateProductSpecificationPayload => ({
  group: r.group,
  label: r.label.trim(),
  value: r.value.trim(),
  sortOrder,
})

/** POST /admin/products body — everything in one transaction. */
export function toCreatePayload(v: ProductValues): CreateProductPayload {
  return {
    ...toCorePayload(v),
    variants: v.variants.map(variantPayload),
    specifications: orderedSpecs(v.specs).map((s, i) => specPayload(s, i)),
    tagIds: v.tagIds,
    collectionIds: v.collectionIds,
    relatedProductIds: v.related.map((r) => r.id),
    colors: v.primaryColorId
      ? { primaryColorId: v.primaryColorId, secondaryColorId: v.secondaryColorId || null }
      : undefined,
  }
}

/** Details first, then Manufacturing — the order the store shows them in. */
export function orderedSpecs(specs: SpecRow[]): SpecRow[] {
  return [...specs.filter((s) => s.group === SpecGroup.DETAILS), ...specs.filter((s) => s.group === SpecGroup.MANUFACTURING)]
}

// ── Validation ──────────────────────────────────────────────────────────────
const SKU_REGEX = /^[A-Za-z0-9_-]{2,50}$/
const HSN_REGEX = /^\d{4,8}$/
const isMoney = (s: string, min: number) => {
  const n = Number(s)
  return s.trim() !== '' && !Number.isNaN(n) && n >= min && Math.round(n * 100) === n * 100
}

export type RowErrors = Partial<Record<'size' | 'sku' | 'stock' | 'price', string>>

/** Per-row variant errors (also catches duplicate sizes/SKUs inside the form). */
export function variantErrors(rows: VariantRow[]): Record<string, RowErrors> {
  const out: Record<string, RowErrors> = {}
  const count = (key: 'size' | 'sku', value: string) =>
    rows.filter((r) => r[key].trim().toLowerCase() === value.trim().toLowerCase()).length
  for (const r of rows) {
    const e: RowErrors = {}
    if (!r.size.trim()) e.size = 'Size is required'
    else if (count('size', r.size) > 1) e.size = 'Each size can be used once'
    if (!r.sku.trim()) e.sku = 'SKU is required'
    else if (!SKU_REGEX.test(r.sku.trim())) e.sku = 'Letters, numbers, - or _ (2–50)'
    else if (count('sku', r.sku) > 1) e.sku = 'SKU must be unique'
    if (r.stock.trim() !== '') {
      const n = Number(r.stock)
      if (!Number.isInteger(n) || n < 0) e.stock = 'Whole number, 0 or more'
      else if (n < r.reservedStock) e.stock = `At least ${r.reservedStock} (reserved in checkouts)`
    }
    if (r.price.trim() !== '' && !isMoney(r.price, 0.01)) e.price = 'Enter a valid amount'
    if (Object.keys(e).length) out[r.key] = e
  }
  return out
}

export function specErrors(rows: SpecRow[]): Record<string, { label?: string; value?: string }> {
  const out: Record<string, { label?: string; value?: string }> = {}
  for (const r of rows) {
    const e: { label?: string; value?: string } = {}
    if (!r.label.trim()) e.label = 'Required'
    if (!r.value.trim()) e.value = 'Required'
    if (Object.keys(e).length) out[r.key] = e
  }
  return out
}

export function validateProduct(v: ProductValues) {
  const original = Number(v.originalPrice)
  const sale = Number(v.discountPrice)
  const num = (s: string, label: string) =>
    s.trim() !== '' && (Number.isNaN(Number(s)) || Number(s) <= 0) ? `${label} must be more than 0` : undefined
  return collectErrors({
    name: [rules.required(v.name, 'Name'), rules.maxLength(v.name, 200, 'Name')],
    slug: [rules.slug(v.slug)],
    categoryId: [v.categoryId ? undefined : 'Every product needs a category'],
    description: [rules.required(v.description, 'Description')],
    originalPrice: [
      rules.required(v.originalPrice, 'Price'),
      v.originalPrice && !isMoney(v.originalPrice, 1) ? 'Enter a price of at least ₹1' : undefined,
    ],
    discountPrice: [
      v.discountPrice && !isMoney(v.discountPrice, 0.01) ? 'Enter a valid amount' : undefined,
      v.discountPrice && isMoney(v.discountPrice, 0.01) && sale >= original ? 'Sale price must be lower than the price' : undefined,
    ],
    hsnCode: [v.hsnCode && !HSN_REGEX.test(v.hsnCode) ? 'HSN code is 4–8 digits' : undefined],
    lengthCm: [num(v.lengthCm, 'Length')],
    widthCm: [num(v.widthCm, 'Width')],
    secondaryColorId: [
      v.secondaryColorId && !v.primaryColorId ? 'Pick a primary color first' : undefined,
      v.secondaryColorId && v.secondaryColorId === v.primaryColorId ? 'Must differ from the primary color' : undefined,
    ],
    variants: [
      v.variants.length === 0 ? 'Add at least one size' : undefined,
      Object.keys(variantErrors(v.variants)).length ? 'Fix the highlighted sizes' : undefined,
    ],
    specs: [Object.keys(specErrors(v.specs)).length ? 'Fill in or remove the empty rows' : undefined],
  })
}

// ── Helpers ─────────────────────────────────────────────────────────────────
/** "red-jamdani-saree" + "Free Size" → "REDJAMDANISA-FREESIZE" */
export function suggestSku(slugOrName: string, size: string): string {
  const base = slugOrName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
  const sz = size.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  return [base || 'SKU', sz].filter(Boolean).join('-')
}

/** Section ids (for the sticky side menu) → which form keys live there. */
export const SECTION_FIELDS: Record<string, (keyof ProductValues)[]> = {
  basics: ['name', 'slug', 'categoryId', 'description'],
  pricing: ['originalPrice', 'discountPrice', 'hsnCode'],
  variants: ['variants'],
  details: ['lengthCm', 'widthCm'],
  specs: ['specs'],
  colors: ['secondaryColorId'],
}
