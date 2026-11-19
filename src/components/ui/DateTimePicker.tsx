import { useRef, useState, type KeyboardEvent } from 'react'
import { CalendarClock, X } from 'lucide-react'
import Calendar from './Calendar'
import { cn } from '../../lib/cn'
import { useClickOutside } from '../../hooks/useClickOutside'

type DateTimePickerProps = {
  value: Date | null
  /** null when cleared. */
  onChange: (date: Date | null) => void
  label?: string
  placeholder?: string
  /** Minute step in the time list (default 5). */
  minuteStep?: number
  /** Quick-pick buttons (default: Now, Tomorrow 9 AM, Next Monday 9 AM). Pass [] to hide. */
  presets?: { label: string; get: () => Date }[]
  /** Show a × button to clear the value. */
  clearable?: boolean
  id?: string
}

const display = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

/** Next day-of-week (0 = Sunday) at h:00, always in the future. */
const nextAt = (days: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}
const DEFAULT_PRESETS = [
  { label: 'Now', get: () => new Date() },
  { label: 'Tomorrow, 9 AM', get: () => nextAt(1, 9) },
  {
    label: 'Next Monday, 9 AM',
    get: () => nextAt(((8 - new Date().getDay()) % 7) || 7, 9),
  },
]

/** e.g. "India Standard Time" — the admin's own timezone, which every time here uses. */
const zoneName = () =>
  new Intl.DateTimeFormat('en-IN', { timeZoneName: 'long' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? 'Local time'

const pad = (n: number) => String(n).padStart(2, '0')
const selectCls =
  'h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm tabular-nums text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10'

/** Date + time in one field: calendar, hour/minute/AM-PM and quick presets. Times are in the admin's local timezone. */
export default function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date and time',
  minuteStep = 5,
  presets = DEFAULT_PRESETS,
  clearable = true,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  // Time shown in the panel: the value's, or 9:00 AM before a date is chosen.
  const hours24 = value ? value.getHours() : 9
  const minutes = value ? value.getMinutes() : 0
  const pm = hours24 >= 12
  const hour12 = hours24 % 12 || 12

  const minuteOptions = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
  if (!minuteOptions.includes(minutes)) minuteOptions.push(minutes)
  minuteOptions.sort((a, b) => a - b)

  /** Change part of the value; starts from today when empty. */
  const update = (patch: { date?: Date; hour12?: number; minute?: number; pm?: boolean }) => {
    const base = patch.date ?? value ?? new Date()
    const h12 = patch.hour12 ?? hour12
    const isPm = patch.pm ?? pm
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), (h12 % 12) + (isPm ? 12 : 0), patch.minute ?? minutes, 0, 0)
    onChange(next)
  }

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      close()
    }
  }

  return (
    <div className="w-full" ref={ref} onKeyDown={onKeyDown}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-gray-300 bg-white pl-3 text-left text-sm transition-colors hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
            clearable && value ? 'pr-9' : 'pr-3',
            value ? 'text-gray-900' : 'text-gray-400',
          )}
        >
          <CalendarClock className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="truncate">{value ? display.format(value) : placeholder}</span>
        </button>
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date and time"
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {open && (
          <div role="dialog" aria-label={label ?? 'Choose date and time'} className="absolute left-0 z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-gray-100 p-3">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onChange(p.get())}
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar has its own border/shadow; strip them inside the panel. */}
            <div className="[&>div]:w-full [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
              <Calendar key={value ? `${value.getFullYear()}-${value.getMonth()}` : 'empty'} selected={value} onSelect={(d) => update({ date: d })} />
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-3">
              <span className="mr-auto text-xs font-medium uppercase tracking-wider text-gray-500">Time</span>
              <select aria-label="Hour" className={selectCls} value={hour12} onChange={(e) => update({ hour12: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-gray-400">:</span>
              <select aria-label="Minute" className={selectCls} value={minutes} onChange={(e) => update({ minute: Number(e.target.value) })}>
                {minuteOptions.map((m) => (
                  <option key={m} value={m}>
                    {pad(m)}
                  </option>
                ))}
              </select>
              <div role="group" aria-label="AM or PM" className="flex overflow-hidden rounded-lg border border-gray-300 text-xs font-semibold">
                {(['AM', 'PM'] as const).map((p) => {
                  const active = (p === 'PM') === pm
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ pm: p === 'PM' })}
                      className={cn('h-9 px-2.5', active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2.5">
              <span className="text-xs text-gray-500">{zoneName()}</span>
              <button type="button" onClick={close} className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
