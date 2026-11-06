import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { MAX_IMAGE_SIZE_MB } from '../../constants/app'

/**
 * What the form holds for one image slot:
 *  - url:  the image already saved on the record (or null)
 *  - file: a new image picked but not uploaded yet (uploaded on Save)
 */
export type ImageValue = { url: string | null; file: File | null }

export const emptyImage = (url: string | null = null): ImageValue => ({ url, file: null })

type ImageFieldProps = {
  label: string
  value: ImageValue
  onChange: (value: ImageValue) => void
  hint?: string
  error?: string
  /** CSS aspect ratio of the preview box, e.g. "16 / 6" or "3 / 4". */
  aspect?: string
  testId?: string
}

/**
 * One image slot with preview, Replace and Remove. Nothing is uploaded here —
 * the page uploads `value.file` when the form is saved, so cancelling leaves
 * no stray files in S3.
 */
export default function ImageField({
  label,
  value,
  onChange,
  hint,
  error,
  aspect = '16 / 9',
  testId,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value.file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value.file])

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setLocalError('Only image files are allowed.')
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)
      return setLocalError(`The image must be under ${MAX_IMAGE_SIZE_MB} MB.`)
    setLocalError(null)
    onChange({ url: value.url, file })
  }

  const shown = preview ?? value.url
  const open = () => inputRef.current?.click()
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    pick(e.dataTransfer.files)
  }
  const message = localError ?? error

  return (
    <div className="w-full" data-testid={testId}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <div
        style={{ aspectRatio: aspect }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'group relative w-full overflow-hidden rounded-xl border-2 transition-colors',
          shown ? 'border-transparent bg-gray-100' : 'border-dashed',
          dragOver ? 'border-gray-900 bg-gray-50' : !shown && 'border-gray-300 hover:border-gray-400',
          message && !shown && 'border-red-300',
        )}
      >
        {shown ? (
          <>
            <img src={shown} alt="" className="h-full w-full object-cover" />
            {value.file && (
              <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                New · uploads on save
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={open}
                className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow hover:bg-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                onClick={() => onChange({ url: null, file: null })}
                aria-label={`Remove ${label.toLowerCase()}`}
                className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow hover:bg-white"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={open}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center"
          >
            <ImagePlus className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Click to upload</span> or drag &amp; drop
            </span>
            <span className="text-xs text-gray-400">PNG, JPG or WebP · up to {MAX_IMAGE_SIZE_MB}MB</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={`${label} file`}
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
      {message ? (
        <p className="mt-1 text-xs text-red-600">{message}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  )
}
