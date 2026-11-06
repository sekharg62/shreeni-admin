import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '../constants/app'
import { useDebounce } from './useDebounce'
import { useUrlState } from './useUrlState'

/** "createdAt:desc" style sort keys used by list-page sort dropdowns. */
export const SORT_PRESETS = {
  newest: { label: 'Newest first', value: 'createdAt:desc' },
  oldest: { label: 'Oldest first', value: 'createdAt:asc' },
  nameAsc: { label: 'Name A → Z', value: 'name:asc' },
  nameDesc: { label: 'Name Z → A', value: 'name:desc' },
} as const

/**
 * Everything a paginated list page needs, synced to the URL:
 * page, limit, debounced search, "field:order" sort, and string filters.
 *
 *   const list = useListParams({ sort: 'createdAt:desc', filters: { isActive: '' } })
 *   useApi(() => tagService.list(list.query), [list.queryKey])
 */
export function useListParams<F extends Record<string, string>>(options: {
  sort?: string
  filters?: F
  limit?: number
}) {
  const filterDefaults = (options.filters ?? {}) as F
  const [url, setUrl] = useUrlState({
    page: '1',
    limit: String(options.limit ?? DEFAULT_PAGE_SIZE),
    search: '',
    sort: options.sort ?? 'createdAt:desc',
    ...filterDefaults,
  } as Record<string, string>)

  // The search box updates instantly; the URL/API follow after a short pause.
  const [searchInput, setSearchInput] = useState(url.search)
  const debounced = useDebounce(searchInput)
  useEffect(() => {
    if (debounced !== url.search) setUrl({ search: debounced, page: '1' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const [sortBy, sortOrder] = url.sort.split(':') as [string, 'asc' | 'desc']
  const filters = Object.fromEntries(
    Object.keys(filterDefaults).map((k) => [k, url[k]]),
  ) as F

  /** Params ready to pass to a service .list() — empty filters are dropped. */
  const query = useMemo(() => {
    const q: Record<string, unknown> = {
      page: Number(url.page) || 1,
      limit: Number(url.limit) || DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
    }
    if (url.search) q.search = url.search
    for (const k of Object.keys(filterDefaults)) {
      const v = url[k]
      if (v === '') continue
      q[k] = v === 'true' ? true : v === 'false' ? false : v
    }
    return q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return {
    query,
    /** Stable dependency for useApi. */
    queryKey: JSON.stringify(query),
    page: Number(url.page) || 1,
    limit: Number(url.limit) || DEFAULT_PAGE_SIZE,
    sort: url.sort,
    filters,
    searchInput,
    setSearchInput,
    setPage: (page: number) => setUrl({ page: String(page) }),
    setLimit: (limit: number) => setUrl({ limit: String(limit), page: '1' }),
    setSort: (sort: string) => setUrl({ sort, page: '1' }),
    setFilter: (key: keyof F, value: string) => setUrl({ [key as string]: value, page: '1' }),
    hasActiveFilters: Boolean(url.search) || Object.keys(filterDefaults).some((k) => url[k] !== filterDefaults[k]),
    clearFilters: () => {
      setSearchInput('')
      setUrl({ search: '', page: '1', ...filterDefaults })
    },
  }
}
