import { useState, type ReactNode } from 'react'
import { Star, Trash2 } from 'lucide-react'
import SortableList from '../../components/ui/SortableList'
import ImageDropzone from '../../components/ui/ImageDropzone'
import IconButton from '../../components/ui/IconButton'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { getApiErrorMessage, productImageService, s3UploadService } from '../../services'
import { MAX_IMAGES_PER_UPLOAD } from '../../constants/app'
import { cn } from '../../lib/cn'
import type { ProductImage } from '../../types/models'

/** A photo picked on the create page, uploaded after the product is saved. */
export type QueuedImage = { key: string; file: File; url: string }

const MAX_GALLERY = 20

type Tile = { id: string; url: string; isPrimary: boolean }

function Gallery({
  tiles,
  onReorder,
  onPrimary,
  onRemove,
}: {
  tiles: Tile[]
  onReorder: (ids: string[]) => Promise<unknown> | void
  onPrimary: (id: string) => void
  onRemove: (id: string) => void
}) {
  if (tiles.length === 0) return null
  return (
    <SortableList
      items={tiles}
      getId={(t) => t.id}
      layout="grid"
      className="mt-4 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      onReorder={(next) => onReorder(next.map((t) => t.id))}
      renderItem={(t, handle: ReactNode, i) => (
        <figure
          data-testid="product-image"
          data-primary={t.isPrimary}
          className={cn(
            'group relative aspect-[3/4] overflow-hidden rounded-xl border-2 bg-gray-100',
            t.isPrimary ? 'border-gray-900' : 'border-transparent',
          )}
        >
          <img src={t.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
          <div className="absolute left-1.5 top-1.5 rounded-md bg-white/95 shadow-sm">{handle}</div>
          {t.isPrimary && (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              Main
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {!t.isPrimary && (
              <IconButton
                icon={Star}
                label="Set as main photo"
                className="bg-white/95 text-gray-800 hover:bg-white"
                onClick={() => onPrimary(t.id)}
              />
            )}
            <IconButton
              icon={Trash2}
              label="Delete photo"
              tone="danger"
              className="bg-white/95 hover:bg-white"
              onClick={() => onRemove(t.id)}
            />
          </div>
        </figure>
      )}
    />
  )
}

const hint = (
  <p className="mt-3 text-xs text-gray-500">
    The <strong>Main</strong> photo is the product card thumbnail. Drag photos to set their order on the product page.
  </p>
)

/** Create page: photos stay in the browser until the product is saved. */
export function QueuedImages({
  value,
  primaryKey,
  onChange,
}: {
  value: QueuedImage[]
  primaryKey: string | null
  onChange: (images: QueuedImage[], primaryKey: string | null) => void
}) {
  const add = (files: File[]) => {
    const added = files.map((file) => ({ key: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))
    const next = [...value, ...added]
    onChange(next, primaryKey ?? next[0]?.key ?? null)
  }
  const remove = (key: string) => {
    const gone = value.find((q) => q.key === key)
    if (gone) URL.revokeObjectURL(gone.url)
    const next = value.filter((q) => q.key !== key)
    onChange(next, primaryKey === key ? (next[0]?.key ?? null) : primaryKey)
  }
  return (
    <div>
      <ImageDropzone onFiles={add} remaining={Math.min(MAX_IMAGES_PER_UPLOAD - value.length, MAX_GALLERY)} />
      <Gallery
        tiles={value.map((q) => ({ id: q.key, url: q.url, isPrimary: q.key === primaryKey }))}
        onReorder={(ids) => onChange(ids.map((id) => value.find((q) => q.key === id)!), primaryKey)}
        onPrimary={(key) => onChange(value, key)}
        onRemove={remove}
      />
      {value.length > 0 ? (
        <p className="mt-3 text-xs text-amber-700">
          {value.length} photo{value.length === 1 ? '' : 's'} will upload when you create the product.
        </p>
      ) : (
        hint
      )}
    </div>
  )
}

/** Edit page: every change saves right away. */
export function LiveImages({
  productId,
  images,
  onChange,
}: {
  productId: string
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [progress, setProgress] = useState<number | undefined>(undefined)

  const upload = async (files: File[]) => {
    setProgress(0)
    try {
      onChange(await s3UploadService.uploadProductImages(productId, files, setProgress))
      toast.success(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded`)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setProgress(undefined)
    }
  }

  const act = async (fn: () => Promise<ProductImage[]>, success: string) => {
    try {
      onChange(await fn())
      toast.success(success)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    }
  }

  const remove = async (id: string) => {
    const ok = await confirm({ title: 'Delete this photo?', message: 'It is removed from storage too.', danger: true })
    if (ok) await act(() => productImageService.remove(productId, id), 'Photo deleted').catch(() => {})
  }

  return (
    <div>
      <ImageDropzone onFiles={(f) => void upload(f)} remaining={MAX_GALLERY - images.length} progress={progress} />
      <Gallery
        tiles={images}
        onReorder={(ids) => act(() => productImageService.reorder(productId, ids), 'Photo order saved')}
        onPrimary={(id) => void act(() => productImageService.setPrimary(productId, id), 'Main photo updated').catch(() => {})}
        onRemove={(id) => void remove(id)}
      />
      {hint}
    </div>
  )
}
