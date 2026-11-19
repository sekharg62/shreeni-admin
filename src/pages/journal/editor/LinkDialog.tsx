import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ExternalLink, FileText, Globe, Loader2, Package, Search, Tag as TagIcon } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Checkbox from '../../../components/ui/Checkbox'
import { useDebounce } from '../../../hooks/useDebounce'
import { journalService } from '../../../services'
import { cn } from '../../../lib/cn'
import type { LinkTarget } from '../../../types/journal'

/** Fixed storefront pages you can link to. */
const PAGES = [
  { title: 'Home', path: '/' },
  { title: 'All sarees', path: '/sarees' },
  { title: 'The Journal', path: '/journal' },
  { title: 'Our story', path: '/about/story' },
  { title: 'Craftsmanship', path: '/about/craftsmanship' },
  { title: 'Help centre', path: '/contact/help' },
  { title: 'Shipping & delivery', path: '/shipping' },
  { title: 'Returns & exchange', path: '/returns' },
]

type Target = { type: LinkTarget['type'] | 'PAGE'; id: string | null; title: string; path: string; live: boolean }
type Tab = 'internal' | 'external'

const TYPE_LABEL: Record<Target['type'], string> = { PRODUCT: 'Product', CATEGORY: 'Category', POST: 'Journal post', PAGE: 'Page' }
const TYPE_ICON = { PRODUCT: Package, CATEGORY: TagIcon, POST: FileText, PAGE: Globe } as const

const SAFE_URL = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s-]+)$/i

/**
 * Add / edit a link. Internal links (products, categories, Journal posts, pages) are chosen from a search,
 * never typed, and stored by id. External links get rel options and "open in new tab".
 */
