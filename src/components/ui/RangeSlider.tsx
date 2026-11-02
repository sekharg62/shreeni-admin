import { cn } from '../../lib/cn'

type RangeSliderProps = {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  label?: string
  /** Formats each thumb's displayed value, e.g. (v) => `₹${v}`. */
  format?: (value: number) => string
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format = (v) => String(v),
}: RangeSliderProps) {
  const [low, high] = value
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const setLow = (next: number) => onChange([Math.min(next, high), high])
  const setHigh = (next: number) => onChange([low, Math.max(next, low)])

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">
            {format(low)} – {format(high)}
          </span>
        </div>
      )}

      <div className="relative h-5">
        {/* Track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200" />
        {/* Selected range fill */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-900"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        {/* Two thumbs */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => setLow(Number(e.target.value))}
          className={cn('range-thumb', 'absolute inset-x-0 top-0 h-5 w-full')}
          aria-label="Minimum"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => setHigh(Number(e.target.value))}
          className={cn('range-thumb', 'absolute inset-x-0 top-0 h-5 w-full')}
          aria-label="Maximum"
        />
      </div>
    </div>
  )
}
