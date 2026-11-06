import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * List-page state (page, search, filters) kept in the URL query string,
 * so the back button, refresh and shared links keep the same view.
 *
 *   const [state, setState] = useUrlState({ page: '1', search: '', status: '' })
 *   setState({ search: 'silk', page: '1' })
 * Values equal to their default are removed from the URL to keep it clean.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams()

  const state = useMemo(() => {
    const out = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = params.get(key as string)
      if (v !== null) out[key] = v as T[keyof T]
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const setState = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === '' || v === defaults[k]) next.delete(k)
            else next.set(k, String(v))
          }
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  )

  return [state, setState] as const
}
