import { useState } from 'react'
import { Check, Mail, Play, RotateCcw, Trash2, UserCheck, X } from 'lucide-react'
import Checkbox from '../../components/ui/Checkbox'
import Button from '../../components/ui/Button'
import IconButton from '../../components/ui/IconButton'
import StarRating from '../../components/ui/StarRating'
import { ReviewStatusBadge } from '../../components/ui/StatusBadge'
import type { LightboxItem } from '../../components/ui/Lightbox'
import { ReviewStatus } from '../../constants/enums'
import { formatDay } from '../../lib/formErrors'
import { cn } from '../../lib/cn'
import type { Review } from '../../types/models'

type Props = {
  review: Review
  selected: boolean
  busy: boolean
  onSelect: (on: boolean) => void
  onStatus: (status: ReviewStatus) => void
  onDelete: () => void
  onOpenMedia: (items: LightboxItem[], index: number) => void
}

/** One review in the moderation queue. */
export default function ReviewCard({ review: r, selected, busy, onSelect, onStatus, onDelete, onOpenMedia }: Props) {
  const [expanded, setExpanded] = useState(false)
  const media: LightboxItem[] = [
    ...r.images.map((url) => ({ url, type: 'image' as const })),
    ...r.videos.map((url) => ({ url, type: 'video' as const })),
  ]
  const long = r.body.length > 280

  return (
    <article
      data-testid={`review-${r.title}`}
      className={cn(
        'rounded-xl border bg-white p-4 transition-colors',
        selected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200',
        busy && 'opacity-60',
      )}
    >
      <div className="flex gap-3">
        <div className="pt-0.5">
          <Checkbox checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Select review “${r.title}”`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StarRating value={r.rating} />
            <ReviewStatusBadge status={r.status} />
            <span className="text-xs text-gray-500">{formatDay(r.createdAt)}</span>
            <span className="text-xs text-gray-500">
              on <span className="font-medium text-gray-700">{r.product.name}</span>
            </span>
          </div>

          <h3 className="mt-2 font-semibold text-gray-900">{r.title}</h3>
          <p className={cn('mt-1 whitespace-pre-line text-sm text-gray-700', !expanded && long && 'line-clamp-3')}>{r.body}</p>
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-medium text-gray-900 hover:underline">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m, i) => (
                <button
                  key={m.url + i}
                  type="button"
                  onClick={() => onOpenMedia(media, i)}
                  aria-label={`Open ${m.type} ${i + 1}`}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 hover:ring-2 hover:ring-gray-900/30"
                >
                  {m.type === 'image' ? (
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <>
                      <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-5 w-5 fill-white text-white" />
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{r.reviewerName}</span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {r.reviewerEmail}
            </span>
            {r.userId && (
              <span className="inline-flex items-center gap-1 text-green-700">
                <UserCheck className="h-3.5 w-3.5" /> Registered customer
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          {r.status !== ReviewStatus.APPROVED && (
            <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} disabled={busy} onClick={() => onStatus(ReviewStatus.APPROVED)}>
              Approve
            </Button>
          )}
          {r.status !== ReviewStatus.REJECTED && (
            <Button size="sm" variant="outline" leftIcon={<X className="h-3.5 w-3.5" />} disabled={busy} onClick={() => onStatus(ReviewStatus.REJECTED)}>
              {r.status === ReviewStatus.APPROVED ? 'Unpublish' : 'Reject'}
            </Button>
          )}
          {r.status !== ReviewStatus.PENDING && (
            <IconButton icon={RotateCcw} label="Back to pending" disabled={busy} onClick={() => onStatus(ReviewStatus.PENDING)} />
          )}
          <IconButton icon={Trash2} label="Delete" tone="danger" disabled={busy} onClick={onDelete} />
        </div>
      </div>
    </article>
  )
}
