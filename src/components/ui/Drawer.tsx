import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Sticky bottom bar (Cancel / Save). */
  footer?: ReactNode
  width?: 'md' | 'lg'
}

const WIDTHS = { md: 'max-w-md', lg: 'max-w-xl' }

/**
 * Side panel that slides in from the right — for longer forms where the
 * list behind it should stay visible. Escape or a click on the backdrop closes it.
 */
export default function Drawer({ open, onClose, title, description, children, footer, width = 'lg' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="drawer-backdrop absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('drawer-panel relative flex h-full w-full flex-col bg-white shadow-2xl', WIDTHS[width])}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50/70 px-6 py-4">{footer}</footer>
        )}
      </aside>
    </div>,
    document.body,
  )
}
