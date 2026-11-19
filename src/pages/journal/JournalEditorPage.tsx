import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, ExternalLink, Link2, Trash2, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import DateTimePicker from '../../components/ui/DateTimePicker'
import ErrorBox from '../../components/ui/ErrorBox'
import ImageField, { emptyImage, type ImageValue } from '../../components/ui/ImageField'
import Input from '../../components/ui/Input'
import ProductPicker, { type PickedProduct } from '../../components/ui/ProductPicker'
import SearchableSelect from '../../components/ui/SearchableSelect'
import Skeleton from '../../components/ui/Skeleton'
import Switch from '../../components/ui/Switch'
import Textarea from '../../components/ui/Textarea'
import { useApi } from '../../hooks/useApi'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, journalService, s3UploadService } from '../../services'
import { STOREFRONT_URL } from '../../constants/app'
import { cn } from '../../lib/cn'
import type { JournalDoc, JournalPost, JournalPostPayload, JournalState, JournalStatus } from '../../types/journal'
import RichEditor from './editor/RichEditor'
import SeoPanel, { type SeoValues } from './editor/SeoPanel'
import { EMPTY_DOC } from './editor/extensions'
import { STATE_BADGE } from './journalMeta'


type Form = SeoValues & {
  title: string
  slug: string
  excerpt: string
  content: JournalDoc
  cover: ImageValue
  coverAlt: string
  /** When the post goes live; null = now, when publishing */
  publishAt: Date | null
  isFeatured: boolean
  categoryId: string
  authorId: string
  tags: string[]
  products: PickedProduct[]
}


const toForm = (p: JournalPost | null): Form => ({
  title: p?.title ?? '',
  slug: p?.slug ?? '',
  excerpt: p?.excerpt ?? '',
  content: p?.content ?? EMPTY_DOC,
  cover: emptyImage(p?.coverImageUrl ?? null),
  coverAlt: p?.coverAlt ?? '',
  publishAt: p?.publishedAt ? new Date(p.publishedAt) : null,
  isFeatured: p?.isFeatured ?? false,
  categoryId: p?.categoryId ?? '',
  authorId: p?.authorId ?? '',
  tags: p?.tags ?? [],
  products: p?.products.map((x) => ({ id: x.id, name: x.name, imageUrl: x.imageUrl })) ?? [],
  seoTitle: p?.seoTitle ?? '',
  seoDescription: p?.seoDescription ?? '',
  focusKeyword: p?.focusKeyword ?? '',
  canonicalUrl: p?.canonicalUrl ?? '',
  noindex: p?.noindex ?? false,
})

const snapshot = (f: Form) => JSON.stringify({ ...f, cover: f.cover.url, coverFile: f.cover.file?.name ?? null })

function Card({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Tag chips: type and press Enter or comma. */
function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim().replace(/,$/, '')
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase()) && value.length < 15) onChange([...value, t])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">Tags</span>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 focus-within:border-gray-900">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-gray-700">
            {t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((v) => v !== t))} className="rounded-full p-0.5 hover:bg-gray-200">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={value.length ? '' : 'e.g. silk, wedding, care'}
          aria-label="Add a tag"
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  )
}

