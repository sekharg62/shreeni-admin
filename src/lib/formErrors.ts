import axios from 'axios'
import { getApiErrorMessage } from '../services/apiClient'

/**
 * Turn a failed save into the right message:
 * a 409 (duplicate slug/code/SKU) goes under `conflictField` on the form,
 * anything else becomes an error toast.
 */
export function reportSaveError<K extends string>(
  err: unknown,
  opts: {
    toastError: (message: string) => void
    setFieldError?: (field: K, message: string) => void
    conflictField?: K
  },
) {
  const message = getApiErrorMessage(err, 'Could not save. Please try again.')
  const status = axios.isAxiosError(err) ? err.response?.status : undefined
  if (status === 409 && opts.conflictField && opts.setFieldError) {
    opts.setFieldError(opts.conflictField, message)
  } else {
    opts.toastError(message)
  }
}

/** ISO date string → "6 Nov 2026" */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )
}
