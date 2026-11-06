import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, EyeOff, ImageOff, Package, Pencil, Plus, Send, Star, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Button from '../../components/ui/Button'
import Table, { type Column } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import IconButton from '../../components/ui/IconButton'
import Checkbox from '../../components/ui/Checkbox'
import ChipFilter from '../../components/ui/ChipFilter'
import Dropdown from '../../components/ui/Dropdown'
import ErrorBox from '../../components/ui/ErrorBox'
import Tooltip from '../../components/ui/Tooltip'
import { CatalogStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { categoryService, getApiErrorMessage, productService } from '../../services'
import { CATALOG_STATUS_LABELS, CATALOG_STATUS_OPTIONS, CatalogStatus, GENDER_OPTIONS } from '../../constants/enums'
import { discountPercent, formatPaise } from '../../lib/money'
import { flattenWithPaths } from '../../lib/categoryTree'
import { cn } from '../../lib/cn'
import type { ProductListItem } from '../../types/models'

const SORT_OPTIONS = [
  SORT_PRESETS.newest,
  SORT_PRESETS.oldest,
  SORT_PRESETS.nameAsc,
  { label: 'Price: low → high', value: 'originalPrice:asc' },
  { label: 'Price: high → low', value: 'originalPrice:desc' },
  { label: 'Recently published', value: 'publishedAt:desc' },
]
const LOW_STOCK = 3

/** Units that can still be sold (stock minus what checkouts are holding). */
const available = (p: ProductListItem) =>
  p.variants.filter((v) => v.isActive).reduce((sum, v) => sum + Math.max(0, v.stock - v.reservedStock), 0)

export default function ProductsPage() {
  const navigate = useNavigate()
  const list = useListParams({
    sort: 'createdAt:desc',
    filters: { status: '', categoryId: '', gender: '', isFeatured: '' },
  })
  const { data, loading, error, refetch, setData } = useApi(() => productService.list(list.query), [list.queryKey])
  const tree = useApi(() => categoryService.tree(), [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  useEffect(() => setSelected(new Set()), [list.queryKey])

  const categoryOptions = useMemo(
    () => [{ label: 'All categories', value: '' }, ...flattenWithPaths(tree.data ?? []).map((c) => ({ label: c.path, value: c.id }))],
    [tree.data],
  )
  const noCategories = tree.data !== undefined && tree.data.length === 0
  const rows = data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  const patchRow = (id: string, patch: Partial<ProductListItem>) =>
    setData((prev) => (prev ? { ...prev, data: prev.data.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : prev!))

  const toggleFeatured = async (p: ProductListItem) => {
    const next = !p.isFeatured
    patchRow(p.id, { isFeatured: next })
    try {
      await productService.update(p.id, { isFeatured: next })
      toast.success(next ? `“${p.name}” is featured` : `“${p.name}” is no longer featured`)
    } catch (err) {
      patchRow(p.id, { isFeatured: !next })
      toast.error(getApiErrorMessage(err))
    }
  }

  const bulkStatus = async (status: CatalogStatus) => {
    const ids = [...selected]
    if (status === CatalogStatus.DISCONTINUED) {
      const ok = await confirm({
        title: `Discontinue ${ids.length} product${ids.length === 1 ? '' : 's'}?`,
        message: 'They are hidden from the store. You can publish them again later.',
        confirmLabel: 'Discontinue',
      })
      if (!ok) return
    }
    setBulkBusy(true)
    try {
      const { updated } = await productService.setManyStatus(ids, status)
      toast.success(`${updated} product${updated === 1 ? '' : 's'} set to ${CATALOG_STATUS_LABELS[status]}`)
      setSelected(new Set())
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBulkBusy(false)
    }
  }

  const remove = async (p: ProductListItem) => {
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      message: (
        <>
          Its photos, sizes and specifications are deleted too. Past orders keep their copy of the item.
          <br />
          <span className="mt-2 block">
            To just hide it from the store, set it to <strong>Discontinued</strong> instead.
          </span>
        </>
      ),
      danger: true,
    })
    if (!ok) return
    try {
      await productService.remove(p.id)
      toast.success('Product deleted')
      if (rows.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<ProductListItem>[] = [
    {
      header: (
        <Checkbox
          aria-label="Select all on this page"
          checked={allSelected}
          onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
        />
      ),
      className: 'w-10',
      cell: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            aria-label={`Select ${p.name}`}
            checked={selected.has(p.id)}
            onChange={(e) =>
              setSelected((s) => {
                const n = new Set(s)
                if (e.target.checked) n.add(p.id)
                else n.delete(p.id)
                return n
              })
            }
          />
        </div>
      ),
    },
    {
      header: 'Product',
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
            {p.images[0] ? (
              <img src={p.images[0].url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <ImageOff className="h-4 w-4 text-gray-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-medium text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p._count.variants} size{p._count.variants === 1 ? '' : 's'} · {p._count.images} photo{p._count.images === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      ),
    },
    { header: 'Category', cell: (p) => <span className="text-gray-600">{p.category.name}</span> },
    {
      header: 'Price',
      align: 'right',
      cell: (p) =>
        p.discountPrice ? (
          <div className="whitespace-nowrap">
            <span className="font-medium text-gray-900">{formatPaise(p.discountPrice)}</span>
            <span className="ml-1.5 text-xs text-gray-400 line-through">{formatPaise(p.originalPrice)}</span>
            <span className="ml-1.5 text-xs font-semibold text-green-700">-{discountPercent(p.originalPrice, p.discountPrice)}%</span>
          </div>
        ) : (
          <span className="font-medium text-gray-900">{formatPaise(p.originalPrice)}</span>
        ),
    },
    {
      header: 'Stock',
      align: 'right',
      cell: (p) => {
        const n = available(p)
        return (
          <span
            className={cn(
              'whitespace-nowrap font-medium',
              n === 0 ? 'text-red-600' : n <= LOW_STOCK ? 'text-amber-600' : 'text-gray-900',
            )}
          >
            {n === 0 ? 'Out of stock' : n}
          </span>
        )
      },
    },
    { header: 'Status', cell: (p) => <CatalogStatusBadge status={p.status} /> },
    {
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip content={p.isFeatured ? 'Featured on the homepage — click to remove' : 'Feature on the homepage'}>
            <button
              type="button"
              aria-label={p.isFeatured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
              aria-pressed={p.isFeatured}
              onClick={() => void toggleFeatured(p)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
            >
              <Star className={cn('h-4 w-4', p.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-gray-400')} />
            </button>
          </Tooltip>
          <IconButton icon={Pencil} label="Edit" onClick={() => navigate(`/products/${p.id}`)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(p)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        description="Every saree in the store, with its sizes, photos and stock."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Products' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/products/new')} disabled={noCategories}>
            New product
          </Button>
        }
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search name or SKU…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={list.hasActiveFilters}
        onClear={list.clearFilters}
        filters={
          <>
            <div className="w-48">
              <Dropdown options={categoryOptions} value={list.filters.categoryId} onChange={(v) => list.setFilter('categoryId', v)} />
            </div>
            <div className="w-36">
              <Dropdown
                options={[{ label: 'Any gender', value: '' }, ...GENDER_OPTIONS]}
                value={list.filters.gender}
                onChange={(v) => list.setFilter('gender', v)}
              />
            </div>
            <ChipFilter
              single
              options={CATALOG_STATUS_OPTIONS}
              value={list.filters.status ? [list.filters.status] : []}
              onChange={(v) => list.setFilter('status', v[0] ?? '')}
            />
            <ChipFilter
              single
              options={[{ label: '★ Featured', value: 'true' }]}
              value={list.filters.isFeatured ? [list.filters.isFeatured] : []}
              onChange={(v) => list.setFilter('isFeatured', v[0] ?? '')}
            />
          </>
        }
      />

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-4 py-2.5 text-white" data-testid="bulk-bar">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Send className="h-3.5 w-3.5" />} disabled={bulkBusy} onClick={() => void bulkStatus(CatalogStatus.PUBLISHED)}>
              Publish
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<EyeOff className="h-3.5 w-3.5" />} disabled={bulkBusy} onClick={() => void bulkStatus(CatalogStatus.UNPUBLISHED)}>
              Unpublish
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<Archive className="h-3.5 w-3.5" />} disabled={bulkBusy} onClick={() => void bulkStatus(CatalogStatus.DISCONTINUED)}>
              Discontinue
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <TableSkeleton columns={7} />
      ) : rows.length === 0 ? (
        list.hasActiveFilters ? (
          <EmptyState title="No products match" description="Try a different search or filter." icon={Package} />
        ) : noCategories ? (
          <EmptyState
            title="Create a category first"
            description="Every product belongs to a category (e.g. Jamdani or Baluchori)."
            icon={Package}
            action={
              <Link to="/categories">
                <Button>Go to Categories</Button>
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No products yet"
            description="Add your first saree with its photos, price, sizes and details."
            icon={Package}
            action={<Button onClick={() => navigate('/products/new')}>Create your first product</Button>}
          />
        )
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table
            columns={columns}
            data={rows}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/products/${p.id}`)}
            isRowSelected={(p) => selected.has(p.id)}
          />
          {data && (
            <div className="mt-4">
              <Pagination
                page={data.meta.page}
                limit={data.meta.limit}
                total={data.meta.total}
                onPageChange={list.setPage}
                onLimitChange={list.setLimit}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
