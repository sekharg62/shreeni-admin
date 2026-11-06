import { useEffect, useMemo, useState } from 'react'
import Drawer from '../../components/ui/Drawer'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Dropdown from '../../components/ui/Dropdown'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ButtonGroup from '../../components/ui/ButtonGroup'
import ImageField, { emptyImage, type ImageValue } from '../../components/ui/ImageField'
import Skeleton from '../../components/ui/Skeleton'
import ErrorBox from '../../components/ui/ErrorBox'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { categoryService, getApiErrorMessage, s3UploadService } from '../../services'
import { collectErrors, rules, slugify } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import { flattenWithPaths, findNode, siblingsOf, subtreeIds } from '../../lib/categoryTree'
import {
  CATALOG_STATUS_OPTIONS,
  CatalogStatus,
  GENDER_OPTIONS,
  type Gender,
} from '../../constants/enums'
import type { CategoryTreeNode } from '../../types/models'

type Values = {
  name: string
  slug: string
  parentId: string
  gender: string
  description: string
  status: CatalogStatus
  banner: ImageValue
  poster: ImageValue
}

const BLANK: Values = {
  name: '',
  slug: '',
  parentId: '',
  gender: '',
  description: '',
  status: CatalogStatus.DRAFT,
  banner: emptyImage(),
  poster: emptyImage(),
}

const STATUS_HINT: Record<CatalogStatus, string> = {
  DRAFT: 'Work in progress — not shown in the store.',
  PUBLISHED: 'Visible in the store menu and category pages.',
  UNPUBLISHED: 'Hidden from the store for now; can be published again.',
  DISCONTINUED: 'No longer sold. Hidden from the store.',
}

const validate = (v: Values) =>
  collectErrors({
    name: [rules.required(v.name, 'Name'), rules.maxLength(v.name, 120, 'Name')],
    slug: [rules.slug(v.slug)],
  })

type Props = {
  open: boolean
  /** id of the category being edited; null = create */
  editingId: string | null
  /** pre-selected parent when creating ("Add sub-category") */
  defaultParentId: string | null
  tree: CategoryTreeNode[]
  onClose: () => void
  onSaved: () => void
}

