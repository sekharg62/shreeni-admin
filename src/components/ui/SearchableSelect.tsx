import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useClickOutside } from '../../hooks/useClickOutside'

export type SelectOption = {
  label: string
  value: string
}

type SearchableSelectProps = {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(
    ref,
    () => {
      setOpen(false)
      setQuery('')
    },
    open,
  )

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-colors hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
            selected ? 'text-gray-900' : 'text-gray-400',
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-gray-500 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
            <ul role="listbox" className="max-h-56 overflow-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-center text-sm text-gray-400">
                  No results
                </li>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                          isSelected
                            ? 'font-medium text-gray-900'
                            : 'text-gray-700',
                        )}
                      >
                        {opt.label}
                        {isSelected && (
                          <Check className="h-4 w-4 text-gray-900" />
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
