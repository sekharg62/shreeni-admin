import { useState } from 'react'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Button from '../../components/ui/Button'
import Table, { type Column } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import IconButton from '../../components/ui/IconButton'
import CopyCell from '../../components/ui/CopyCell'
import ChipFilter from '../../components/ui/ChipFilter'
import Switch from '../../components/ui/Switch'
import ErrorBox from '../../components/ui/ErrorBox'
import CollectionFormModal from './CollectionFormModal'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { collectionService, getApiErrorMessage } from '../../services'
import { formatDay } from '../../lib/formErrors'
import type { Collection, CollectionWithCount } from '../../types'

const SORT_OPTIONS = [SORT_PRESETS.newest, SORT_PRESETS.oldest, SORT_PRESETS.nameAsc, SORT_PRESETS.nameDesc]
const ACTIVE_FILTER = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
]

export default function CollectionsPage() {
  const list = useListParams({ sort: 'createdAt:desc', filters: { isActive: '' } })
  const { data, loading, error, refetch, setData } = useApi(
    () => collectionService.list(list.query),
    [list.queryKey],
  )
  const [editing, setEditing] = useState<Collection | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const openForm = (c: Collection | null) => {
    setEditing(c)
    setFormOpen(true)
  }

  /** Flip immediately; undo if the save fails. */
  const toggleActive = async (c: CollectionWithCount, isActive: boolean) => {
    const apply = (value: boolean) =>
      setData((prev) =>
        prev ? { ...prev, data: prev.data.map((x) => (x.id === c.id ? { ...x, isActive: value } : x)) } : prev!,
      )
    apply(isActive)
    try {
      await collectionService.setActive(c.id, isActive)
      toast.success(`“${c.name}” is now ${isActive ? 'active' : 'inactive'}`)
    } catch (err) {
      apply(!isActive)
      toast.error(getApiErrorMessage(err))
    }
  }

  const remove = async (c: CollectionWithCount) => {
    const used = c._count.products
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      message: used
        ? `${used} product${used === 1 ? ' is' : 's are'} in this collection. The products stay — only the grouping is removed.`
        : "This can't be undone.",
      danger: true,
    })
    if (!ok) return
    try {
      await collectionService.remove(c.id)
      toast.success('Collection deleted')
      if (data && data.data.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<CollectionWithCount>[] = [
    {
      header: 'Collection',
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{c.name}</p>
          {c.description && <p className="max-w-md truncate text-xs text-gray-500">{c.description}</p>}
        </div>
      ),
    },
    { header: 'Slug', cell: (c) => <CopyCell value={c.slug} className="text-gray-600" /> },
    { header: 'Products', align: 'right', cell: (c) => c._count.products },
    {
      header: 'Active',
      cell: (c) => (
        <div onClick={(e) => e.stopPropagation()} data-testid={`active-${c.slug}`}>
          <Switch checked={c.isActive} onChange={(on) => void toggleActive(c, on)} />
        </div>
      ),
    },
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
        title="Collections"
        description="Hand-picked groups for campaigns, e.g. “Diwali Edit” or “Wedding Season”."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Collections' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New collection
          </Button>
        }
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search collections…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={list.hasActiveFilters}
        onClear={list.clearFilters}
        filters={
          <ChipFilter
            single
            options={ACTIVE_FILTER}
            value={list.filters.isActive ? [list.filters.isActive] : []}
            onChange={(v) => list.setFilter('isActive', v[0] ?? '')}
          />
        }
      />

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <TableSkeleton columns={6} />
      ) : data && data.data.length === 0 ? (
        list.hasActiveFilters ? (
          <EmptyState title="No collections match" description="Try a different search or filter." icon={Layers} />
        ) : (
          <EmptyState
            title="No collections yet"
            description="Group products for festivals, weddings or seasonal campaigns."
            icon={Layers}
            action={<Button onClick={() => openForm(null)}>Create your first collection</Button>}
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

      <CollectionFormModal
        open={formOpen}
        collection={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
