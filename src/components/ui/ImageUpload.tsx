import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '../../lib/cn'

type ImageUploadProps = {
  value: File[]
  onChange: (files: File[]) => void
  /** Allow selecting more than one image. */
  multiple?: boolean
  /** Max size per file in MB (default 5). */
  maxSizeMB?: number
  label?: string
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxSizeMB = 5,
  label,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // One stable object URL per File, so removing one image never recreates
  // (and reloads) the others. New files get a URL; removed files are revoked.
  const urlMap = useRef(new Map<File, string>())
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])

  useEffect(() => {
    const map = urlMap.current
    for (const file of value) {
      if (!map.has(file)) map.set(file, URL.createObjectURL(file))
    }
    for (const file of Array.from(map.keys())) {
      if (!value.includes(file)) {
        URL.revokeObjectURL(map.get(file)!)
        map.delete(file)
      }
    }
    setPreviews(value.map((file) => ({ file, url: map.get(file)! })))
  }, [value])

  // Revoke everything on unmount.
  useEffect(() => {
    const map = urlMap.current
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url)
      map.clear()
    }
  }, [])

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setError(null)
    const incoming = Array.from(fileList)

    for (const f of incoming) {
      if (!f.type.startsWith('image/')) {
        setError('Only image files are allowed.')
        return
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`Each image must be under ${maxSizeMB} MB.`)
        return
      }
    }

    onChange(multiple ? [...value, ...incoming] : incoming.slice(0, 1))
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <div className="w-full">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver
            ? 'border-gray-900 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
        )}
      >
        <ImagePlus className="h-7 w-7 text-gray-400" />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">Click to upload</span> or
          drag &amp; drop
        </p>
        <p className="text-xs text-gray-400">
          {multiple ? 'PNG, JPG — multiple allowed' : 'PNG or JPG'} · up to{' '}
          {maxSizeMB}MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onInputChange}
        className="hidden"
      />

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map(({ url }, i) => (
            <div
              key={url}
              className="group relative aspect-square animate-[fadeIn_0.2s_ease-out] overflow-hidden rounded-lg border border-gray-200"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-white opacity-0 transition-opacity hover:bg-gray-900 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
