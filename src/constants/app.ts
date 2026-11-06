/** App-wide constants that mirror backend rules. */

/** Pagination — the backend caps `limit` at 100. */
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/** GST slabs accepted by the backend (Product.gstRate). */
export const GST_RATES = [0, 3, 5, 12, 18, 28] as const
export type GstRate = (typeof GST_RATES)[number]
export const GST_RATE_OPTIONS = GST_RATES.map((rate) => ({ label: `${rate}%`, value: String(rate) }))
export const DEFAULT_GST_RATE: GstRate = 5

/** Image uploads (backend converts everything to WebP). */
export const MAX_IMAGE_SIZE_MB = 10
export const MAX_IMAGES_PER_UPLOAD = 10

/** Money is stored and sent in paise: ₹1 = 100. */
export const PAISE_PER_RUPEE = 100
