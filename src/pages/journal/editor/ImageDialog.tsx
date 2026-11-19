import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ImagePlus, Loader2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { s3UploadService, getApiErrorMessage } from '../../../services'
import { MAX_IMAGE_SIZE_MB } from '../../../constants/app'

type Picked = { src: string; width: number | null; height: number | null }

/**
 * Insert an image into the post (uploaded → journal/{uuid}.webp), or edit the selected image's alt text
 * and caption. Alt text is required: it's read by screen readers and Google Images.
 */
export default function ImageDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const editing = editor.isActive('image')
  const [image, setImage] = useState<Picked | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const a = editor.getAttributes('image') as Record<string, string | number | null>
    const id = window.setTimeout(() => {
      setError(null)
      setProgress(0)
      if (editing && a.src) {
        setImage({ src: String(a.src), width: Number(a.width) || null, height: Number(a.height) || null })
        setAlt(String(a.alt ?? ''))
        setCaption(String(a.title ?? ''))
      } else {
        setImage(null)
        setAlt('')
        setCaption('')
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [open, editing, editor])

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Choose an image file.')
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return setError(`Images must be under ${MAX_IMAGE_SIZE_MB} MB.`)
    setError(null)
    setUploading(true)
    try {
      const up = await s3UploadService.uploadJournalImage(file, (p) => setProgress(p))
      setImage({ src: up.url, width: up.width, height: up.height })
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const apply = () => {
    if (!image) return setError('Upload an image first.')
    if (!alt.trim()) return setError('Describe the image (alt text): what would someone who can’t see it need to know?')
    const attrs = { src: image.src, alt: alt.trim(), title: caption.trim() || null, width: image.width, height: image.height }
    if (editing) editor.chain().focus().updateAttributes('image', attrs).run()
    else editor.chain().focus().setImage(attrs as { src: string }).run()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit image' : 'Add image'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={uploading} data-testid="apply-image">
            {editing ? 'Update image' : 'Insert image'}
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void upload(f)
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) void upload(f)
        }}
        className="relative flex min-h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition-colors hover:border-gray-500"
      >
        {image ? (
          <img src={image.src} alt="" className="max-h-72 w-auto object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 p-6">
            <ImagePlus className="h-8 w-8 text-gray-400" />
            Click or drop an image (JPG, PNG or WebP, up to {MAX_IMAGE_SIZE_MB} MB). Saved as WebP.
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 font-medium text-gray-700">
            <Loader2 className="h-5 w-5 animate-spin" /> Uploading… {progress}%
          </span>
        )}
      </button>
      {image && (
        <p className="mt-1.5 text-xs text-gray-500">
          {image.width && image.height ? `${image.width} × ${image.height} px · ` : ''}Click the image to replace it.
        </p>
      )}

      <div className="mt-4 space-y-4">
        <Input
          id="image-alt"
          label="Alt text (required)"
          placeholder="e.g. Close-up of a Baluchori pallu with Ramayana motifs"
          value={alt}
          maxLength={200}
          onChange={(e) => setAlt(e.target.value)}
          hint="Describe what's in the picture. Read aloud by screen readers and used by Google Images."
        />
        <Input
          id="image-caption"
          label="Caption (optional)"
          placeholder="Shown under the image"
          value={caption}
          maxLength={200}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </Modal>
  )
}
