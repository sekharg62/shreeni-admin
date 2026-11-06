import { Star } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Read-only 1–5 star display. */
export default function StarRating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5'
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(cls, n <= value ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200')}
        />
      ))}
    </span>
  )
}
