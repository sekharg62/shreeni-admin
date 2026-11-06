import { useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Switch from '../../components/ui/Switch'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { collectionService } from '../../services'
import { collectErrors, rules, slugify } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import type { Collection } from '../../types'

type Values = { name: string; slug: string; description: string; isActive: boolean }

const validate = (v: Values) =>
  collectErrors({
    name: [rules.required(v.name, 'Name'), rules.maxLength(v.name, 120, 'Name')],
    slug: [rules.slug(v.slug)],
    description: [],
    isActive: [],
  })

type Props = {
  open: boolean
  collection: Collection | null
  onClose: () => void
  onSaved: (c: Collection) => void
}

export default function CollectionFormModal({ open, collection, onClose, onSaved }: Props) {
  const toast = useToast()
  const form = useForm<Values>({ name: '', slug: '', description: '', isActive: true }, validate)

  useEffect(() => {
    if (open)
      form.reset({
        name: collection?.name ?? '',
        slug: collection?.slug ?? '',
        description: collection?.description ?? '',
        isActive: collection?.isActive ?? true,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collection])

  const save = () =>
    form.submit(async (v) => {
      const payload = {
        name: v.name.trim(),
        slug: v.slug || undefined,
        description: v.description.trim() || undefined,
        isActive: v.isActive,
      }
      try {
        const saved = collection
          ? await collectionService.replace(collection.id, payload)
          : await collectionService.create(payload)
        toast.success(collection ? 'Collection updated' : 'Collection created')
        onSaved(saved)
      } catch (err) {
        reportSaveError(err, { toastError: toast.error, setFieldError: form.setServerError, conflictField: 'slug' })
      }
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collection ? 'Edit collection' : 'New collection'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} data-testid="save-collection">
            {collection ? 'Save changes' : 'Create collection'}
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
          id="collection-name"
          label="Name"
          placeholder="Diwali Edit"
          value={form.values.name}
          onChange={(e) => form.set('name', e.target.value)}
          error={form.errors.name}
          autoFocus
        />
        <Input
          id="collection-slug"
          label="Slug"
          placeholder={slugify(form.values.name) || 'auto-generated-from-name'}
          value={form.values.slug}
          onChange={(e) => form.set('slug', e.target.value)}
          error={form.errors.slug}
          hint={`Page URL: /collections/${form.values.slug || slugify(form.values.name) || '…'}`}
        />
        <Textarea
          id="collection-description"
          label="Description"
          placeholder="Festive sarees for the season of lights."
          rows={3}
          value={form.values.description}
          onChange={(e) => form.set('description', e.target.value)}
        />
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Active</p>
            <p className="text-xs text-gray-500">Inactive collections are hidden from the store.</p>
          </div>
          <Switch checked={form.values.isActive} onChange={(on) => form.set('isActive', on)} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
