import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
}

const POSITIONS: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const ARROWS: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
  left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
  right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
}

export default function Tooltip({
  content,
  children,
  position = 'top',
}: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
            POSITIONS[position],
          )}
        >
          {content}
          <span
            className={cn(
              'absolute h-2 w-2 rotate-45 bg-gray-900',
              ARROWS[position],
            )}
          />
        </span>
      )}
    </span>
  )
}
