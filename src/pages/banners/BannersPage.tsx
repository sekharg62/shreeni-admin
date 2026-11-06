import { useMemo, useState, type ReactNode } from 'react'
import { GalleryHorizontal, Info, Link2, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import ChipFilter from '../../components/ui/ChipFilter'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton from '../../components/ui/Skeleton'
import SortableList from '../../components/ui/SortableList'
import IconButton from '../../components/ui/IconButton'
import Switch from '../../components/ui/Switch'
import { CatalogStatusBadge } from '../../components/ui/StatusBadge'
import BannerFormModal from './BannerFormModal'
import { useApi } from '../../hooks/useApi'
import { useUrlState } from '../../hooks/useUrlState'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { bannerService, getApiErrorMessage } from '../../services'
import { CATALOG_STATUS_OPTIONS, CatalogStatus } from '../../constants/enums'
import { MAX_PAGE_SIZE } from '../../constants/app'
import type { Banner } from '../../types/models'

export default function BannersPage() {
  const { data, loading, error, refetch, setData } = useApi(
    () => bannerService.list({ limit: MAX_PAGE_SIZE, sortBy: 'sortOrder', sortOrder: 'asc' }),
    [],
  )
  const [url, setUrl] = useUrlState({ status: '' })
  const [editing, setEditing] = useState<Banner | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const all = useMemo(() => data?.data ?? [], [data])
  const shown = url.status ? all.filter((b) => b.status === url.status) : all
  const liveCount = all.filter((b) => b.status === CatalogStatus.PUBLISHED).length

  const openForm = (b: Banner | null) => {
    setEditing(b)
    setFormOpen(true)
  }

  const replaceLocal = (next: Banner[]) =>
    setData((prev) => (prev ? { ...prev, data: next } : prev!))

  const reorder = async (next: Banner[]) => {
    try {
      const saved = await bannerService.reorder(next.map((b) => b.id))
      replaceLocal(saved)
      toast.success('Carousel order saved')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    }
  }

  /** Live switch: Published ↔ Unpublished, optimistic. */
  const toggleLive = async (b: Banner, live: boolean) => {
    const status = live ? CatalogStatus.PUBLISHED : CatalogStatus.UNPUBLISHED
    const apply = (s: CatalogStatus) => replaceLocal(all.map((x) => (x.id === b.id ? { ...x, status: s } : x)))
    apply(status)
    try {
      await bannerService.setStatus(b.id, status)
      toast.success(live ? 'Banner is live on the homepage' : 'Banner hidden from the homepage')
    } catch (err) {
      apply(b.status)
      toast.error(getApiErrorMessage(err))
    }
  }

  const remove = async (b: Banner) => {
    const ok = await confirm({
      title: `Delete ${b.title ? `"${b.title}"` : 'this banner'}?`,
      message: "Its images are deleted from storage too. This can't be undone.",
      danger: true,
    })
    if (!ok) return
    try {
      await bannerService.remove(b.id)
      toast.success('Banner deleted')
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const card = (b: Banner, handle: ReactNode, index: number) => (
    <article
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      data-testid={`banner-${b.title ?? b.id}`}
    >
      <div className="relative bg-gray-100" style={{ aspectRatio: '16 / 6' }}>
        <img src={b.imageUrl} alt={b.title ?? ''} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-white/95 pr-2 shadow-sm">
          {handle}
          {!url.status && <span className="text-xs font-semibold text-gray-700">#{index + 1}</span>}
        </div>
        <div className="absolute right-2 top-2">
          <CatalogStatusBadge status={b.status} />
        </div>
        {(b.title || b.subtitle) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/50 to-transparent px-5 text-white">
            {b.title && <p className="truncate text-lg font-bold">{b.title}</p>}
            {b.subtitle && <p className="truncate text-xs opacity-90">{b.subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1 space-y-0.5 text-xs text-gray-500">
          <p className="flex items-center gap-1.5 truncate">
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            {b.linkUrl ? <span className="truncate text-gray-700">{b.linkUrl}</span> : <span>No link</span>}
          </p>
          <p className="flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            {b.mobileImageUrl ? 'Mobile image set' : 'No mobile image'}
          </p>
        </div>
        <div data-testid={`live-${b.title ?? b.id}`} title="Show on homepage">
          <Switch checked={b.status === CatalogStatus.PUBLISHED} onChange={(on) => void toggleLive(b, on)} />
        </div>
        <IconButton icon={Pencil} label="Edit" onClick={() => openForm(b)} />
        <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(b)} />
      </div>
    </article>
  )

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Slides in the homepage carousel. The first one is shown first."
        breadcrumbs={[{ label: 'Marketing' }, { label: 'Banners' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New banner
          </Button>
        }
      />

      {all.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ChipFilter
            single
            options={CATALOG_STATUS_OPTIONS}
            value={url.status ? [url.status] : []}
            onChange={(v) => setUrl({ status: v[0] ?? '' })}
          />
          <p className="flex items-center gap-1.5 text-xs text-gray-500" data-testid="banner-hint">
            <Info className="h-3.5 w-3.5" />
            {url.status
              ? 'Clear the filter to drag banners into a new order.'
              : `${liveCount} of ${all.length} live · drag the handle to change the carousel order`}
          </p>
        </div>
      )}

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          title="No banners yet"
          description="Add a wide image for the homepage carousel — a festive offer, a new collection or a best-selling weave."
          icon={GalleryHorizontal}
          action={<Button onClick={() => openForm(null)}>Add your first banner</Button>}
        />
      ) : shown.length === 0 ? (
        <EmptyState title="No banners with this status" icon={GalleryHorizontal} />
      ) : (
        <SortableList
          items={shown}
          getId={(b) => b.id}
          layout="grid"
          className="sm:grid-cols-2 xl:grid-cols-3"
          disabled={Boolean(url.status)}
          onReorder={reorder}
          renderItem={card}
        />
      )}

      <BannerFormModal
        open={formOpen}
        banner={editing}
        nextSortOrder={all.length}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
