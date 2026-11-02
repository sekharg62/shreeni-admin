import { useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useClickOutside } from '../../hooks/useClickOutside'

export type MultiSelectOption = {
  label: string
  value: string
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  placeholder?: string
}

export default function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const toggle = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    )
  }

  const selected = options.filter((o) => value.includes(o.value))

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
          className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition-colors hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selected.map((o) => (
                <span
                  key={o.value}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {o.label}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(o.value)
                    }}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))
            )}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-gray-500 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-multiselectable
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.map((opt) => {
              const checked = value.includes(opt.value)
              return (
                <li key={opt.value} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          checked
                            ? 'border-gray-900 bg-gray-900'
                            : 'border-gray-300',
                        )}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {opt.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
