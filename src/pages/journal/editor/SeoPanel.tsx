import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import Input from '../../../components/ui/Input'
import Textarea from '../../../components/ui/Textarea'
import Switch from '../../../components/ui/Switch'
import { STOREFRONT_URL } from '../../../constants/app'
import { cn } from '../../../lib/cn'
import type { JournalDoc } from '../../../types/journal'

export type SeoValues = {
  seoTitle: string
  seoDescription: string
  focusKeyword: string
  canonicalUrl: string
  noindex: boolean
}

type Props = {
  values: SeoValues
  onChange: (patch: Partial<SeoValues>) => void
  title: string
  slug: string
  excerpt: string
  content: JournalDoc
  words: number
  hasCover: boolean
  coverAlt: string
  brokenLinks: number
}

type Node = { type: string; text?: string; content?: Node[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] }
const textOf = (n: Node): string => (n.type === 'text' ? (n.text ?? '') : (n.content ?? []).map(textOf).join(' '))

/** What the editor's document contains, for the checks. */
function inspect(doc: JournalDoc) {
  const nodes = (doc.content ?? []) as Node[]
  const firstParagraph = textOf(nodes.find((n) => n.type === 'paragraph' && textOf(n).trim()) ?? { type: 'p' })
  const headings: string[] = []
  let internal = 0
  let external = 0
  const walk = (n: Node) => {
    if (n.type === 'heading') headings.push(textOf(n))
    if (n.type === 'text') {
      const link = n.marks?.find((m) => m.type === 'link')
      if (link) {
        if (link.attrs?.internalType) internal += 1
        else external += 1
      }
    }
    n.content?.forEach(walk)
  }
  nodes.forEach(walk)
  return { firstParagraph, headings, internal, external }
}

const has = (hay: string, needle: string) => !!needle && hay.toLowerCase().includes(needle.toLowerCase())

function Counter({ value, ideal, max }: { value: number; ideal: [number, number]; max: number }) {
  const tone = value === 0 ? 'text-gray-400' : value > max ? 'text-red-600' : value < ideal[0] || value > ideal[1] ? 'text-amber-600' : 'text-green-700'
  return (
    <span className={cn('text-xs font-medium tabular-nums', tone)}>
      {value}/{ideal[1]}
    </span>
  )
}

/** SEO fields, a Google result preview and an on-page checklist. */
export default function SeoPanel({ values, onChange, title, slug, excerpt, content, words, hasCover, coverAlt, brokenLinks }: Props) {
  const info = inspect(content)
  const shownTitle = values.seoTitle.trim() || title.trim() || 'Post title'
  const shownDesc = values.seoDescription.trim() || excerpt.trim() || info.firstParagraph.slice(0, 160) || 'Add a meta description so Google shows a good summary.'
  const kw = values.focusKeyword.trim()

  const checks: { ok: boolean | null; label: string }[] = [
    { ok: kw ? has(shownTitle, kw) : null, label: 'Focus keyword in the SEO title' },
    { ok: kw ? has(slug.replace(/-/g, ' '), kw) : null, label: 'Focus keyword in the URL' },
    { ok: kw ? has(info.firstParagraph, kw) : null, label: 'Focus keyword in the first paragraph' },
    { ok: kw ? info.headings.some((h) => has(h, kw)) : null, label: 'Focus keyword in a heading' },
    { ok: kw ? has(shownDesc, kw) : null, label: 'Focus keyword in the description' },
    { ok: shownTitle.length >= 30 && shownTitle.length <= 60, label: 'SEO title is 30–60 characters' },
    { ok: shownDesc.length >= 70 && shownDesc.length <= 160, label: 'Description is 70–160 characters' },
    { ok: words >= 300, label: `At least 300 words (${words} now)` },
    { ok: info.headings.length > 0, label: 'Split into sections with H2 headings' },
    { ok: info.internal > 0, label: 'Links to at least one product, category or post' },
    { ok: !hasCover || !!coverAlt.trim(), label: 'Cover image has alt text' },
    { ok: brokenLinks === 0, label: brokenLinks ? `${brokenLinks} broken internal link${brokenLinks === 1 ? '' : 's'}` : 'No broken internal links' },
  ]
  const passed = checks.filter((c) => c.ok === true).length
  const counted = checks.filter((c) => c.ok !== null).length

  return (
    <div className="space-y-4">
      {/* Google preview */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Google preview</p>
        <p className="mt-2 truncate text-xs text-gray-600">
          {STOREFRONT_URL.replace(/^https?:\/\//, '')} › journal › {slug || 'your-post-url'}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[17px] leading-snug text-[#1a0dab]">{shownTitle} | Shreeni Journal</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-gray-600">{shownDesc}</p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="seo-title" className="text-sm font-medium text-gray-700">
            SEO title
          </label>
          <Counter value={values.seoTitle.trim().length} ideal={[30, 60]} max={70} />
        </div>
        <Input id="seo-title" placeholder={title || 'Defaults to the post title'} value={values.seoTitle} maxLength={70} onChange={(e) => onChange({ seoTitle: e.target.value })} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="seo-desc" className="text-sm font-medium text-gray-700">
            Meta description
          </label>
          <Counter value={values.seoDescription.trim().length} ideal={[70, 160]} max={170} />
        </div>
        <Textarea
          id="seo-desc"
          rows={3}
          placeholder="Defaults to the excerpt, then the first paragraph"
          value={values.seoDescription}
          maxLength={170}
          onChange={(e) => onChange({ seoDescription: e.target.value })}
        />
      </div>

      <Input
        id="seo-keyword"
        label="Focus keyword"
        placeholder="e.g. baluchori saree care"
        value={values.focusKeyword}
        maxLength={80}
        onChange={(e) => onChange({ focusKeyword: e.target.value })}
        hint="The main phrase people would search to find this post."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-700">
          SEO checklist
          <span className={cn('tabular-nums', passed === counted ? 'text-green-700' : 'text-gray-500')}>
            {passed}/{counted}
          </span>
        </p>
        <ul className="space-y-1.5 text-xs">
          {checks.map((c) => (
            <li key={c.label} className={cn('flex items-start gap-2', c.ok === null ? 'text-gray-400' : c.ok ? 'text-gray-700' : 'text-gray-700')}>
              {c.ok === null ? (
                <Circle className="mt-px h-3.5 w-3.5 shrink-0" />
              ) : c.ok ? (
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-green-600" />
              ) : (
                <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" />
              )}
              {c.label}
            </li>
          ))}
        </ul>
        {!kw && <p className="mt-2 text-[11px] text-gray-400">Add a focus keyword to see the keyword checks.</p>}
      </div>

      <details className="rounded-lg border border-gray-200 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-gray-700">Advanced</summary>
        <div className="mt-3 space-y-3">
          <Switch checked={values.noindex} onChange={(on) => onChange({ noindex: on })} label="Hide from search engines (noindex)" />
          <Input
            id="seo-canonical"
            label="Canonical URL (optional)"
            placeholder="Only if this article first appeared on another site"
            value={values.canonicalUrl}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
          />
        </div>
      </details>
    </div>
  )
}
