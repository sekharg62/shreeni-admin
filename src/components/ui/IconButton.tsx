import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import Tooltip from './Tooltip'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  /** Tooltip + accessible name, e.g. "Edit" */
  label: string
  tone?: 'default' | 'danger'
}

/** Small square icon button with a tooltip (table row actions). */
export default function IconButton({ icon: Icon, label, tone = 'default', className, ...props }: IconButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          tone === 'danger'
            ? 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          className,
        )}
        {...props}
      >
        <Icon className="h-4 w-4" />
      </button>
    </Tooltip>
  )
}
