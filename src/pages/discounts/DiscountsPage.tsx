import { useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
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
import Badge from '../../components/ui/Badge'
import ErrorBox from '../../components/ui/ErrorBox'
import DiscountFormModal from './DiscountFormModal'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { discountService, getApiErrorMessage } from '../../services'
import { formatPaise } from '../../lib/money'
import { DISCOUNT_STATE, discountState, offerLabel, validityLabel } from '../../lib/discount'
import { DiscountType } from '../../constants/enums'
import type { Discount, DiscountWithCount } from '../../types/models'

const SORT_OPTIONS = [
  SORT_PRESETS.newest,
  SORT_PRESETS.oldest,
  { label: 'Code A → Z', value: 'code:asc' },
  { label: 'Ending soonest', value: 'endsAt:asc' },
]
const TYPE_FILTER = [
  { label: '% off', value: DiscountType.PERCENTAGE },
  { label: '₹ off', value: DiscountType.FLAT },
]
const ACTIVE_FILTER = [
  { label: 'Active', value: 'true' },
  { label: 'Paused', value: 'false' },
]

export default function DiscountsPage() {
  const list = useListParams({ sort: 'createdAt:desc', filters: { type: '', isActive: '' } })
  const { data, loading, error, refetch, setData } = useApi(() => discountService.list(list.query), [list.queryKey])
  const [editing, setEditing] = useState<Discount | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const openForm = (d: Discount | null) => {
    setEditing(d)
    setFormOpen(true)
  }

  const toggleActive = async (d: DiscountWithCount, isActive: boolean) => {
    const apply = (value: boolean) =>
      setData((prev) => (prev ? { ...prev, data: prev.data.map((x) => (x.id === d.id ? { ...x, isActive: value } : x)) } : prev!))
    apply(isActive)
    try {
      await discountService.setActive(d.id, isActive)
      toast.success(`${d.code} ${isActive ? 'is active' : 'is paused'}`)
    } catch (err) {
      apply(!isActive)
      toast.error(getApiErrorMessage(err))
    }
  }

  const remove = async (d: DiscountWithCount) => {
    const used = d._count.orders
    const ok = await confirm({
      title: `Delete ${d.code}?`,
      message: used
        ? `${used} order${used === 1 ? '' : 's'} used this code. Those orders keep their discount — the code just can't be used again. To stop it temporarily, pause it instead.`
        : "Shoppers won't be able to use this code. This can't be undone.",
      danger: true,
    })
    if (!ok) return
    try {
      await discountService.remove(d.id)
      toast.success('Discount deleted')
      if (data && data.data.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<DiscountWithCount>[] = [
    {
      header: 'Code',
      cell: (d) => (
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <CopyCell value={d.code} className="font-mono font-semibold tracking-wide text-gray-900" />
          {d.description && <p className="max-w-[220px] truncate text-xs text-gray-500">{d.description}</p>}
        </div>
      ),
    },
    {
      header: 'Offer',
      cell: (d) => (
        <div>
          <p className="font-medium text-gray-900">{offerLabel(d.type, d.value)}</p>
          {d.type === DiscountType.PERCENTAGE && d.maxDiscountAmount && (
            <p className="text-xs text-gray-500">max {formatPaise(d.maxDiscountAmount)}</p>
          )}
        </div>
      ),
    },
    { header: 'Min. order', cell: (d) => (d.minOrderValue ? formatPaise(d.minOrderValue) : <span className="text-gray-400">None</span>) },
    {
      header: 'Used',
      cell: (d) => {
        const pct = d.usageLimit ? Math.min(100, (d.usedCount / d.usageLimit) * 100) : 0
        return (
          <div className="w-24">
            <p className="text-sm">
              {d.usedCount}
              <span className="text-gray-400"> / {d.usageLimit ?? '∞'}</span>
            </p>
            {d.usageLimit && (
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        )
      },
    },
    { header: 'Valid', cell: (d) => <span className="whitespace-nowrap text-gray-600">{validityLabel(d.startsAt, d.endsAt)}</span> },
    {
      header: 'Status',
      cell: (d) => {
        const s = DISCOUNT_STATE[discountState(d)]
        return <Badge variant={s.badge}>{s.label}</Badge>
      },
    },
    {
      header: 'Active',
      cell: (d) => (
        <div onClick={(e) => e.stopPropagation()} data-testid={`active-${d.code}`}>
          <Switch checked={d.isActive} onChange={(on) => void toggleActive(d, on)} />
        </div>
      ),
    },
    {
      header: '',
      align: 'right',
      cell: (d) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Pencil} label="Edit" onClick={() => openForm(d)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(d)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Coupon codes shoppers enter at checkout."
        breadcrumbs={[{ label: 'Marketing' }, { label: 'Discounts' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New discount
          </Button>
        }
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search codes…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={list.hasActiveFilters}
        onClear={list.clearFilters}
        filters={
          <>
            <ChipFilter
              single
              options={TYPE_FILTER}
              value={list.filters.type ? [list.filters.type] : []}
              onChange={(v) => list.setFilter('type', v[0] ?? '')}
            />
            <span className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />
            <ChipFilter
              single
              options={ACTIVE_FILTER}
              value={list.filters.isActive ? [list.filters.isActive] : []}
              onChange={(v) => list.setFilter('isActive', v[0] ?? '')}
            />
          </>
        }
      />

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <TableSkeleton columns={7} />
      ) : data && data.data.length === 0 ? (
        list.hasActiveFilters ? (
          <EmptyState title="No discounts match" description="Try a different search or filter." icon={TicketPercent} />
        ) : (
          <EmptyState
            title="No discount codes yet"
            description="Create a code like DIWALI20 for a festival, or WELCOME10 for first orders."
            icon={TicketPercent}
            action={<Button onClick={() => openForm(null)}>Create your first discount</Button>}
          />
        )
      ) : data ? (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table columns={columns} data={data.data} rowKey={(d) => d.id} onRowClick={openForm} />
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

      <DiscountFormModal
        open={formOpen}
        discount={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
