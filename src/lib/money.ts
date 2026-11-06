import { PAISE_PER_RUPEE } from '../constants/app'

/** ₹1,499.50 → 149950 (what the API expects). */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE)
}

/** 149950 → 1499.5 */
export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE
}

/** 149950 → "₹1,499.50"  (whole amounts drop the decimals: 149900 → "₹1,499") */
export function formatPaise(paise: number | null | undefined): string {
  if (paise == null) return '—'
  const rupees = paise / PAISE_PER_RUPEE
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/** % off between MRP and selling price, e.g. (249900, 199900) → 20 */
export function discountPercent(originalPaise: number, discountPaise: number | null | undefined): number {
  if (!discountPaise || discountPaise >= originalPaise) return 0
  return Math.round(((originalPaise - discountPaise) / originalPaise) * 100)
}
