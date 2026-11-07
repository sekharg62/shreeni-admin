export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isBetween(day: Date, start: Date, end: Date): boolean {
  const t = stripTime(day).getTime()
  return t > stripTime(start).getTime() && t < stripTime(end).getTime()
}

export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

/** Returns the 42 cells (6 weeks) for a month grid, including leading/trailing days. */
export function getMonthGrid(viewDate: Date): Date[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday
  const start = new Date(year, month, 1 - firstDay)
  return Array.from({ length: 42 }, (_, i) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  })
}

export function formatDate(d: Date | null): string {
  if (!d) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

const relFmt = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "6 Nov 2026, 3:45 pm" */
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

/** "just now", "12 minutes ago", "yesterday", "3 days ago", then a date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return relFmt.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relFmt.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86400) return relFmt.format(Math.round(seconds / 86400), 'day')
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}
