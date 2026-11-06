import { useCallback, useMemo, useRef, useState } from 'react'

/** A validator returns an error message, or undefined when the value is fine. */
export type Validator<V> = (values: V) => Partial<Record<keyof V, string>>

/**
 * Small form helper built on useState (no form library):
 *   const form = useForm({ name: '', color: '' }, validateTag)
 *   <Input value={form.values.name} onChange={(e) => form.set('name', e.target.value)}
 *          error={form.errors.name} />
 *   form.submit(async (values) => { ...save... })
 *
 * - errors appear after the first submit attempt, then update as you type
 * - `dirty` tells you if anything changed since the last reset (unsaved-changes warning)
 * - `setServerError` shows a backend message on a field (e.g. duplicate slug)
 */
export function useForm<V extends Record<string, unknown>>(initial: V, validate?: Validator<V>) {
  const [values, setValues] = useState<V>(initial)
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof V, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const baseline = useRef<V>(initial)

  const clientErrors = useMemo(
    () => (validate ? validate(values) : {}) as Partial<Record<keyof V, string>>,
    [values, validate],
  )

  const errors = useMemo(() => {
    const shown: Partial<Record<keyof V, string>> = { ...serverErrors }
    if (submitted) Object.assign(shown, clientErrors)
    return shown
  }, [clientErrors, serverErrors, submitted])

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline.current),
    [values],
  )

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setServerErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const patch = useCallback((partial: Partial<V>) => setValues((prev) => ({ ...prev, ...partial })), [])

  /** Reset to new initial values (after loading a record or a successful save). */
  const reset = useCallback((next?: V) => {
    const v = next ?? baseline.current
    baseline.current = v
    setValues(v)
    setServerErrors({})
    setSubmitted(false)
  }, [])

  const setServerError = useCallback((key: keyof V, message: string) => {
    setServerErrors((prev) => ({ ...prev, [key]: message }))
  }, [])

  /** Runs `onValid` only if there are no validation errors. */
  const submit = useCallback(
    async (onValid: (values: V) => Promise<void> | void) => {
      setSubmitted(true)
      if (Object.keys(clientErrors).length > 0) return
      setSubmitting(true)
      try {
        await onValid(values)
      } finally {
        setSubmitting(false)
      }
    },
    [clientErrors, values],
  )

  return {
    values,
    errors,
    dirty,
    submitting,
    isValid: Object.keys(clientErrors).length === 0,
    set,
    patch,
    reset,
    setServerError,
    submit,
  }
}