/** Create or edit a Journal post. */
export default function JournalEditorPage({ id }: { id?: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const post = useApi(() => (id ? journalService.getPost(id) : Promise.resolve(null)), [id])
  const categories = useApi(() => journalService.listCategories(), [])
  const authors = useApi(() => journalService.listAuthors(), [])

  const [server, setServer] = useState<JournalPost | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [saved, setSaved] = useState<string>('')
  const [words, setWords] = useState(0)
  const [saving, setSaving] = useState<JournalStatus | 'update' | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  /** When the page opened: is the chosen publish date in the future (= scheduling)? */
  const [openedAt] = useState(() => Date.now())

  // First load: copy the post into the form once.
  const loaded = id ? (post.data ?? null) : null
  if (!form && (!id || loaded)) {
    const f = toForm(loaded)
    setForm(f)
    setSaved(snapshot(f))
    setServer(loaded)
  }

  const dirty = !!form && snapshot(form) !== saved
  useUnsavedChangesGuard(dirty)

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))
  const patch = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f))

  const categoryOptions = useMemo(() => [{ label: 'No category', value: '' }, ...(categories.data ?? []).map((c) => ({ label: c.name, value: c.id }))], [categories.data])
  const authorOptions = useMemo(() => [{ label: 'No author', value: '' }, ...(authors.data ?? []).map((a) => ({ label: a.name, value: a.id }))], [authors.data])

  if (post.error) return <ErrorBox message={post.error} onRetry={post.refetch} />
  if (!form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[560px] w-full rounded-xl" />
      </div>
    )
  }

  const state: JournalState = server?.state ?? 'draft'
  const live = state === 'published'
  const futureDate = !!form.publishAt && form.publishAt.getTime() > openedAt
  const brokenLinks = server?.linksOut.filter((l) => l.broken).length ?? 0
  const slugChangedOnLive = live && !!server && form.slug.trim() !== '' && form.slug.trim() !== server.slug

  const save = async (status: JournalStatus | 'update') => {
    if (form.title.trim().length < 3) {
      setTitleError('Give the post a title (at least 3 characters).')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setTitleError(null)
    setSaving(status)
    try {
      let coverImageUrl = form.cover.url
      if (form.cover.file) coverImageUrl = (await s3UploadService.uploadJournalImage(form.cover.file)).url
      const payload: JournalPostPayload = {
        title: form.title.trim(),
        ...(form.slug.trim() && { slug: form.slug.trim() }),
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        coverImageUrl,
        coverAlt: form.coverAlt.trim() || null,
        ...(status !== 'update' && { status }),
        // The date field is the source of truth; empty + publishing = "now" (set by the server).
        publishedAt: form.publishAt ? form.publishAt.toISOString() : null,
        isFeatured: form.isFeatured,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        focusKeyword: form.focusKeyword.trim() || null,
        canonicalUrl: form.canonicalUrl.trim() || null,
        noindex: form.noindex,
        categoryId: form.categoryId || null,
        authorId: form.authorId || null,
        tags: form.tags,
        productIds: form.products.map((p) => p.id),
      }
      const result = server ? await journalService.updatePost(server.id, payload) : await journalService.createPost(payload)
      const next = toForm(result)
      setServer(result)
      setForm(next)
      setSaved(snapshot(next))
      toast.success(
        result.state === 'published'
          ? 'Published — it’s live on the Journal'
          : result.state === 'scheduled'
            ? `Scheduled for ${new Date(result.publishedAt!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
            : result.state === 'archived'
              ? 'Archived — hidden from the Journal'
              : 'Draft saved',
      )
      if (!server) navigate(`/journal/${result.id}`, { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const remove = async () => {
    if (!server) return
    const ok = await confirm({
      title: `Delete “${server.title}”?`,
      message: 'The post and its links are removed. Its images stay in storage. This can’t be undone.',
      danger: true,
    })
    if (!ok) return
    try {
      await journalService.removePost(server.id)
      toast.success('Post deleted')
      navigate('/journal', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const badge = STATE_BADGE[state]
  const publishLabel = futureDate ? 'Schedule' : 'Publish'

  return (
    <div>
      <PageHeader
        title={server ? 'Edit post' : 'New post'}
        breadcrumbs={[{ label: 'Journal', to: '/journal' }, { label: server ? server.title : 'New post' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {live && server && (
              <a
                href={`${STOREFRONT_URL}/journal/${server.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                View on site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {state === 'draft' || state === 'archived' ? (
              <>
                <Button variant="outline" isLoading={saving === 'DRAFT'} onClick={() => void save('DRAFT')}>
                  Save draft
                </Button>
                <Button isLoading={saving === 'PUBLISHED'} onClick={() => void save('PUBLISHED')} data-testid="publish-post">
                  {publishLabel}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" isLoading={saving === 'DRAFT'} onClick={() => void save('DRAFT')}>
                  Move to drafts
                </Button>
                <Button isLoading={saving === 'update'} onClick={() => void save('update')} data-testid="update-post">
                  {state === 'scheduled' ? 'Update schedule' : 'Update'}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ───── Writing ───── */}
        <div className="min-w-0 space-y-4">
          <div>
            <textarea
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value.replace(/\n/g, ' '))
                setTitleError(null)
              }}
              rows={1}
              maxLength={150}
              placeholder="Post title"
              aria-label="Post title"
              className="w-full resize-none bg-transparent text-3xl font-bold leading-tight text-gray-900 outline-none placeholder:text-gray-300 [field-sizing:content]"
            />
            {titleError && <p className="text-sm text-red-600">{titleError}</p>}
            <Textarea
              rows={2}
              maxLength={300}
              placeholder="Excerpt: one or two sentences shown on the Journal page and in search results"
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              aria-label="Excerpt"
            />
          </div>

          <RichEditor value={form.content} onChange={(doc) => set('content', doc)} onStats={({ words: w }) => setWords(w)} />
          <p className="text-xs text-gray-500">
            {words} words · about {Math.max(1, Math.round(words / 200))} min read · Ctrl+K adds a link
          </p>

          {/* Links report */}
          <Card title="Links" actions={<span className="text-xs text-gray-400">Updated when you save</span>}>
            {!server ? (
              <p className="text-sm text-gray-500">Save the post to see its links.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Links out ({server.linksOut.length})
                  </p>
                  {server.linksOut.length === 0 ? (
                    <p className="text-sm text-gray-400">No links yet. Link to a product or another post to help readers (and SEO).</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {server.linksOut.map((l, i) => (
                        <li key={i} className={cn('rounded-lg border px-3 py-2', l.broken ? 'border-red-200 bg-red-50' : 'border-gray-100')}>
                          <p className="truncate font-medium text-gray-800">“{l.anchorText}”</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            <Badge variant={l.kind === 'INTERNAL' ? 'info' : 'neutral'}>{l.kind === 'INTERNAL' ? l.targetType.toLowerCase() : 'external'}</Badge>
                            <span className="truncate">{l.href}</span>
                            {l.rel && <span className="font-mono text-[10px] text-gray-600">rel={l.rel}</span>}
                            {l.newTab && <span className="text-[10px]">new tab</span>}
                          </p>
                          {l.broken && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> Target removed or not public: hidden from readers. Edit or remove this link.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <Link2 className="h-3.5 w-3.5" /> Linked from ({server.linkedFrom.length})
                  </p>
                  {server.linkedFrom.length === 0 ? (
                    <p className="text-sm text-gray-400">No other post links here yet. Link to it from related posts to help it rank.</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {server.linkedFrom.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => navigate(`/journal/${p.id}`)} className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left hover:bg-gray-50">
                            <span className="block truncate font-medium text-gray-800">{p.title}</span>
                            <span className="block truncate text-xs text-gray-500">
                              via “{p.anchorText}” · {STATE_BADGE[p.state].label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ───── Sidebar ───── */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card title="Publish" actions={<Badge variant={badge.variant}>{badge.label}</Badge>}>
            <div className="space-y-3">
              <div>
                <DateTimePicker id="publish-at" label="Publish date" placeholder="Publish immediately" value={form.publishAt} onChange={(d) => set('publishAt', d)} />
                <p className="mt-1 text-xs text-gray-500">
                  {futureDate ? 'In the future: the post goes live then (scheduled).' : 'Leave empty to publish immediately.'}
                </p>
              </div>
              <Switch checked={form.isFeatured} onChange={(on) => set('isFeatured', on)} label="Feature at the top of the Journal" />
              {server && (
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {state !== 'archived' && (
                    <Button size="sm" variant="ghost" isLoading={saving === 'ARCHIVED'} onClick={() => void save('ARCHIVED')}>
                      Archive
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-600" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => void remove()}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card title="URL">
            <div className="flex h-10 items-center overflow-hidden rounded-lg border border-gray-300 text-sm focus-within:border-gray-900">
              <span className="shrink-0 bg-gray-50 px-2.5 py-2.5 text-gray-500">/journal/</span>
              <input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-/, ''))}
                placeholder="made-from-the-title"
                aria-label="URL slug"
                className="h-full min-w-0 flex-1 px-2 outline-none"
              />
            </div>
            {slugChangedOnLive && (
              <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
                This post is live. The old address will redirect (301) to the new one, so links and rankings carry over.
              </p>
            )}
            {server && server.oldSlugs.length > 0 && <p className="mt-2 text-xs text-gray-500">Redirects from: {server.oldSlugs.map((s) => `/journal/${s}`).join(', ')}</p>}
          </Card>

          <Card title="Organise">
            <div className="space-y-3">
              <SearchableSelect label="Category" options={categoryOptions} value={form.categoryId} onChange={(v) => set('categoryId', v)} placeholder="Choose a category" />
              <SearchableSelect label="Author" options={authorOptions} value={form.authorId} onChange={(v) => set('authorId', v)} placeholder="Choose an author" />
              <TagInput value={form.tags} onChange={(t) => set('tags', t)} />
              {(categories.data?.length === 0 || authors.data?.length === 0) && (
                <p className="text-xs text-gray-500">
                  Add {categories.data?.length === 0 ? 'categories' : ''}
                  {categories.data?.length === 0 && authors.data?.length === 0 ? ' and ' : ''}
                  {authors.data?.length === 0 ? 'authors' : ''} under Journal in the menu.
                </p>
              )}
            </div>
          </Card>

          <Card title="Cover image">
            <ImageField label="" value={form.cover} onChange={(v) => set('cover', v)} aspect="16 / 9" hint="1600 × 900 px works best. Saved as WebP." />
            <Input
              id="cover-alt"
              label="Cover alt text"
              placeholder="Describe the image"
              value={form.coverAlt}
              maxLength={200}
              onChange={(e) => set('coverAlt', e.target.value)}
              error={(form.cover.url || form.cover.file) && !form.coverAlt.trim() ? 'Required to publish' : undefined}
            />
          </Card>

          <Card title="Shop this story">
            <ProductPicker label="Products shown with the post" value={form.products} onChange={(v) => set('products', v)} max={12} />
          </Card>

          <Card title="SEO">
            <SeoPanel
              values={form}
              onChange={patch}
              title={form.title}
              slug={form.slug || server?.slug || ''}
              excerpt={form.excerpt}
              content={form.content}
              words={words}
              hasCover={!!(form.cover.url || form.cover.file)}
              coverAlt={form.coverAlt}
              brokenLinks={brokenLinks}
            />
          </Card>
        </aside>
      </div>
    </div>
  )
}
