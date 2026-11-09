import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, ChevronDown, Copy, MapPin, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Table, { type Column } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton, { TableSkeleton } from '../../components/ui/Skeleton'
import { OrderStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useListParams } from '../../hooks/useListParams'
import { useToast } from '../../context/ToastContext'
import { customerService } from '../../services'
import { ADDRESS_LABEL_LABELS } from '../../constants/enums'
import { formatDateTime, timeAgo } from '../../lib/date'
import { formatPaise } from '../../lib/money'
import { cn } from '../../lib/cn'
import type { AdminCustomer, CustomerAddress } from '../../types/models'
import { formatPhone, spacedOrderNumber } from '../orders/orderEvents'

const SORT_OPTIONS = [
  { label: 'Newest customers', value: 'createdAt:desc' },
  { label: 'Oldest customers', value: 'createdAt:asc' },
  { label: 'Highest spend', value: 'totalSpent:desc' },
  { label: 'Most orders', value: 'orderCount:desc' },
  { label: 'Recent order', value: 'lastOrderAt:desc' },
]

const fullName = (c: { firstName: string | null; lastName: string | null }) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || 'No name'

const addressLines = (a: CustomerAddress) =>
  [
    [a.flatHouseNo, a.apartmentSector].filter(Boolean).join(', '),
    a.landmark ? `Near ${a.landmark}` : null,
    `${a.city}, ${a.state} – ${a.pincode}`,
  ].filter(Boolean) as string[]

function AddressCard({ address: a }: { address: CustomerAddress }) {
  const toast = useToast()
  const lines = addressLines(a)
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Badge>{ADDRESS_LABEL_LABELS[a.label]}</Badge>
        {a.isDefault && <Badge variant="info">Default</Badge>}
      </div>
      <address className="flex-1 text-sm not-italic leading-relaxed text-gray-700">
        <span className="block font-medium text-gray-900">{a.receiverName}</span>
        {lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
        <span className="block">{formatPhone(a.receiverPhone)}</span>
      </address>
      <Button
        size="sm"
        variant="outline"
        className="mt-3 self-start"
        leftIcon={<Copy className="h-3.5 w-3.5" />}
        onClick={() =>
          void navigator.clipboard
            .writeText([a.receiverName, ...lines, a.receiverPhone].join('\n'))
            .then(() => toast.success('Address copied'))
        }
      >
        Copy address
      </Button>
    </div>
  )
}

/** Loaded when the row opens: saved addresses and the latest orders. */
function CustomerDetail({ customer }: { customer: AdminCustomer }) {
  const detail = useApi(() => customerService.get(customer.id), [customer.id])
  const data = detail.data ?? customerService.peek(customer.id)

  if (detail.error) return <ErrorBox message={detail.error} onRetry={detail.refetch} />
  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(Math.max(customer.addressCount, 1), 3) }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    )
  }

  const { addresses, orders } = data
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Saved addresses ({addresses.length})
        </h3>
        {addresses.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            <MapPin className="h-4 w-4" aria-hidden="true" /> No saved addresses yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <AddressCard key={a.id} address={a} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent orders</h3>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-gray-900">{spacedOrderNumber(o.orderNumber)}</p>
                    <p className="text-xs text-gray-500" title={formatDateTime(o.createdAt)}>
                      {timeAgo(o.createdAt)} · {formatPaise(o.grandTotal)}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {customer.orderCount > orders.length && (
          <p className="mt-2 text-xs text-gray-500">
            Showing the latest {orders.length} of {customer.orderCount} orders.
          </p>
        )}
      </section>
    </div>
  )
}

export default function CustomersPage() {
  const list = useListParams({ sort: 'createdAt:desc' })
  const customers = useApi(() => customerService.list(list.query), [list.queryKey])
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const columns = useMemo<Column<AdminCustomer>[]>(
    () => [
      {
        header: <span className="sr-only">Expand</span>,
        className: 'w-10 pr-0',
        cell: (c) => {
          const expanded = open.has(c.id)
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggle(c.id)
              }}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} addresses and orders for ${fullName(c)}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
            </button>
          )
        },
      },
      {
        header: 'Customer',
        cell: (c) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{fullName(c)}</p>
            <p className="text-xs text-gray-500" title={formatDateTime(c.createdAt)}>
              Joined {timeAgo(c.createdAt)}
            </p>
          </div>
        ),
      },
      {
        header: 'Contact',
        cell: (c) => (
          <div className="min-w-0 text-sm">
            <p className="flex items-center gap-1 text-gray-900">
              {formatPhone(c.phone)}
              {c.phoneVerified && <BadgeCheck className="h-3.5 w-3.5 text-green-600" aria-label="Verified" />}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-gray-500">
              {c.email ?? 'No email'}
              {c.email && c.emailVerified && <BadgeCheck className="h-3.5 w-3.5 text-green-600" aria-label="Verified" />}
            </p>
          </div>
        ),
      },
      {
        header: 'Orders',
        align: 'center',
        cell: (c) => (
          <div>
            <p className={cn('text-sm font-semibold', c.orderCount ? 'text-gray-900' : 'text-gray-400')}>{c.orderCount}</p>
            {c.cancelledCount > 0 && <p className="text-[11px] text-red-600">{c.cancelledCount} cancelled/returned</p>}
          </div>
        ),
      },
      {
        header: 'Total spent',
        align: 'right',
        cell: (c) => (
          <span className={cn('text-sm font-semibold', c.totalSpent ? 'text-gray-900' : 'text-gray-400')}>
            {formatPaise(c.totalSpent)}
          </span>
        ),
      },
      {
        header: 'Last order',
        cell: (c) =>
          c.lastOrderAt ? (
            <span className="text-sm text-gray-700" title={formatDateTime(c.lastOrderAt)}>
              {timeAgo(c.lastOrderAt)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        header: 'Addresses',
        align: 'center',
        cell: (c) => <span className={cn('text-sm', c.addressCount ? 'text-gray-700' : 'text-gray-400')}>{c.addressCount}</span>,
      },
    ],
    [open],
  )

  const rows = customers.data?.data ?? []
  const total = customers.data?.meta.total

  return (
    <div>
      <PageHeader
        title="Customers"
        description={
          total != null
            ? `${total} registered customer${total === 1 ? '' : 's'}. Guest checkouts aren't linked to an account.`
            : 'Everyone with a storefront account.'
        }
        breadcrumbs={[{ label: 'Customers' }]}
      />

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Name, phone or email…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={Boolean(list.query.search)}
        onClear={() => list.setSearchInput('')}
      />

      {customers.error ? (
        <ErrorBox message={customers.error} onRetry={customers.refetch} />
      ) : customers.loading && !customers.data ? (
        <TableSkeleton columns={7} />
      ) : rows.length === 0 ? (
        list.query.search ? (
          <EmptyState title="No customers match" description="Try a different name, phone number or email." icon={Users} />
        ) : (
          <EmptyState title="No customers yet" description="People who create an account on the storefront show up here." icon={Users} />
        )
      ) : (
        <div className={customers.loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table
            columns={columns}
            data={rows}
            rowKey={(c) => c.id}
            onRowClick={(c) => toggle(c.id)}
            renderExpanded={(c) => (open.has(c.id) ? <CustomerDetail customer={c} /> : null)}
          />
          {customers.data && (
            <div className="mt-4">
              <Pagination
                page={customers.data.meta.page}
                limit={customers.data.meta.limit}
                total={customers.data.meta.total}
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
