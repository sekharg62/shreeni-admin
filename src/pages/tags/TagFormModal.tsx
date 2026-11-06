import { useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ColorInput from '../../components/ui/ColorInput'
import TagPill from '../../components/ui/TagPill'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { tagService } from '../../services'
import { collectErrors, rules, slugify } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import type { Tag } from '../../types'

type Values = { name: string; slug: string; color: string }

const validate = (v: Values) =>
  collectErrors({
    name: [rules.required(v.name, 'Name'), rules.maxLength(v.name, 100, 'Name')],
    slug: [rules.slug(v.slug)],
    color: [rules.hexColor(v.color)],
  })

type Props = {
  open: boolean
  /** null = create a new tag */
  tag: Tag | null
  onClose: () => void
  onSaved: (tag: Tag) => void
}

export default function TagFormModal({ open, tag, onClose, onSaved }: Props) {
  const toast = useToast()
  const form = useForm<Values>({ name: '', slug: '', color: '' }, validate)

  useEffect(() => {
    if (open) form.reset({ name: tag?.name ?? '', slug: tag?.slug ?? '', color: tag?.color ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tag])

  const save = () =>
    form.submit(async (v) => {
      const payload = { name: v.name.trim(), slug: v.slug || undefined, color: v.color || undefined }
      try {
        // The form holds every field, so editing uses PUT: clearing the color really removes it.
        const saved = tag ? await tagService.replace(tag.id, payload) : await tagService.create(payload)
        toast.success(tag ? 'Tag updated' : 'Tag created')
        onSaved(saved)
      } catch (err) {
        reportSaveError(err, { toastError: toast.error, setFieldError: form.setServerError, conflictField: 'slug' })
      }
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tag ? 'Edit tag' : 'New tag'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} data-testid="save-tag">
            {tag ? 'Save changes' : 'Create tag'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <Input
          id="tag-name"
          label="Name"
          placeholder="Saree with blouse piece"
          value={form.values.name}
          onChange={(e) => form.set('name', e.target.value)}
          error={form.errors.name}
          autoFocus
        />
        <Input
          id="tag-slug"
          label="Slug"
          placeholder={slugify(form.values.name) || 'auto-generated-from-name'}
          value={form.values.slug}
          onChange={(e) => form.set('slug', e.target.value)}
          error={form.errors.slug}
          hint="Leave empty to generate it from the name."
        />
        <ColorInput
          id="tag-color"
          label="Badge color"
          value={form.values.color}
          onChange={(c) => form.set('color', c)}
          error={form.errors.color}
        />
        <div className="rounded-lg bg-gray-50 px-3 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Preview on a product</p>
          <TagPill name={form.values.name} color={form.values.color} />
        </div>
        {/* lets Enter submit */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
