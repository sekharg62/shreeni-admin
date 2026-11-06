import { useEffect, useMemo, useState } from 'react'
import { Check, MessageSquareText, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import ListToolbar from '../../components/layout/ListToolbar'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'
import Checkbox from '../../components/ui/Checkbox'
import ChipFilter from '../../components/ui/ChipFilter'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton from '../../components/ui/Skeleton'
import Lightbox, { type LightboxItem } from '../../components/ui/Lightbox'
import ReviewCard from './ReviewCard'
import { useApi } from '../../hooks/useApi'
import { SORT_PRESETS, useListParams } from '../../hooks/useListParams'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, reviewService } from '../../services'
import { REVIEW_STATUS_LABELS, ReviewStatus } from '../../constants/enums'
import type { Review } from '../../types/models'

const SORT_OPTIONS = [
  SORT_PRESETS.newest,
  SORT_PRESETS.oldest,
  { label: 'Rating: high → low', value: 'rating:desc' },
  { label: 'Rating: low → high', value: 'rating:asc' },
]
const RATING_FILTER = [5, 4, 3, 2, 1].map((n) => ({ label: `${n} ★`, value: String(n) }))
const TAB_ORDER = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const

const EMPTY_TEXT: Record<(typeof TAB_ORDER)[number], { title: string; description: string }> = {
  PENDING: { title: 'All caught up', description: 'New customer reviews will appear here for approval before they show on the store.' },
  APPROVED: { title: 'No approved reviews', description: 'Approved reviews are shown on product pages.' },
  REJECTED: { title: 'No rejected reviews', description: 'Rejected reviews stay hidden from the store.' },
  ALL: { title: 'No reviews yet', description: 'When customers review a saree, it shows up here.' },
}

export default function ReviewsPage() {
  const list = useListParams({ sort: 'createdAt:desc', filters: { status: 'PENDING', rating: '' } })
  const tab = (list.filters.status || 'PENDING') as (typeof TAB_ORDER)[number]
  const query = useMemo(() => {
    const q = { ...list.query }
    if (q.status === 'ALL') delete q.status
    return q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.queryKey])

  const reviews = useApi(() => reviewService.list(query), [list.queryKey])
  const counts = useApi(() => reviewService.counts(), [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number | null }>({ items: [], index: null })
  const confirm = useConfirm()
  const toast = useToast()

  // A new page / tab / filter starts with nothing selected.
  useEffect(() => setSelected(new Set()), [list.queryKey])

  const rows = reviews.data?.data ?? []
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someOnPage = rows.some((r) => selected.has(r.id))

  const refresh = async () => {
    await Promise.all([reviews.refetch(), counts.refetch()])
  }

  /** After the last item of a page leaves the current tab, step back a page. */
  const afterChange = async (removedFromView: number) => {
    if (list.page > 1 && removedFromView >= rows.length) list.setPage(list.page - 1)
    await refresh()
  }

  const leavesTab = (status: ReviewStatus) => tab !== 'ALL' && tab !== status

  const setStatus = async (r: Review, status: ReviewStatus) => {
    setBusy((b) => new Set(b).add(r.id))
    try {
      await reviewService.setStatus(r.id, status)
      toast.success(`Review ${status === ReviewStatus.PENDING ? 'moved back to pending' : REVIEW_STATUS_LABELS[status].toLowerCase()}`)
      setSelected((s) => {
        const n = new Set(s)
        n.delete(r.id)
        return n
      })
      await afterChange(leavesTab(status) ? 1 : 0)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy((b) => {
        const n = new Set(b)
        n.delete(r.id)
        return n
      })
    }
  }

  const bulk = async (status: ReviewStatus) => {
    const ids = [...selected]
    setBusy(new Set(ids))
    try {
      const { updated } = await reviewService.setManyStatus(ids, status)
      toast.success(`${updated} review${updated === 1 ? '' : 's'} ${REVIEW_STATUS_LABELS[status].toLowerCase()}`)
      setSelected(new Set())
      await afterChange(leavesTab(status) ? ids.length : 0)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy(new Set())
    }
  }

  const remove = async (r: Review) => {
    const ok = await confirm({
      title: 'Delete this review?',
      message: `“${r.title}” by ${r.reviewerName} will be removed for good. To just hide it, reject it instead.`,
      danger: true,
    })
    if (!ok) return
    try {
      await reviewService.remove(r.id)
      toast.success('Review deleted')
      await afterChange(1)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const c = counts.data
  const tabs = TAB_ORDER.map((value) => ({
    value,
    label: value === 'ALL' ? 'All' : REVIEW_STATUS_LABELS[value],
    count: c ? c[value] : undefined,
  }))

  const ratingOrSearch = Boolean(list.query.search) || list.filters.rating !== ''

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Customer reviews wait here until you approve them. Only approved reviews show on the store."
        breadcrumbs={[{ label: 'Reviews' }]}
      />

      <div className="mb-4">
        <Tabs tabs={tabs} value={tab} onChange={(v) => list.setFilter('status', v)} />
      </div>

      <ListToolbar
        search={list.searchInput}
        onSearchChange={list.setSearchInput}
        searchPlaceholder="Search text, name or email…"
        sort={list.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={list.setSort}
        hasActiveFilters={ratingOrSearch}
        onClear={() => {
          list.setSearchInput('')
          list.setFilter('rating', '')
        }}
        filters={
          <ChipFilter
            single
            options={RATING_FILTER}
            value={list.filters.rating ? [list.filters.rating] : []}
            onChange={(v) => list.setFilter('rating', v[0] ?? '')}
          />
        }
      />

      {rows.length > 0 && (
        <div
          className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur"
          data-testid="bulk-bar"
        >
          <Checkbox
            checked={allOnPage}
            onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
            label={someOnPage ? `${selected.size} selected` : 'Select all on this page'}
            aria-label="Select all on this page"
          />
          {someOnPage && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => void bulk(ReviewStatus.APPROVED)} disabled={busy.size > 0}>
                Approve {selected.size}
              </Button>
              <Button size="sm" variant="outline" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => void bulk(ReviewStatus.REJECTED)} disabled={busy.size > 0}>
                Reject {selected.size}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {reviews.error ? (
        <ErrorBox message={reviews.error} onRetry={reviews.refetch} />
      ) : reviews.loading && !reviews.data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        ratingOrSearch ? (
          <EmptyState title="No reviews match" description="Try a different search or rating." icon={MessageSquareText} />
        ) : (
          <EmptyState {...EMPTY_TEXT[tab]} icon={MessageSquareText} />
        )
      ) : (
        <div className={reviews.loading ? 'opacity-60 transition-opacity' : undefined}>
          <div className="space-y-3">
            {rows.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                selected={selected.has(r.id)}
                busy={busy.has(r.id)}
                onSelect={(on) =>
                  setSelected((s) => {
                    const n = new Set(s)
                    if (on) n.add(r.id)
                    else n.delete(r.id)
                    return n
                  })
                }
                onStatus={(s) => void setStatus(r, s)}
                onDelete={() => void remove(r)}
                onOpenMedia={(items, index) => setLightbox({ items, index })}
              />
            ))}
          </div>
          {reviews.data && (
            <div className="mt-4">
              <Pagination
                page={reviews.data.meta.page}
                limit={reviews.data.meta.limit}
                total={reviews.data.meta.total}
                onPageChange={list.setPage}
                onLimitChange={list.setLimit}
              />
            </div>
          )}
        </div>
      )}

      <Lightbox
        items={lightbox.items}
        index={lightbox.index}
        onIndexChange={(index) => setLightbox((l) => ({ ...l, index }))}
      />
    </div>
  )
}
