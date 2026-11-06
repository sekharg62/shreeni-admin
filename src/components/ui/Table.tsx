import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/cn'

export type Column<T> = {
  /** Header label (or a control, e.g. a select-all checkbox) */
  header: ReactNode
  /** Cell renderer */
  cell: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  /** Provide to make this column sortable. Return the value to sort by. */
  sortValue?: (row: T) => string | number
}

type SortState = { index: number; dir: 'asc' | 'desc' } | null

type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Highlight a row (e.g. selected with a checkbox). */
  isRowSelected?: (row: T) => boolean
}

const alignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export default function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = 'No data',
  isRowSelected,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)

  const toggleSort = (index: number) => {
    setSort((prev) => {
      if (!prev || prev.index !== index) return { index, dir: 'asc' }
      if (prev.dir === 'asc') return { index, dir: 'desc' }
      return null // third click clears sorting
    })
  }

  const sortedData = useMemo(() => {
    if (!sort) return data
    const col = columns[sort.index]
    if (!col?.sortValue) return data
    const accessor = col.sortValue
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
  }, [data, sort, columns])

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col, i) => {
              const sortable = !!col.sortValue
              const active = sort?.index === i
              return (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 font-semibold text-gray-600',
                    alignMap[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(i)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-gray-900',
                        active && 'text-gray-900',
                      )}
                    >
                      {col.header}
                      {!active ? (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
                      ) : sort?.dir === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-100 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50',
                  isRowSelected?.(row) && 'bg-gray-50',
                )}
              >
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={cn(
                      'px-4 py-3 text-gray-700',
                      alignMap[col.align ?? 'left'],
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
