import { useState } from 'react'
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Button from '../../components/ui/Button'
import Table, { type Column } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import IconButton from '../../components/ui/IconButton'
import CopyCell from '../../components/ui/CopyCell'
import ColorSwatch from '../../components/ui/ColorSwatch'
import ErrorBox from '../../components/ui/ErrorBox'
import ColorFormModal from './ColorFormModal'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { colorService, getApiErrorMessage } from '../../services'
import { formatDay } from '../../lib/formErrors'
import type { Color, ColorWithCount } from '../../types'

const SORT_OPTIONS = [SORT_PRESETS.newest, SORT_PRESETS.oldest, SORT_PRESETS.nameAsc, SORT_PRESETS.nameDesc]

export default function ColorsPage() {
  const list = useListParams({ sort: 'name:asc' })
  const { data, loading, error, refetch } = useApi(() => colorService.list(list.query), [list.queryKey])
  const [editing, setEditing] = useState<Color | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const openForm = (color: Color | null) => {
    setEditing(color)
    setFormOpen(true)
  }

  const remove = async (color: ColorWithCount) => {
    const used = color._count.products
    const ok = await confirm({
      title: `Delete "${color.name}"?`,
      message: used
        ? `${used} product${used === 1 ? ' uses' : 's use'} this color — it will be removed from them.`
        : "This can't be undone.",
      danger: true,
    })
    if (!ok) return
    try {
      await colorService.remove(color.id)
      toast.success('Color deleted')
      if (data && data.data.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<ColorWithCount>[] = [
    {
      header: 'Color',
      cell: (c) => (
        <span className="flex items-center gap-3">
          <ColorSwatch color={c.hexCode} />
          <span className="font-medium text-gray-900">{c.name}</span>
        </span>
      ),
    },
    {
      header: 'Hex',
      cell: (c) => (c.hexCode ? <CopyCell value={c.hexCode} className="font-mono text-gray-600" /> : <span className="text-gray-400">—</span>),
    },
    { header: 'Products', align: 'right', cell: (c) => c._count.products },
    { header: 'Updated', cell: (c) => <span className="text-gray-500">{formatDay(c.updatedAt)}</span> },
    {
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Pencil} label="Edit" onClick={() => openForm(c)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(c)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Colors"
        description="Palette used for each product's primary and secondary color."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Colors' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New color
          </Button>
        }
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search colors…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={list.hasActiveFilters}
        onClear={list.clearFilters}
      />

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <TableSkeleton columns={5} />
      ) : data && data.data.length === 0 ? (
        list.hasActiveFilters ? (
          <EmptyState title="No colors match" description="Try a different search." icon={Palette} />
        ) : (
          <EmptyState
            title="No colors yet"
            description="Add the colors you use, so products can be filtered by color."
            icon={Palette}
            action={<Button onClick={() => openForm(null)}>Add your first color</Button>}
          />
        )
      ) : data ? (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table columns={columns} data={data.data} rowKey={(c) => c.id} onRowClick={openForm} />
          <div className="mt-4">
            <Pagination
              page={data.meta.page}
              limit={data.meta.limit}
              total={data.meta.total}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
            />
          </div>
        </div>
      ) : null}

      <ColorFormModal
        open={formOpen}
        color={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
