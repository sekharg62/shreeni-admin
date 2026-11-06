import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: number; type: ToastType; message: string; leaving?: boolean }

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const STYLE: Record<ToastType, { icon: LucideIcon; color: string; bar: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-600', bar: 'bg-green-600' },
  error: { icon: XCircle, color: 'text-red-600', bar: 'bg-red-600' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bar: 'bg-amber-500' },
  info: { icon: Info, color: 'text-gray-700', bar: 'bg-gray-700' },
}

/** Errors stay a bit longer so they can be read. */
const DURATION: Record<ToastType, number> = { success: 3000, info: 3500, warning: 5000, error: 6000 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200)
  }, [])

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]) // max 5 on screen
      setTimeout(() => dismiss(id), DURATION[type])
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      warning: (m) => push('warning', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        >
          {toasts.map((t) => {
            const { icon: Icon, color, bar } = STYLE[t.type]
            return (
              <div
                key={t.id}
                role={t.type === 'error' ? 'alert' : 'status'}
                data-testid={`toast-${t.type}`}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white pr-3 shadow-lg',
                  t.leaving ? 'toast-leave' : 'toast-enter',
                )}
              >
                <span className={cn('w-1 self-stretch', bar)} />
                <Icon className={cn('mt-3 h-5 w-5 shrink-0', color)} />
                <p className="flex-1 py-3 text-sm text-gray-800">{t.message}</p>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(t.id)}
                  className="mt-3 text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
