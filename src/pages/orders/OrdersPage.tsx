import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Tabs from '../../components/ui/Tabs'
import Table, { type Column } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import DateRangePicker from '../../components/ui/DateRangePicker'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useListParams } from '../../hooks/useListParams'
import { orderService } from '../../services'
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

  const c = counts.data
  const tabs = TAB_ORDER.map((value) => ({ value, label: TAB_LABEL[value], count: c ? c[value] : undefined }))
  const rows = orders.data?.data ?? []
  const filtered = Boolean(list.query.search) || Boolean(list.filters.from) || Boolean(list.filters.to)

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
          <Table columns={columns} data={rows} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/orders/${o.id}`)} />
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
