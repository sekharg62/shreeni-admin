import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, ShoppingCart } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Tabs from '../../components/ui/Tabs'
import Table, { type Column } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Checkbox from '../../components/ui/Checkbox'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import DateRangePicker from '../../components/ui/DateRangePicker'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useListParams } from '../../hooks/useListParams'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, orderService } from '../../services'
import { ORDER_STATUS_LABELS, type OrderStatus } from '../../constants/enums'
import { formatDateTime, timeAgo } from '../../lib/date'
import { formatPaise } from '../../lib/money'
import type { AdminOrderListItem } from '../../types/models'
import { formatPhone, spacedOrderNumber } from './orderEvents'

/** Work queue order: what needs doing first. */
const TAB_ORDER = ['ALL', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'PENDING', 'CANCELLED', 'RETURNED'] as const
type Tab = (typeof TAB_ORDER)[number]

const TAB_LABEL: Record<Tab, string> = {
  ALL: 'All',
  CONFIRMED: 'To pack',
  PACKED: 'To ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  PENDING: 'Awaiting payment',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
}

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'createdAt:desc' },
  { label: 'Oldest first', value: 'createdAt:asc' },
  { label: 'Highest total', value: 'grandTotal:desc' },
  { label: 'Lowest total', value: 'grandTotal:asc' },
]

const EMPTY_TEXT: Partial<Record<Tab, { title: string; description: string }>> = {
  ALL: { title: 'No orders yet', description: 'Orders placed on the storefront show up here.' },
  CONFIRMED: { title: 'Nothing to pack', description: 'New paid orders that need packing show up here.' },
  PACKED: { title: 'Nothing to ship', description: 'Packed orders waiting for the courier show up here.' },
}

/** Date ⇄ "YYYY-MM-DD" (local calendar day). */
const toDay = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''
const fromDay = (s: string) => (s ? new Date(`${s}T00:00:00`) : null)

/** Most labels in one download (same limit as the server). */
const MAX_LABELS = 100

/** Statuses that normally still need a parcel label. */
const NEEDS_LABEL: readonly OrderStatus[] = ['CONFIRMED', 'PACKED']

