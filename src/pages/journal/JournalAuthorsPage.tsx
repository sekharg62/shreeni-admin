import { useState } from 'react'
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import IconButton from '../../components/ui/IconButton'
import ImageField, { emptyImage, type ImageValue } from '../../components/ui/ImageField'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Table, { type Column } from '../../components/ui/Table'
import Textarea from '../../components/ui/Textarea'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, journalService, s3UploadService } from '../../services'
import type { JournalAuthor } from '../../types/journal'

const SOCIALS = ['instagram', 'x', 'linkedin', 'website'] as const
type Form = { name: string; slug: string; role: string; bio: string; avatar: ImageValue; social: Record<(typeof SOCIALS)[number], string> }
const toForm = (a: JournalAuthor | null): Form => ({
  name: a?.name ?? '',
  slug: a?.slug ?? '',
  role: a?.role ?? '',
  bio: a?.bio ?? '',
  avatar: emptyImage(a?.avatarUrl ?? null),
  social: { instagram: a?.socialLinks?.instagram ?? '', x: a?.socialLinks?.x ?? '', linkedin: a?.socialLinks?.linkedin ?? '', website: a?.socialLinks?.website ?? '' },
})

/** People who write for the Journal. Real names, photos and bios build trust (and E-E-A-T for Google). */
export default function JournalAuthorsPage() {
  const list = useApi(() => journalService.listAuthors(), [])
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<JournalAuthor | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(toForm(null))
  const [busy, setBusy] = useState(false)

  const openForm = (a: JournalAuthor | null) => {
    setEditing(a)
    setForm(toForm(a))
    setOpen(true)
  }

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error('Add the author’s name')
    const social: Record<string, string> = Object.fromEntries(Object.entries(form.social).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    if (Object.values(social).some((v) => !/^https?:\/\//.test(v))) return toast.error('Social links must be full addresses starting with https://')
    setBusy(true)
    try {
      let avatarUrl = form.avatar.url
      if (form.avatar.file) avatarUrl = (await s3UploadService.uploadJournalAuthorImage(form.avatar.file)).url
      await journalService.saveAuthor(editing?.id ?? null, {
        name: form.name.trim(),
        ...(form.slug.trim() && { slug: form.slug.trim() }),
        role: form.role.trim() || null,
        bio: form.bio.trim() || null,
        avatarUrl,
        socialLinks: social,
      })
      toast.success(editing ? 'Author updated' : 'Author added')
      setOpen(false)
      await list.refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (a: JournalAuthor) => {
    const ok = await confirm({
      title: `Delete “${a.name}”?`,
      message: a._count.posts ? `Their ${a._count.posts} post(s) stay published, without a byline.` : 'No posts use this author.',
      danger: true,
    })
    if (!ok) return
    try {
      await journalService.removeAuthor(a.id)
      toast.success('Author deleted')
      await list.refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const columns: Column<JournalAuthor>[] = [
    {
      header: 'Author',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
            {a.avatarUrl ? <img src={a.avatarUrl} alt="" className="h-full w-full object-cover" /> : a.name.charAt(0)}
          </span>
          <div>
            <p className="font-medium text-gray-900">{a.name}</p>
            {a.role && <p className="text-xs text-gray-500">{a.role}</p>}
          </div>
        </div>
      ),
    },
    { header: 'URL', cell: (a) => <span className="text-sm text-gray-500">/journal/author/{a.slug}</span> },
    { header: 'Posts', align: 'right', cell: (a) => <span className="tabular-nums text-gray-600">{a._count.posts}</span> },
    {
      header: '',
      align: 'right',
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" onClick={() => openForm(a)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(a)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journal authors"
        description="Named writers with a photo and short bio — shown on every post they write."
        breadcrumbs={[{ label: 'Journal', to: '/journal' }, { label: 'Authors' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New author
          </Button>
        }
      />
      {list.error ? (
        <ErrorBox message={list.error} onRetry={list.refetch} />
      ) : list.loading && !list.data ? (
        <TableSkeleton columns={4} />
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState title="No authors yet" description="Add the people who write your posts." icon={UserRound} action={<Button onClick={() => openForm(null)}>Add an author</Button>} />
      ) : (
        <Table columns={columns} data={list.data ?? []} rowKey={(a) => a.id} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit author' : 'New author'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={busy} onClick={() => void save()}>
              {editing ? 'Save changes' : 'Add author'}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
          <ImageField label="Photo" value={form.avatar} onChange={(v) => setForm({ ...form, avatar: v })} aspect="1 / 1" hint="Square, saved as WebP" />
          <div className="space-y-4">
            <Input id="ja-name" label="Name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input id="ja-role" label="Role (optional)" placeholder="e.g. Founder, Textile writer" value={form.role} maxLength={80} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input id="ja-slug" label="URL (optional)" placeholder="made-from-the-name" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <Textarea id="ja-bio" label="Short bio" rows={3} maxLength={600} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIALS.map((s) => (
              <Input
                key={s}
                id={`ja-${s}`}
                label={s === 'x' ? 'X (Twitter)' : s.charAt(0).toUpperCase() + s.slice(1)}
                placeholder="https://…"
                value={form.social[s]}
                onChange={(e) => setForm({ ...form, social: { ...form.social, [s]: e.target.value } })}
              />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
