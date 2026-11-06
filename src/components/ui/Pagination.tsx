import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import Dropdown from './Dropdown'

type PaginationProps = {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  pageSizes?: number[]
}

/** Page numbers with ellipsis: 1 … 4 5 6 … 12 */
function pageItems(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const items: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push('…')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push('…')
  items.push(totalPages)
  return items
}

export default function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  pageSizes = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const btn =
    'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-gray-500" data-testid="pagination-summary">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex items-center gap-3">
        {onLimitChange && (
          <div className="w-36">
            <Dropdown
              value={String(limit)}
              onChange={(v) => onLimitChange(Number(v))}
              options={pageSizes.map((s) => ({ label: `${s} / page`, value: String(s) }))}
            />
          </div>
        )}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className={cn(btn, 'hover:bg-gray-100')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageItems(page, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`e${i}`} className="px-1 text-sm text-gray-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(btn, item === page ? 'bg-gray-900 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100')}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(btn, 'hover:bg-gray-100')}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
