import { cn } from '../../lib/cn'

export type ButtonGroupOption = {
  label: string
  value: string
  disabled?: boolean
}

type ButtonGroupProps = {
  options: ButtonGroupOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

export default function ButtonGroup({
  options,
  value,
  onChange,
  size = 'md',
}: ButtonGroupProps) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              pad,
              active
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
