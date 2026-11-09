import { useMemo, useState, type ReactNode } from 'react'
import { CalendarClock, ExternalLink, ImageOff, Info, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Badge, { type BadgeVariant } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import IconButton from '../../components/ui/IconButton'
import ProductPicker from '../../components/ui/ProductPicker'
import Skeleton from '../../components/ui/Skeleton'
import SortableList from '../../components/ui/SortableList'
import Switch from '../../components/ui/Switch'
import HomePickFormModal from './HomePickFormModal'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { homePickService, getApiErrorMessage } from '../../services'
import { formatPaise } from '../../lib/money'
import { formatDate } from '../../lib/date'
import type { HomePick } from '../../types/models'

/** Same limits as the backend / storefront. */
const MAX_PICKS = 24
const SHOWN_DESKTOP = 8
const SHOWN_PHONE = 4

const dateOf = (iso: string | null) => (iso ? formatDate(new Date(iso)) : '')

/** What the row's status pill says, given its place among the live picks. */
function statusOf(p: HomePick, liveIndex: number): { label: string; variant: BadgeVariant; title?: string } {
  switch (p.hiddenReason) {
    case 'switched-off':
      return { label: 'Switched off', variant: 'neutral' }
    case 'scheduled':
      return { label: `Starts ${dateOf(p.startsAt)}`, variant: 'info' }
    case 'ended':
      return { label: `Ended ${dateOf(p.endsAt)}`, variant: 'neutral' }
    case 'product-unpublished':
      return { label: 'Product not published', variant: 'warning', title: 'Publish the product to show it' }
    case 'category-unpublished':
      return { label: 'Category not published', variant: 'warning', title: 'Publish its category to show it' }
    case 'out-of-stock':
      return { label: 'Out of stock', variant: 'warning', title: 'Shown again once a size is back in stock' }
  }
  if (liveIndex >= SHOWN_DESKTOP) {
    return {
      label: 'Waiting',
      variant: 'neutral',
      title: `Live, but only the first ${SHOWN_DESKTOP} live picks appear. It moves up when one above it goes.`,
    }
  }
  if (liveIndex >= SHOWN_PHONE) {
    return { label: 'On homepage · desktop', variant: 'success', title: `Phones show the first ${SHOWN_PHONE}` }
  }
  return { label: 'On homepage', variant: 'success' }
}

export default function HomePicksPage() {
  const { data, loading, error, refetch, setData } = useApi(() => homePickService.list(), [])
  const [editing, setEditing] = useState<HomePick | null>(null)
  const [adding, setAdding] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const all = useMemo(() => data ?? [], [data])
  /** Position among live picks (what decides if it's actually on the homepage); -1 = hidden. */
  const liveIndex = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    for (const p of all) map.set(p.id, p.hiddenReason ? -1 : n++)
    return map
  }, [all])
  const liveCount = all.filter((p) => !p.hiddenReason).length
  const onHomepage = Math.min(liveCount, SHOWN_DESKTOP)

  const replaceOne = (saved: HomePick) => setData(all.map((p) => (p.id === saved.id ? saved : p)))

  const add = async (productId: string) => {
    setAdding(true)
    try {
      const created = await homePickService.create({ productId })
      setData([...all, created])
      toast.success(
        created.hiddenReason
          ? 'Added — not on the homepage yet (see its status)'
          : 'Added to the homepage picks',
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const reorder = async (next: HomePick[]) => {
    try {
      setData(await homePickService.reorder(next.map((p) => p.id)))
      toast.success('Homepage order saved')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err // SortableList snaps back
    }
  }

  /** On/off switch: optimistic, rolled back if the save fails. */
  const toggle = async (p: HomePick, on: boolean) => {
    setData(all.map((x) => (x.id === p.id ? { ...x, isActive: on } : x)))
    try {
      const saved = await homePickService.update(p.id, { isActive: on })
      replaceOne(saved)
      toast.success(on ? 'Switched on' : 'Hidden from the homepage')
    } catch (err) {
      setData(all)
      toast.error(getApiErrorMessage(err))
    }
  }

  const remove = async (p: HomePick) => {
    const ok = await confirm({
      title: `Remove “${p.product.name}” from the homepage picks?`,
      message: 'Only the pick is removed. The product stays in the shop.',
      danger: true,
    })
    if (!ok) return
    try {
      await homePickService.remove(p.id)
      setData(all.filter((x) => x.id !== p.id))
      toast.success('Removed from the homepage picks')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const row = (p: HomePick, handle: ReactNode, index: number) => {
    const status = statusOf(p, liveIndex.get(p.id) ?? -1)
    const onSale = p.product.compareAtPrice != null && p.product.compareAtPrice > p.product.price
    return (
      <article
        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 pr-3 shadow-sm"
        data-testid={`home-pick-${p.product.slug}`}
      >
        {handle}
        <span className="w-6 shrink-0 text-center text-xs font-semibold text-gray-500">#{index + 1}</span>
        <span className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
          {p.product.imageUrl ? (
            <img src={p.product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <ImageOff className="h-4 w-4 text-gray-300" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${p.product.id}`}
            className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900 hover:underline"
          >
            <span className="truncate">{p.product.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" />
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
            <span>{p.product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-gray-700">{formatPaise(p.product.price)}</span>
            {onSale && <span className="line-through">{formatPaise(p.product.compareAtPrice)}</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {p.badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
                <Sparkles className="h-3 w-3" />
                {p.badge}
              </span>
            )}
            {(p.startsAt || p.endsAt) && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <CalendarClock className="h-3 w-3" />
                {p.startsAt ? dateOf(p.startsAt) : 'Now'} – {p.endsAt ? dateOf(p.endsAt) : 'no end'}
              </span>
            )}
          </div>
        </div>

        <span title={status.title} className="hidden sm:inline-flex">
          <Badge variant={status.variant}>{status.label}</Badge>
        </span>
        <div title="Show on the homepage">
          <Switch checked={p.isActive} onChange={(on) => void toggle(p, on)} />
        </div>
        <IconButton icon={Pencil} label="Edit badge and dates" onClick={() => setEditing(p)} />
        <IconButton icon={Trash2} label="Remove from picks" tone="danger" onClick={() => void remove(p)} />
      </article>
    )
  }

  return (
    <div>
      <PageHeader
        title="Homepage picks"
        description={`Products in the homepage “Handpicked for You” section, in this order. The first ${SHOWN_DESKTOP} live picks show on desktop, the first ${SHOWN_PHONE} on phones.`}
        breadcrumbs={[{ label: 'Marketing' }, { label: 'Homepage picks' }]}
      />

      <div className="mb-5 max-w-xl">
        <ProductPicker
          label={adding ? 'Adding…' : 'Add a product'}
          value={[]}
          onChange={(v) => {
            const picked = v[v.length - 1]
            if (picked) void add(picked.id)
          }}
          excludeIds={all.map((p) => p.product.id)}
          max={Math.max(0, MAX_PICKS - all.length)}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          {all.length >= MAX_PICKS
            ? `The list is full (${MAX_PICKS}). Remove one to add another.`
            : 'Added to the end of the list. Price, photo and stock come from the product.'}
        </p>
      </div>

      {all.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-500" data-testid="home-picks-hint">
          <Info className="h-3.5 w-3.5" />
          {onHomepage} on the homepage · {liveCount} live of {all.length} · drag the handle to change the order
        </p>
      )}

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          title="No homepage picks yet"
          description="Search above to add sarees you want to feature, then drag them into order. The section stays hidden until at least one pick is live."
          icon={Sparkles}
        />
      ) : (
        <SortableList items={all} getId={(p) => p.id} onReorder={reorder} renderItem={row} />
      )}

      {editing && (
        <HomePickFormModal
          key={editing.id}
          pick={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replaceOne(saved)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
