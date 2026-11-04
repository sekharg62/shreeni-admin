import type { ElementType, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
type TextVariant =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'danger'
  | 'success'
  | 'white'
type TextAlign = 'left' | 'center' | 'right'

type TextProps = {
  children: ReactNode
  /** HTML tag to render (p, span, h1, label, …). Defaults to <p>. */
  as?: ElementType
  size?: TextSize
  weight?: TextWeight
  variant?: TextVariant
  align?: TextAlign
  truncate?: boolean
  className?: string
  htmlFor?: string
}

const SIZES: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
}

const WEIGHTS: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const VARIANTS: Record<TextVariant, string> = {
  default: 'text-gray-900',
  muted: 'text-gray-500',
  subtle: 'text-gray-400',
  danger: 'text-red-600',
  success: 'text-green-600',
  white: 'text-white',
}

const ALIGNS: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function Text({
  children,
  as: Tag = 'p',
  size = 'base',
  weight = 'normal',
  variant = 'default',
  align,
  truncate = false,
  className,
  ...rest
}: TextProps) {
  return (
    <Tag
      className={cn(
        SIZES[size],
        WEIGHTS[weight],
        VARIANTS[variant],
        align && ALIGNS[align],
        truncate && 'truncate',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
