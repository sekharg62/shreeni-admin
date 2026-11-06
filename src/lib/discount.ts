import { DiscountType } from '../constants/enums'
import type { BadgeVariant } from '../components/ui/Badge'
import type { Discount } from '../types/models'
import { formatPaise } from './money'
import { formatDay } from './formErrors'

/** What a shopper would see right now — worked out from the dates, limit and switch. */
export type DiscountState = 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'USED_UP' | 'OFF'

export const DISCOUNT_STATE: Record<DiscountState, { label: string; badge: BadgeVariant }> = {
  LIVE: { label: 'Live', badge: 'success' },
  SCHEDULED: { label: 'Scheduled', badge: 'info' },
  EXPIRED: { label: 'Expired', badge: 'neutral' },
  USED_UP: { label: 'Used up', badge: 'warning' },
  OFF: { label: 'Off', badge: 'neutral' },
}

export function discountState(d: Discount, now = new Date()): DiscountState {
  if (!d.isActive) return 'OFF'
  if (d.endsAt && new Date(d.endsAt) < now) return 'EXPIRED'
  if (d.startsAt && new Date(d.startsAt) > now) return 'SCHEDULED'
  if (d.usageLimit != null && d.usedCount >= d.usageLimit) return 'USED_UP'
  return 'LIVE'
}

/** "20% off" / "₹500 off" */
export function offerLabel(type: DiscountType, value: number): string {
  return type === DiscountType.PERCENTAGE ? `${value}% off` : `${formatPaise(value)} off`
}

/** "1 Nov 2026 – 15 Nov 2026", "From 1 Nov 2026", "Until …", or "No end date" */
export function validityLabel(startsAt: string | null, endsAt: string | null): string {
  if (startsAt && endsAt) return `${formatDay(startsAt)} – ${formatDay(endsAt)}`
  if (startsAt) return `From ${formatDay(startsAt)}`
  if (endsAt) return `Until ${formatDay(endsAt)}`
  return 'No end date'
}

/** One-line summary of the rules, e.g. "20% off orders over ₹2,000 · max ₹500 off · 1 use per customer". */
export function describeDiscount(d: {
  type: DiscountType
  value: number
  maxDiscountAmount: number | null
  minOrderValue: number | null
  usageLimit: number | null
  perUserLimit: number | null
  startsAt: string | null
  endsAt: string | null
}): string {
  const parts = [
    offerLabel(d.type, d.value) + (d.minOrderValue ? ` orders over ${formatPaise(d.minOrderValue)}` : ' any order'),
  ]
  if (d.type === DiscountType.PERCENTAGE && d.maxDiscountAmount) parts.push(`max ${formatPaise(d.maxDiscountAmount)} off`)
  if (d.perUserLimit) parts.push(`${d.perUserLimit} use${d.perUserLimit === 1 ? '' : 's'} per customer`)
  if (d.usageLimit) parts.push(`first ${d.usageLimit} orders`)
  if (d.startsAt || d.endsAt) parts.push(validityLabel(d.startsAt, d.endsAt))
  return parts.join(' · ')
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I

/** Readable random code: "SAVE20-K7QM", "FLAT500-X3PD", "SHREENI-9TAB". */
export function generateCode(type: DiscountType, value: string): string {
  const n = value.trim().replace(/\D/g, '')
  const prefix = !n ? 'SHREENI' : type === DiscountType.PERCENTAGE ? `SAVE${n}` : `FLAT${n}`
  const rand = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
  return `${prefix}-${rand}`
}
