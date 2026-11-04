import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BoxContainerProps = {
  /** Header text shown at the top-left, breaking the border. */
  title: ReactNode
  children: ReactNode
  className?: string
}

export default function BoxContainer({
  title,
  children,
  className,
}: BoxContainerProps) {
  return (
    <fieldset
      className={cn(
        'rounded-lg border border-gray-300 px-4 pb-4 pt-3',
        className,
      )}
    >
      <legend className="px-2 text-sm font-semibold text-gray-700">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}
