import { Check, Slash } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Color } from '../../types/models'

type Props = {
  label: string
  colors: Color[]
  /** color id, or '' for none */
  value: string
  onChange: (id: string) => void
  /** ids that can't be picked here (e.g. the primary color in the secondary row) */
  disabledIds?: string[]
  error?: string
  allowNone?: boolean
}

/** Pick one color from the palette by its swatch. */
export default function ColorChoice({ label, colors, value, onChange, disabledIds = [], error, allowNone = true }: Props) {
  return (
    <div role="radiogroup" aria-label={label}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {allowNone && (
          <button
            type="button"
            role="radio"
            aria-checked={value === ''}
            onClick={() => onChange('')}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
              value === '' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Slash className="h-3.5 w-3.5" /> None
          </button>
        )}
        {colors.map((c) => {
          const active = c.id === value
          const disabled = disabledIds.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={c.name}
              disabled={disabled}
              onClick={() => onChange(c.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border pl-1.5 pr-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                active ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-300 hover:bg-gray-50',
              )}
            >
              <span
                className="relative flex h-6 w-6 items-center justify-center rounded-full border border-black/10"
                style={{ background: c.hexCode ?? '#e5e7eb' }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white mix-blend-difference" />}
              </span>
              {c.name}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
