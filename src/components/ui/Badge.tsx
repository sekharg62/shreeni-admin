import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export default function Badge({
  variant = 'neutral',
  children,
}: {
  variant?: BadgeVariant
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
      )}
    >
      {children}
    </span>
  )
}
