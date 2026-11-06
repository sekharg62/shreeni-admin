import { HEX_COLOR_REGEX } from '../../lib/validators'
import { cn } from '../../lib/cn'
import Input from './Input'

/** Store brand palette offered as one-click presets. */
export const COLOR_PRESETS = [
  '#650f25', '#b88646', '#32151b', '#2e7d32', '#1e49a8',
  '#c2185b', '#f8c8d8', '#f59e0b', '#6b7280', '#000000',
]

type ColorInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
}

/** Hex text field + native color picker + preset swatches. */
export default function ColorInput({ id, label, value, onChange, error, hint }: ColorInputProps) {
  const valid = HEX_COLOR_REGEX.test(value)
  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id={id}
            label={label}
            placeholder="#b88646"
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
            error={error}
            hint={hint}
          />
        </div>
        <label
          className={cn(
            'mb-[1px] flex h-10 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-300',
            (error || hint) && 'mb-[22px]',
          )}
          title="Pick a color"
        >
          <input
            type="color"
            aria-label={`${label} picker`}
            value={valid && value.length === 7 ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Use ${c}`}
            className={cn(
              'h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110',
              value.toLowerCase() === c && 'ring-2 ring-gray-900 ring-offset-2',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}