/** A failed PDF request carries its JSON error as a Blob: read the server's message out of it. */
async function blobErrorMessage(err: unknown): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: unknown }
      if (typeof body.message === 'string') return body.message
    } catch {
      /* not JSON */
    }
  }
  return getApiErrorMessage(err)
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const columns: Column<AdminOrderListItem>[] = [
  {
    header: 'Order',
    cell: (o) => (
      <div>
        <p className="font-mono text-sm font-semibold text-gray-900">{spacedOrderNumber(o.orderNumber)}</p>
        <p className="text-xs text-gray-500" title={formatDateTime(o.createdAt)}>
          {timeAgo(o.createdAt)}
        </p>
      </div>
    ),
  },
  {
    header: 'Customer',
    cell: (o) => (
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
          {o.shipReceiverName}
          {o.isGuest && <Badge>Guest</Badge>}
        </p>
        <p className="text-xs text-gray-500">
          {formatPhone(o.contactPhone)} · {o.shipCity}
        </p>
      </div>
    ),
  },
  { header: 'Items', align: 'center', cell: (o) => <span className="text-sm text-gray-700">{o.itemCount}</span> },
  {
    header: 'Total',
    align: 'right',
    cell: (o) => (
      <div>
        <p className="text-sm font-semibold text-gray-900">{formatPaise(o.grandTotal)}</p>
        {o.discountCode && <p className="font-mono text-[11px] text-green-700">{o.discountCode}</p>}
      </div>
    ),
  },
  { header: 'Payment', cell: (o) => (o.payment ? <PaymentStatusBadge status={o.payment.status} /> : <span className="text-gray-400">—</span>) },
  { header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const list = useListParams({ sort: 'createdAt:desc', filters: { status: 'ALL', from: '', to: '' } })
  const tab = (list.filters.status || 'ALL') as Tab
  const query = useMemo(() => {
    const q = { ...list.query }
    if (q.status === 'ALL') delete q.status
    return q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.queryKey])

  const orders = useApi(() => orderService.list(query), [list.queryKey])
  const counts = useApi(() => orderService.counts(), [])
  const toast = useToast()

  /** Selected orders (by id) with their status, kept across pages so labels can be batched. */
  const [selected, setSelected] = useState<Map<string, OrderStatus>>(new Map())
  const [printing, setPrinting] = useState(false)
  // A new tab/search/date range starts a fresh selection.
  useEffect(() => setSelected(new Map()), [list.filters.status, list.filters.from, list.filters.to, list.query.search])

  const c = counts.data
  const tabs = TAB_ORDER.map((value) => ({ value, label: TAB_LABEL[value], count: c ? c[value] : undefined }))
  const rows = orders.data?.data ?? []
  const filtered = Boolean(list.query.search) || Boolean(list.filters.from) || Boolean(list.filters.to)

  const allOnPage = rows.length > 0 && rows.every((o) => selected.has(o.id))
  const toggle = (o: AdminOrderListItem, on: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev)
      if (on) next.set(o.id, o.status)
      else next.delete(o.id)
      return next
    })
  const togglePage = (on: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev)
      for (const o of rows) {
        if (on) next.set(o.id, o.status)
        else next.delete(o.id)
      }
      return next
    })
  /** Selected orders that don't usually need a label (not yet paid, shipped, cancelled…). */
  const unusual = [...selected.values()].filter((s) => !NEEDS_LABEL.includes(s)).length

  const downloadLabels = async () => {
    const ids = [...selected.keys()]
    if (ids.length > MAX_LABELS) {
      toast.error(`Select up to ${MAX_LABELS} orders at a time (${ids.length} selected).`)
      return
    }
    setPrinting(true)
    try {
      const blob = await orderService.labels(ids)
      const day = new Date().toISOString().slice(0, 10)
      saveBlob(blob, `Shreeni-Shipping-Labels-${day}.pdf`)
      toast.success(`${ids.length} label${ids.length === 1 ? '' : 's'} ready to print (4 per A4 page)`)
    } catch (err) {
      toast.error(await blobErrorMessage(err))
    } finally {
      setPrinting(false)
    }
  }

  const selectColumn: Column<AdminOrderListItem> = {
    header: (
      <Checkbox
        aria-label="Select all orders on this page"
        checked={allOnPage}
        onChange={(e) => togglePage(e.target.checked)}
      />
    ),
    className: 'w-10',
    // Clicking the box must not open the order (the row itself is a link).
    cell: (o) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox aria-label={`Select order ${o.orderNumber}`} checked={selected.has(o.id)} onChange={(e) => toggle(o, e.target.checked)} />
      </div>
    ),
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description={
          c
            ? `Today: ${c.today.orders} paid order${c.today.orders === 1 ? '' : 's'} · ${formatPaise(c.today.revenue)}`
            : 'Every order from the storefront.'
        }
        breadcrumbs={[{ label: 'Orders' }]}
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs tabs={tabs} value={tab} onChange={(v) => list.setFilter('status', v)} />
      </div>

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Order ID, name, phone or email…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={filtered}
        onClear={() => {
          list.setSearchInput('')
          list.setFilters({ from: '', to: '' })
        }}
        filters={
          <div className="w-full sm:w-64">
            <DateRangePicker
              placeholder="Any date"
              value={{ start: fromDay(list.filters.from), end: fromDay(list.filters.to) }}
              onChange={(r) => list.setFilters({ from: toDay(r.start), to: toDay(r.end ?? r.start) })}
            />
          </div>
        }
      />

      {orders.error ? (
        <ErrorBox message={orders.error} onRetry={orders.refetch} />
      ) : orders.loading && !orders.data ? (
        <TableSkeleton columns={6} />
      ) : rows.length === 0 ? (
        filtered ? (
          <EmptyState title="No orders match" description="Try a different search or date range." icon={ShoppingCart} />
        ) : (
          <EmptyState
            {...(EMPTY_TEXT[tab] ?? {
              title: `No ${ORDER_STATUS_LABELS[tab as OrderStatus].toLowerCase()} orders`,
              description: 'Orders with this status show up here.',
            })}
            icon={ShoppingCart}
          />
        )
      ) : (
        <div className={orders.loading ? 'opacity-60 transition-opacity' : undefined}>
          {selected.size > 0 && (
            <div
              className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-900 bg-gray-900 px-4 py-2.5 text-white"
              data-testid="orders-bulk-bar"
            >
              <span className="text-sm font-medium">
                {selected.size} order{selected.size === 1 ? '' : 's'} selected
              </span>
              {unusual > 0 && (
                <span className="text-xs text-amber-300">
                  {unusual} not “To pack” / “To ship”: check before printing
                </span>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  isLoading={printing}
                  onClick={() => void downloadLabels()}
                >
                  Download shipping labels
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setSelected(new Map())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
          <Table
            columns={[selectColumn, ...columns]}
            data={rows}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/orders/${o.id}`)}
            isRowSelected={(o) => selected.has(o.id)}
          />
          {orders.data && (
            <div className="mt-4">
              <Pagination
                page={orders.data.meta.page}
                limit={orders.data.meta.limit}
                total={orders.data.meta.total}
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
