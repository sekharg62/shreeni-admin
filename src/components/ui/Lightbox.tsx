import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export type LightboxItem = { url: string; type: 'image' | 'video' }

type LightboxProps = {
  items: LightboxItem[]
  /** Index of the open item, or null when closed. */
  index: number | null
  onIndexChange: (index: number | null) => void
}

/** Full-screen viewer for review photos/videos. ← → to move, Esc to close. */
export default function Lightbox({ items, index, onIndexChange }: LightboxProps) {
  const open = index !== null && items[index] !== undefined
  const count = items.length

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onIndexChange(null)
      if (e.key === 'ArrowRight') onIndexChange(((index ?? 0) + 1) % count)
      if (e.key === 'ArrowLeft') onIndexChange(((index ?? 0) - 1 + count) % count)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, index, count, onIndexChange])

  if (!open) return null
  const item = items[index]

  const nav = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6" role="dialog" aria-label="Media viewer" onClick={() => onIndexChange(null)}>
      <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-lg" />
        ) : (
          <img src={item.url} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        )}
        {count > 1 && <p className="mt-3 text-center text-sm text-white/70">{index + 1} / {count}</p>}
      </div>
      <button type="button" aria-label="Close" onClick={() => onIndexChange(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      {count > 1 && (
        <>
          <button type="button" aria-label="Previous" className={`${nav} left-4`} onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + count) % count) }}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" aria-label="Next" className={`${nav} right-4`} onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % count) }}>
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
