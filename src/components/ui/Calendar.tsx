import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  MONTHS,
  WEEKDAYS,
  addMonths,
  formatDate,
  getMonthGrid,
  isBetween,
  isSameDay,
} from '../../lib/date'

type CalendarProps = {
  /** Single-select mode */
  selected?: Date | null
  /** Range-select mode */
  rangeStart?: Date | null
  rangeEnd?: Date | null
  onSelect: (date: Date) => void
}

export default function Calendar({
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
}: CalendarProps) {
  const [view, setView] = useState<Date>(
    selected ?? rangeStart ?? new Date(),
  )

  const grid = getMonthGrid(view)

  return (
    <div className="w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, -1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {grid.map((day) => {
          const inMonth = day.getMonth() === view.getMonth()
          const isStart = isSameDay(day, rangeStart ?? null)
          const isEnd = isSameDay(day, rangeEnd ?? null)
          const isSingle = isSameDay(day, selected ?? null)
          const inRange =
            rangeStart && rangeEnd
              ? isBetween(day, rangeStart, rangeEnd)
              : false
          const isEdge = isStart || isEnd || isSingle

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative',
                inRange && 'bg-gray-100',
                isStart && rangeEnd && 'rounded-l-full bg-gray-100',
                isEnd && 'rounded-r-full bg-gray-100',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-label={formatDate(day)}
                aria-pressed={isEdge}
                className={cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  !inMonth && 'text-gray-300',
                  inMonth && !isEdge && 'text-gray-700 hover:bg-gray-100',
                  isEdge && 'bg-gray-900 font-semibold text-white',
                )}
              >
                {day.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
