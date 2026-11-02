import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ChipOption = {
  label: string
  value: string
}

type ChipFilterProps = {
  options: ChipOption[]
  value: string[]
  onChange: (value: string[]) => void
  /** Allow only one selected chip at a time. */
  single?: boolean
}

export default function ChipFilter({
  options,
  value,
  onChange,
  single = false,
}: ChipFilterProps) {
  const toggle = (val: string) => {
    if (single) {
      onChange(value.includes(val) ? [] : [val])
      return
    }
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
