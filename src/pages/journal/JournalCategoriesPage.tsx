import { useState } from 'react'
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import IconButton from '../../components/ui/IconButton'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Table, { type Column } from '../../components/ui/Table'
import Textarea from '../../components/ui/Textarea'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, journalService } from '../../services'
import type { JournalCategory } from '../../types/journal'

type Form = { name: string; slug: string; description: string; seoTitle: string; seoDescription: string }
const toForm = (c: JournalCategory | null): Form => ({
  name: c?.name ?? '',
  slug: c?.slug ?? '',
  description: c?.description ?? '',
  seoTitle: c?.seoTitle ?? '',
  seoDescription: c?.seoDescription ?? '',
})

/** Journal topic hubs (e.g. "Weave guides", "Saree care"): each has its own indexable page. */
export default function JournalCategoriesPage() {
  const list = useApi(() => journalService.listCategories(), [])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<JournalCategory | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(toForm(null))
  const [busy, setBusy] = useState(false)

  const openForm = (c: JournalCategory | null) => {
    setEditing(c)
    setForm(toForm(c))
    setOpen(true)
  }

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error('Give the category a name')
    setBusy(true)
    try {
      await journalService.saveCategory(editing?.id ?? null, {
        name: form.name.trim(),
        ...(form.slug.trim() && { slug: form.slug.trim() }),
        description: form.description.trim() || null,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
      })
      toast.success(editing ? 'Category updated' : 'Category added')
      setOpen(false)
      await list.refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: JournalCategory) => {
    const ok = await confirm({
      title: `Delete “${c.name}”?`,
      message: c._count.posts ? `Its ${c._count.posts} post(s) stay published, without a category.` : 'No posts use it.',
      danger: true,
    })
    if (!ok) return
    try {
      await journalService.removeCategory(c.id)
      toast.success('Category deleted')
      await list.refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<JournalCategory>[] = [
    { header: 'Name', cell: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
    { header: 'URL', cell: (c) => <span className="text-sm text-gray-500">/journal/category/{c.slug}</span> },
    { header: 'Posts', align: 'right', cell: (c) => <span className="tabular-nums text-gray-600">{c._count.posts}</span> },
    {
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" onClick={() => openForm(c)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(c)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journal categories"
        description="Topics that group your posts. Each gets its own page that can rank on Google."
        breadcrumbs={[{ label: 'Journal', to: '/journal' }, { label: 'Categories' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New category
          </Button>
        }
      />
      {list.error ? (
        <ErrorBox message={list.error} onRetry={list.refetch} />
      ) : list.loading && !list.data ? (
        <TableSkeleton columns={4} />
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Start with two or three, e.g. “Weave guides”, “Saree care”, “Styling”."
          icon={FolderOpen}
          action={<Button onClick={() => openForm(null)}>Add a category</Button>}
        />
      ) : (
        <Table columns={columns} data={list.data ?? []} rowKey={(c) => c.id} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={busy} onClick={() => void save()}>
              {editing ? 'Save changes' : 'Add category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="jc-name" label="Name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input id="jc-slug" label="URL (optional)" placeholder="made-from-the-name" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Textarea id="jc-desc" label="Intro (shown on the category page)" rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input id="jc-seo-title" label="SEO title (optional)" maxLength={70} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          <Textarea id="jc-seo-desc" label="Meta description (optional)" rows={2} maxLength={170} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