export default function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('internal')
  const [target, setTarget] = useState<Target | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LinkTarget[]>([])
  const [searching, setSearching] = useState(false)
  const [url, setUrl] = useState('')
  const [newTab, setNewTab] = useState(true)
  const [rel, setRel] = useState({ nofollow: false, sponsored: false, ugc: false })
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebounce(query, 250)

  const editing = editor.isActive('link')
  const hasSelection = !editor.state.selection.empty

  // Prefill from the link under the cursor each time the dialog opens.
  useEffect(() => {
    if (!open) return
    const a = editor.getAttributes('link') as Record<string, string | null>
    const id = window.setTimeout(() => {
      setError(null)
      setQuery('')
      setText('')
      if (a.internalType) {
        setTab('internal')
        setTarget({ type: a.internalType as Target['type'], id: a.internalId ?? null, title: a.href ?? '', path: a.href ?? '', live: true })
      } else {
        setTab(a.href ? 'external' : 'internal')
        setTarget(null)
        setUrl(a.href ?? '')
        setNewTab(a.href ? a.target === '_blank' : true)
        const tokens = (a.rel ?? '').split(/\s+/)
        setRel({ nofollow: tokens.includes('nofollow'), sponsored: tokens.includes('sponsored'), ugc: tokens.includes('ugc') })
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [open, editor])

  useEffect(() => {
    if (!open || tab !== 'internal' || debounced.trim().length < 2) return
    let stale = false
    const id = window.setTimeout(() => setSearching(true), 0)
    journalService
      .linkTargets(debounced.trim())
      .then((r) => !stale && setResults(r))
      .catch(() => !stale && setResults([]))
      .finally(() => !stale && setSearching(false))
    return () => {
      stale = true
      window.clearTimeout(id)
    }
  }, [debounced, open, tab])

  const pages = PAGES.filter((p) => !query || p.title.toLowerCase().includes(query.toLowerCase()))

  const apply = () => {
    let attrs: Record<string, unknown>
    let fallbackText: string
    if (tab === 'internal') {
      if (!target) return setError('Choose what to link to.')
      attrs = { href: target.path, internalType: target.type, internalId: target.id, target: null, rel: null }
      fallbackText = target.title
    } else {
      const href = url.trim()
      if (!SAFE_URL.test(href)) return setError('Enter a full address starting with https://, mailto: or tel:')
      const tokens = (Object.keys(rel) as (keyof typeof rel)[]).filter((k) => rel[k])
      attrs = { href, internalType: null, internalId: null, target: newTab ? '_blank' : null, rel: tokens.join(' ') || null }
      fallbackText = href.replace(/^https?:\/\//, '')
    }

    const chain = editor.chain().focus()
    if (editing) chain.extendMarkRange('link').setLink(attrs as { href: string }).run()
    else if (hasSelection) chain.setLink(attrs as { href: string }).run()
    else chain.insertContent({ type: 'text', text: text.trim() || fallbackText, marks: [{ type: 'link', attrs }] }).insertContent(' ').run()
    onClose()
  }

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  const row = (t: Target) => {
    const Icon = TYPE_ICON[t.type]
    const selected = target?.type === t.type && target.id === t.id && target.path === t.path
    return (
      <li key={`${t.type}-${t.id ?? t.path}`}>
        <button
          type="button"
          onClick={() => {
            setTarget(t)
            setError(null)
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
            selected ? 'bg-gray-900 text-white' : 'hover:bg-gray-50',
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-white' : 'text-gray-400')} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{t.title}</span>
            <span className={cn('block truncate text-xs', selected ? 'text-white/70' : 'text-gray-500')}>
              {TYPE_LABEL[t.type]} · {t.path}
            </span>
          </span>
          {!t.live && (
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', selected ? 'bg-white/20' : 'bg-amber-100 text-amber-800')}>
              Not live
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit link' : 'Add link'}
      size="lg"
      footer={
        <>
          {editing && (
            <Button variant="ghost" onClick={remove} className="mr-auto text-red-600">
              Remove link
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply} data-testid="apply-link">
            {editing ? 'Update link' : 'Add link'}
          </Button>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
        {(['internal', 'external'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setError(null)
            }}
            className={cn('rounded-md py-2 transition-colors', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800')}
          >
            {t === 'internal' ? 'On Shreeni (internal)' : 'Other website (external)'}
          </button>
        ))}
      </div>

      {!editing && !hasSelection && (
        <Input
          id="link-text"
          label="Link text"
          placeholder="Words shown in the article (leave empty to use the page name)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {tab === 'internal' ? (
        <div className="mt-4">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 focus-within:border-gray-900">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories or Journal posts…"
              aria-label="Search link targets"
              className="h-full w-full bg-transparent text-sm outline-none"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {target && (
            <p className="mt-2 text-xs text-gray-500">
              Linking to <span className="font-semibold text-gray-800">{target.title}</span> ({TYPE_LABEL[target.type]}). The link
              follows it even if its URL changes later.
            </p>
          )}
          <ul className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
            {debounced.trim().length >= 2 &&
              results.map((r) => row({ type: r.type, id: r.id, title: r.title, path: r.path, live: r.live }))}
            {debounced.trim().length >= 2 && !searching && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No products, categories or posts match.</li>
            )}
            {pages.length > 0 && <li className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pages</li>}
            {pages.map((p) => row({ type: 'PAGE', id: null, title: p.title, path: p.path, live: true }))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Input
            id="link-url"
            label="Web address"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            leftIcon={<ExternalLink className="h-4 w-4" />}
          />
          <div className="space-y-2.5 rounded-lg border border-gray-200 p-4">
            <Checkbox label="Open in a new tab" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
            <Checkbox
              label="nofollow — don't pass ranking to this site (links you don't vouch for)"
              checked={rel.nofollow}
              onChange={(e) => setRel((r) => ({ ...r, nofollow: e.target.checked }))}
            />
            <Checkbox
              label="sponsored — paid, affiliate or gifted (Google requires this)"
              checked={rel.sponsored}
              onChange={(e) => setRel((r) => ({ ...r, sponsored: e.target.checked }))}
            />
            <Checkbox
              label="ugc — user-generated content (e.g. a customer's post)"
              checked={rel.ugc}
              onChange={(e) => setRel((r) => ({ ...r, ugc: e.target.checked }))}
            />
            <p className="text-xs text-gray-500">New-tab links automatically get “noopener noreferrer” for safety.</p>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </Modal>
  )
}
