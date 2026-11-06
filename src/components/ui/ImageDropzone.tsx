import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { MAX_IMAGE_SIZE_MB, MAX_IMAGES_PER_UPLOAD } from '../../constants/app'

type Props = {
  onFiles: (files: File[]) => void
  /** How many more images are allowed right now. */
  remaining?: number
  /** 0–100 while uploading; undefined when idle. */
  progress?: number
  disabled?: boolean
}

/** Drop zone for several images. Validates type, size and count, then hands the files over. */
export default function ImageDropzone({ onFiles, remaining = MAX_IMAGES_PER_UPLOAD, progress, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = progress !== undefined
  const max = Math.min(remaining, MAX_IMAGES_PER_UPLOAD)

  const take = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const files = Array.from(list)
    if (files.some((f) => !f.type.startsWith('image/'))) return setError('Only image files are allowed.')
    if (files.some((f) => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024))
      return setError(`Each image must be under ${MAX_IMAGE_SIZE_MB} MB.`)
    if (files.length > max) return setError(`You can add ${max} more image${max === 1 ? '' : 's'} at a time.`)
    setError(null)
    onFiles(files)
  }

  const blocked = disabled || busy || max <= 0

  return (
    <div>
      <div
        role="button"
        tabIndex={blocked ? -1 : 0}
        aria-disabled={blocked}
        onClick={() => !blocked && inputRef.current?.click()}
        onKeyDown={(e) => !blocked && (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!blocked) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          setDragOver(false)
          if (!blocked) take(e.dataTransfer.files)
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          blocked ? 'cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer',
          !blocked && (dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'),
        )}
      >
        {busy ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100">
              <div className="h-full bg-gray-900 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <>
            <ImagePlus className="h-6 w-6 text-gray-400" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Click to add photos</span> or drag &amp; drop
            </p>
            <p className="text-xs text-gray-400">
              {max > 0 ? `Up to ${max} at a time · ${MAX_IMAGE_SIZE_MB}MB each · converted to WebP` : 'Upload limit reached'}
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-label="Product photos"
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
