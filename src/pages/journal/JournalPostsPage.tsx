import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageOff, NotebookPen, Plus, Search, Star } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Pagination from '../../components/ui/Pagination'
import Table, { type Column } from '../../components/ui/Table'
import Tabs from '../../components/ui/Tabs'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useUrlState } from '../../hooks/useUrlState'
import { journalService } from '../../services'
import { formatDateTime } from '../../lib/date'
import type { JournalPostListItem, JournalState } from '../../types/journal'
import { STATE_BADGE } from './journalMeta'

const TABS: { value: '' | JournalState; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const columns: Column<JournalPostListItem>[] = [
  {
    header: 'Post',
    cell: (p) => (
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
          {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-4 w-4 text-gray-300" />}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-medium text-gray-900">
            {p.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
            <span className="truncate">{p.title}</span>
          </p>
          <p className="truncate text-xs text-gray-500">/journal/{p.slug}</p>
        </div>
      </div>
    ),
  },
  { header: 'Status', cell: (p) => <Badge variant={STATE_BADGE[p.state].variant}>{STATE_BADGE[p.state].label}</Badge> },
  { header: 'Category', cell: (p) => <span className="text-sm text-gray-600">{p.category?.name ?? '—'}</span> },
  { header: 'Author', cell: (p) => <span className="text-sm text-gray-600">{p.author?.name ?? '—'}</span> },
  {
    header: 'Date',
    cell: (p) => (
      <span className="whitespace-nowrap text-sm text-gray-600">
        {p.publishedAt ? formatDateTime(p.publishedAt) : <span className="text-gray-400">Updated {formatDateTime(p.updatedAt)}</span>}
      </span>
    ),
  },
  { header: 'Words', align: 'right', cell: (p) => <span className="text-sm tabular-nums text-gray-600">{p.wordCount.toLocaleString('en-IN')}</span> },
]

/** All Journal posts, by state. */
export default function JournalPostsPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useUrlState({ status: '', q: '', page: '1' })
  const [search, setSearch] = useState(url.q)
  const debounced = useDebounce(search, 300)
  const page = Number(url.page) || 1

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced, page: '1' })
  }, [debounced, url.q, setUrl])

  const list = useApi(
    () => journalService.listPosts({ page, limit: 20, search: url.q, status: url.status as JournalState | '' }),
    [page, url.q, url.status],
  )
  const counts = list.data?.counts
  const rows = list.data?.data ?? []

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Stories, weave guides and care tips — published on the storefront at /journal."
        breadcrumbs={[{ label: 'Journal' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/journal/new')}>
            New post
          </Button>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          tabs={TABS.map((t) => ({ value: t.value || 'all', label: t.label, count: counts ? counts[t.value || 'all'] : undefined }))}
          value={url.status || 'all'}
          onChange={(v) => setUrl({ status: v === 'all' ? '' : v, page: '1' })}
        />
      </div>

      <div className="mb-4 flex h-10 max-w-md items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-gray-900">
        <Search className="h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title…" aria-label="Search posts" className="h-full w-full bg-transparent text-sm outline-none" />
      </div>

      {list.error ? (
        <ErrorBox message={list.error} onRetry={list.refetch} />
      ) : list.loading && !list.data ? (
        <TableSkeleton columns={6} />
      ) : rows.length === 0 ? (
        url.q || url.status ? (
          <EmptyState title="No posts match" description="Try another search or status." icon={NotebookPen} />
        ) : (
          <EmptyState
            title="No Journal posts yet"
            description="Write weave guides, care tips and behind-the-loom stories. They bring shoppers in from Google and build trust."
            icon={NotebookPen}
            action={<Button onClick={() => navigate('/journal/new')}>Write the first post</Button>}
          />
        )
      ) : (
        <div className={list.loading ? 'opacity-60 transition-opacity' : undefined}>
          <Table columns={columns} data={rows} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/journal/${p.id}`)} />
          {list.data && (
            <div className="mt-4">
              <Pagination page={list.data.meta.page} limit={list.data.meta.limit} total={list.data.meta.total} onPageChange={(p) => setUrl({ page: String(p) })} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
