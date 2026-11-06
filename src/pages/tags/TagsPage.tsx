import { useState } from 'react'
import { Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Button from '../../components/ui/Button'
import Table, { type Column } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import IconButton from '../../components/ui/IconButton'
import CopyCell from '../../components/ui/CopyCell'
import TagPill from '../../components/ui/TagPill'
import ErrorBox from '../../components/ui/ErrorBox'
import TagFormModal from './TagFormModal'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, tagService } from '../../services'
import { formatDay } from '../../lib/formErrors'
import type { Tag, TagWithCount } from '../../types'

const SORT_OPTIONS = [SORT_PRESETS.newest, SORT_PRESETS.oldest, SORT_PRESETS.nameAsc, SORT_PRESETS.nameDesc]

export default function TagsPage() {
  const list = useListParams({ sort: 'createdAt:desc' })
  const { data, loading, error, refetch } = useApi(() => tagService.list(list.query), [list.queryKey])
  const [editing, setEditing] = useState<Tag | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (tag: Tag) => {
    setEditing(tag)
    setFormOpen(true)
  }

  const remove = async (tag: TagWithCount) => {
    const used = tag._count.products
    const ok = await confirm({
      title: `Delete "${tag.name}"?`,
      message: used
        ? `It will be removed from ${used} product${used === 1 ? '' : 's'}. This can't be undone.`
        : "This can't be undone.",
      danger: true,
    })
    if (!ok) return
    try {
      await tagService.remove(tag.id)
      toast.success('Tag deleted')
      // If that was the last row on this page, step back a page.
      if (data && data.data.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<TagWithCount>[] = [
    { header: 'Tag', cell: (t) => <TagPill name={t.name} color={t.color} /> },
    { header: 'Slug', cell: (t) => <CopyCell value={t.slug} className="text-gray-600" /> },
    { header: 'Products', align: 'right', cell: (t) => t._count.products },
    { header: 'Updated', cell: (t) => <span className="text-gray-500">{formatDay(t.updatedAt)}</span> },
    {
      header: '',
      align: 'right',
      cell: (t) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Pencil} label="Edit" onClick={() => openEdit(t)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(t)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Badges shown on products, e.g. “Saree with blouse piece”."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Tags' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New tag
          </Button>
        }
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search tags…"
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
          <EmptyState title="No tags match" description="Try a different search." icon={TagIcon} />
        ) : (
          <EmptyState
            title="No tags yet"
            description="Create tags to highlight things like fabric or what's included."
            icon={TagIcon}
            action={<Button onClick={openCreate}>Create your first tag</Button>}
          />
        )
      ) : data ? (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table columns={columns} data={data.data} rowKey={(t) => t.id} onRowClick={openEdit} />
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

      <TagFormModal
        open={formOpen}
        tag={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
