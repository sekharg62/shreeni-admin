import { useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import Calendar from './Calendar'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/date'
import { useClickOutside } from '../../hooks/useClickOutside'

type DatePickerProps = {
  value: Date | null
  onChange: (date: Date) => void
  label?: string
  placeholder?: string
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

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
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-colors hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
            value ? 'text-gray-900' : 'text-gray-400',
          )}
        >
          <span>{value ? formatDate(value) : placeholder}</span>
          <CalendarDays className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1">
            <Calendar
              selected={value}
              onSelect={(d) => {
                onChange(d)
                setOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
