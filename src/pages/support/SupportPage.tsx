import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LifeBuoy, MessageCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Tabs from '../../components/ui/Tabs'
import ChipFilter from '../../components/ui/ChipFilter'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton from '../../components/ui/Skeleton'
import { SupportStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useListParams } from '../../hooks/useListParams'
import { supportService } from '../../services'
import { SUPPORT_REASON_LABELS, SUPPORT_REASON_OPTIONS, SUPPORT_STATUS_LABELS } from '../../constants/enums'
import { timeAgo } from '../../lib/date'
import { cn } from '../../lib/cn'
import type { SupportTicketListItem } from '../../types/models'
import { customerName } from './supportEvents'

const TAB_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ALL'] as const
type Tab = (typeof TAB_ORDER)[number]

const SORT_OPTIONS = [
  { label: 'Latest activity', value: 'lastMessageAt:desc' },
  { label: 'Oldest activity', value: 'lastMessageAt:asc' },
  { label: 'Newest tickets', value: 'createdAt:desc' },
  { label: 'Oldest tickets', value: 'createdAt:asc' },
]

const EMPTY_TEXT: Record<Tab, { title: string; description: string }> = {
  OPEN: { title: 'All caught up', description: 'New requests and customer replies that need an answer show up here.' },
  IN_PROGRESS: { title: 'Nothing in progress', description: 'Tickets you have replied to wait here for the customer.' },
  RESOLVED: { title: 'No resolved tickets', description: 'Tickets marked resolved can still be reopened by a customer reply.' },
  CLOSED: { title: 'No closed tickets', description: 'Closed tickets are final and cannot be replied to.' },
  ALL: { title: 'No support requests yet', description: 'When customers ask for help from their account, it shows up here.' },
}

function TicketRow({ t }: { t: SupportTicketListItem }) {
  const needsReply = t.status === 'OPEN'
  return (
    <Link
      to={`/support/${t.id}`}
      className={cn(
        'group flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:border-gray-900',
        needsReply ? 'border-amber-300' : 'border-gray-200',
      )}
    >
      <span
        className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', needsReply ? 'bg-amber-500' : 'bg-transparent')}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs font-semibold text-gray-500">SUP-{t.ticketNumber}</span>
          <span className="text-sm font-semibold text-gray-900">{SUPPORT_REASON_LABELS[t.reason]}</span>
          <SupportStatusBadge status={t.status} />
          {needsReply && (
            <span className="text-xs font-medium text-amber-700">
              {t.lastReplyFrom === 'CUSTOMER' ? 'Customer replied' : 'New request'}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{customerName(t.user)}</span>
          <span>{t.user.phone}</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> {t.messageCount}
          </span>
          <span>Updated {timeAgo(t.lastMessageAt)}</span>
        </p>
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function SupportPage() {
  const list = useListParams({ sort: 'lastMessageAt:desc', filters: { status: 'OPEN', reason: '' } })
  const tab = (list.filters.status || 'OPEN') as Tab
  const query = useMemo(() => {
    const q = { ...list.query }
    if (q.status === 'ALL') delete q.status
    return q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.queryKey])

  const tickets = useApi(() => supportService.list(query), [list.queryKey])
  const counts = useApi(() => supportService.counts(), [])

  const c = counts.data
  const tabs = TAB_ORDER.map((value) => ({
    value,
    label: value === 'ALL' ? 'All' : SUPPORT_STATUS_LABELS[value],
    count: c ? c[value] : undefined,
  }))
  const rows = tickets.data?.data ?? []
  const filtered = Boolean(list.query.search) || list.filters.reason !== ''

  return (
    <div>
      <PageHeader
        title="Support"
        description="Customer help requests. Open tickets are waiting for your reply."
        breadcrumbs={[{ label: 'Support' }]}
      />

      <div className="mb-4">
        <Tabs tabs={tabs} value={tab} onChange={(v) => list.setFilter('status', v)} />
      </div>

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="SUP-1042, name, phone or email…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={filtered}
        onClear={() => {
          list.setSearchInput('')
          list.setFilter('reason', '')
        }}
        filters={
          <ChipFilter
            single
            options={SUPPORT_REASON_OPTIONS}
            value={list.filters.reason ? [list.filters.reason] : []}
            onChange={(v) => list.setFilter('reason', v[0] ?? '')}
          />
        }
      />

      {tickets.error ? (
        <ErrorBox message={tickets.error} onRetry={tickets.refetch} />
      ) : tickets.loading && !tickets.data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        filtered ? (
          <EmptyState title="No tickets match" description="Try a different search or reason." icon={LifeBuoy} />
        ) : (
          <EmptyState {...EMPTY_TEXT[tab]} icon={LifeBuoy} />
        )
      ) : (
        <div className={tickets.loading ? 'opacity-60 transition-opacity' : undefined}>
          <div className="space-y-3">
            {rows.map((t) => (
              <TicketRow key={t.id} t={t} />
            ))}
          </div>
          {tickets.data && (
            <div className="mt-4">
              <Pagination
                page={tickets.data.meta.page}
                limit={tickets.data.meta.limit}
                total={tickets.data.meta.total}
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
