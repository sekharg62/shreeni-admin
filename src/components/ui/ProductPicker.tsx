import { useEffect, useRef, useState } from 'react'
import { ImageOff, Loader2, Plus, Search, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { useClickOutside } from '../../hooks/useClickOutside'
import { productService } from '../../services'
import type { ProductListItem } from '../../types/models'

export type PickedProduct = { id: string; name: string; imageUrl?: string | null }

type Props = {
  label: string
  value: PickedProduct[]
  onChange: (value: PickedProduct[]) => void
  /** never offered (e.g. the product being edited) */
  excludeId?: string
  /** also never offered (e.g. products already in another list) */
  excludeIds?: string[]
  max?: number
}

/** Search products by name/SKU and pick several (used for "You may also like"). */
export default function ProductPicker({ label, value, onChange, excludeId, excludeIds, max = 12 }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const debounced = useDebounce(query, 250)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    let stale = false
    setLoading(true)
    productService
      .list({ search: debounced || undefined, limit: 8 })
      .then((r) => !stale && setResults(r.data))
      .catch(() => !stale && setResults([]))
      .finally(() => !stale && setLoading(false))
    return () => {
      stale = true
    }
  }, [debounced, open])

  const picked = new Set([...value.map((p) => p.id), ...(excludeIds ?? [])])
  const options = results.filter((p) => p.id !== excludeId && !picked.has(p.id))
  const full = value.length >= max

  return (
    <div ref={ref}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white py-1 pl-1 pr-2 text-sm">
              <Thumb url={p.imageUrl} />
              <span className="max-w-[180px] truncate">{p.name}</span>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={query}
            disabled={full}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            placeholder={full ? `Up to ${max} products` : 'Search products to add…'}
            aria-label={`${label} search`}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
        {open && !full && (
          <ul role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {options.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-gray-400">{loading ? 'Searching…' : 'No products found'}</li>
            ) : (
              options.map((p) => (
                <li key={p.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...value, { id: p.id, name: p.name, imageUrl: p.images[0]?.url }])
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Thumb url={p.images[0]?.url} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.category.name}</span>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function Thumb({ url }: { url?: string | null }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-3.5 w-3.5 text-gray-300" />}
    </span>
  )
}
