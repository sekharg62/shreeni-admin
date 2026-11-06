import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { getApiErrorMessage } from '../services/apiClient'

export interface ApiState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  /** Re-run the request (e.g. after a save). */
  refetch: () => Promise<void>
  /** Replace the data locally (optimistic updates, e.g. drag reorder). */
  setData: (updater: T | ((prev: T | undefined) => T)) => void
}

/**
 * Load data from a service and re-load when `deps` change.
 *   const { data, loading, error, refetch } = useApi(() => tagService.list(query), [query])
 * Responses that arrive after newer ones are ignored (no flicker on fast typing).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList): ApiState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      if (id === requestId.current) setDataState(result)
    } catch (err) {
      if (id === requestId.current) setError(getApiErrorMessage(err, 'Could not load data'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) =>
      typeof updater === 'function' ? (updater as (p: T | undefined) => T)(prev) : updater,
    )
  }, [])

  return { data, loading, error, refetch: run, setData }
}
