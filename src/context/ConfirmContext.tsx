import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export interface ConfirmOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red button + warning icon (deletes, irreversible actions). */
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Promise-based confirm dialog:
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete tag?', danger: true })) { ...delete... }
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(ok: boolean) => void>(undefined)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = undefined
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => close(false)}
        title={options?.title}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={options?.danger ? 'danger' : 'primary'}
              onClick={() => close(true)}
              data-testid="confirm-ok"
              autoFocus
            >
              {options?.confirmLabel ?? (options?.danger ? 'Delete' : 'Confirm')}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          {options?.danger && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
          )}
          <div className="text-sm text-gray-600">{options?.message ?? 'Are you sure?'}</div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
