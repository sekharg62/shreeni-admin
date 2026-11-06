import { useCallback, useState } from 'react'
import { getApiErrorMessage } from '../services/apiClient'
import { useToast } from '../context/ToastContext'

interface ActionOptions {
  /** Toast shown on success (omit for none). */
  success?: string
  /** Fallback error text if the API gives none. */
  errorFallback?: string
}

/**
 * Wrap a save/delete call: tracks `pending`, toasts success/error.
 *   const save = useAction(tagService.create, { success: 'Tag created' })
 *   const created = await save.run(payload)   // undefined if it failed
 */
export function useAction<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  options: ActionOptions = {},
) {
  const toast = useToast()
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      setPending(true)
      try {
        const result = await fn(...args)
        if (options.success) toast.success(options.success)
        return result
      } catch (err) {
        toast.error(getApiErrorMessage(err, options.errorFallback ?? 'Something went wrong'))
        return undefined
      } finally {
        setPending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, options.success, options.errorFallback],
  )

  return { run, pending }
}