export default function CategoryFormDrawer({ open, editingId, defaultParentId, tree, onClose, onSaved }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const form = useForm<Values>(BLANK, validate)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState(0)
  const [originalParent, setOriginalParent] = useState<string>('')

  const load = async () => {
    if (!editingId) {
      form.reset({ ...BLANK, parentId: defaultParentId ?? '' })
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const c = await categoryService.get(editingId)
      form.reset({
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ?? '',
        gender: c.gender ?? '',
        description: c.description ?? '',
        status: c.status,
        banner: emptyImage(c.bannerUrl),
        poster: emptyImage(c.posterUrl),
      })
      setSortOrder(c.sortOrder)
      setOriginalParent(c.parentId ?? '')
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, defaultParentId])

  /** Parent choices: every category except this one and its own sub-categories. */
  const parentOptions = useMemo(() => {
    const self = editingId ? findNode(tree, editingId) : undefined
    const blocked = self ? subtreeIds(self) : new Set<string>()
    return [
      { label: 'None — top-level category', value: '' },
      ...flattenWithPaths(tree)
        .filter((c) => !blocked.has(c.id))
        .map((c) => ({ label: c.path, value: c.id })),
    ]
  }, [tree, editingId])

  const close = async () => {
    if (form.dirty && !form.submitting) {
      const leave = await confirm({
        title: 'Discard changes?',
        message: 'You have unsaved changes in this category.',
        confirmLabel: 'Discard',
        danger: true,
      })
      if (!leave) return
    }
    onClose()
  }

  const save = () =>
    form.submit(async (v) => {
      const parentId = v.parentId || null
      // Keep the current position; a category moved to a new parent goes to the end of that list.
      const position =
        editingId && v.parentId === originalParent ? sortOrder : siblingsOf(tree, parentId).length
      const payload = {
        name: v.name.trim(),
        slug: v.slug || undefined,
        description: v.description.trim() || undefined,
        parentId,
        gender: (v.gender || undefined) as Gender | undefined,
        status: v.status,
        sortOrder: position,
        bannerUrl: v.banner.url ?? undefined,
        posterUrl: v.poster.url ?? undefined,
      }
      let id: string
      try {
        id = editingId
          ? (await categoryService.replace(editingId, payload)).id
          : (await categoryService.create(payload)).id
      } catch (err) {
        reportSaveError(err, { toastError: toast.error, setFieldError: form.setServerError, conflictField: 'slug' })
        return
      }

      // Images upload after the category exists (they go to categories/{id}/).
      const failed: string[] = []
      for (const kind of ['banner', 'poster'] as const) {
        const file = v[kind].file
        if (!file) continue
        try {
          await s3UploadService.uploadCategoryImage(id, kind, file)
        } catch (err) {
          failed.push(`${kind}: ${getApiErrorMessage(err)}`)
        }
      }
      if (failed.length) toast.error(`Category saved, but an image failed — ${failed.join('; ')}`)
      else toast.success(editingId ? 'Category updated' : 'Category created')
      onSaved()
    })

  const title = editingId ? 'Edit category' : defaultParentId ? 'New sub-category' : 'New category'
  const parentName = defaultParentId && !editingId ? findNode(tree, defaultParentId)?.name : undefined

  return (
    <Drawer
      open={open}
      onClose={() => void close()}
      title={title}
      description={parentName ? `Inside “${parentName}”` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => void close()}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} disabled={loading || !!loadError} data-testid="save-category">
            {editingId ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      {loadError ? (
        <ErrorBox message={loadError} onRetry={load} />
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <section className="space-y-4">
            <Input
              id="category-name"
              label="Name"
              placeholder="Baluchori"
              value={form.values.name}
              onChange={(e) => form.set('name', e.target.value)}
              error={form.errors.name}
              autoFocus
            />
            <Input
              id="category-slug"
              label="Slug"
              placeholder={slugify(form.values.name) || 'auto-generated-from-name'}
              value={form.values.slug}
              onChange={(e) => form.set('slug', e.target.value)}
              error={form.errors.slug}
              hint={`Store URL: /category/${form.values.slug || slugify(form.values.name) || '…'}`}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SearchableSelect
                label="Parent category"
                options={parentOptions}
                value={form.values.parentId}
                onChange={(v) => form.set('parentId', v)}
              />
              <Dropdown
                label="For"
                options={[{ label: 'Not set', value: '' }, ...GENDER_OPTIONS]}
                value={form.values.gender}
                onChange={(v) => form.set('gender', v)}
              />
            </div>
            <Textarea
              id="category-description"
              label="Description"
              rows={3}
              placeholder="Hand-woven silk sarees from Bishnupur with mythological motifs on the pallu."
              value={form.values.description}
              onChange={(e) => form.set('description', e.target.value)}
            />
          </section>

          <section>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Status</span>
            <ButtonGroup
              size="sm"
              options={CATALOG_STATUS_OPTIONS}
              value={form.values.status}
              onChange={(v) => form.set('status', v as CatalogStatus)}
            />
            <p className="mt-1.5 text-xs text-gray-500">{STATUS_HINT[form.values.status]}</p>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <ImageField
              label="Banner"
              aspect="16 / 5"
              hint="Wide image at the top of the category page (about 1920 × 600)."
              value={form.values.banner}
              onChange={(v) => form.set('banner', v)}
              testId="category-banner"
            />
            <div className="max-w-[220px]">
              <ImageField
                label="Poster"
                aspect="3 / 4"
                hint="Tall card for menus and the homepage."
                value={form.values.poster}
                onChange={(v) => form.set('poster', v)}
                testId="category-poster"
              />
            </div>
          </section>
          <button type="submit" className="hidden" />
        </form>
      )}
    </Drawer>
  )
}
