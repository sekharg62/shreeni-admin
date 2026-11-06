import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import Input from '../ui/Input'
import Dropdown, { type DropdownOption } from '../ui/Dropdown'

type ListToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  sort?: string
  sortOptions?: DropdownOption[]
  onSortChange?: (value: string) => void
  /** Extra filter controls (ChipFilter, Dropdown…) */
  filters?: ReactNode
  hasActiveFilters?: boolean
  onClear?: () => void
}

/** Search + filters + sort row above a list table. */
export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  sort,
  sortOptions,
  onSortChange,
  filters,
  hasActiveFilters,
  onClear,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="w-full lg:max-w-xs">
        <Input
          aria-label="Search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      <div className="flex items-center gap-2 lg:ml-auto">
        {hasActiveFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        {sortOptions && onSortChange && (
          <div className="w-44">
            <Dropdown value={sort ?? null} onChange={onSortChange} options={sortOptions} />
          </div>
        )}
      </div>
    </div>
  )
}
