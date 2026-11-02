import { useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useClickOutside } from '../../hooks/useClickOutside'

export type DropdownOption = {
  label: string
  value: string
}

type DropdownProps = {
  options: DropdownOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const selected = options.find((o) => o.value === value)

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
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-colors hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-60',
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
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                      isSelected ? 'font-medium text-gray-900' : 'text-gray-700',
                    )}
                  >
                    {opt.label}
                    {isSelected && <Check className="h-4 w-4 text-gray-900" />}
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
