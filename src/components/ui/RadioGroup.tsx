import { useId } from 'react'
import { cn } from '../../lib/cn'

export type RadioOption = {
  label: string
  value: string
  disabled?: boolean
}

type RadioGroupProps = {
  name?: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  orientation?: 'vertical' | 'horizontal'
}

export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
}: RadioGroupProps) {
  const autoName = useId()
  const groupName = name ?? autoName

  return (
    <div
      role="radiogroup"
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      )}
    >
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'inline-flex items-center gap-2 select-none',
              opt.disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer',
            )}
          >
            <span className="relative inline-flex h-5 w-5 items-center justify-center">
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={checked}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <span className="h-5 w-5 rounded-full border border-gray-300 bg-white transition-colors peer-checked:border-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900/20" />
              <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-gray-900 opacity-0 peer-checked:opacity-100" />
            </span>
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}
