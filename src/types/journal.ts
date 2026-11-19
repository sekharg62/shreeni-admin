/** The Journal (blog) as the admin API returns it. */

export type JournalState = 'draft' | 'scheduled' | 'published' | 'archived'
export type JournalStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** Tiptap JSON document. */
export type JournalDoc = { type: 'doc'; content?: unknown[] }

export interface JournalPostListItem {
  id: string
  slug: string
  title: string
  status: JournalStatus
  state: JournalState
  publishedAt: string | null
  updatedAt: string
  coverImageUrl: string | null
  isFeatured: boolean
  wordCount: number
  author: { id: string; name: string } | null
  category: { id: string; name: string } | null
}

export interface JournalPostPage {
  data: JournalPostListItem[]
  meta: { page: number; limit: number; total: number; totalPages: number }
  counts: Record<'all' | JournalState, number>
}

export interface JournalLinkOut {
  kind: 'INTERNAL' | 'EXTERNAL'
  targetType: 'PRODUCT' | 'CATEGORY' | 'POST' | 'PAGE' | 'URL'
  targetId: string | null
  href: string
  anchorText: string
  rel: string | null
  newTab: boolean
  /** Internal target removed or not public: hidden from readers until fixed. */
  broken: boolean
}

export interface JournalPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: JournalDoc
  headings: { id: string; text: string; level: 2 | 3 }[]
  wordCount: number
  readingMinutes: number
  coverImageUrl: string | null
  coverAlt: string | null
  status: JournalStatus
  state: JournalState
  publishedAt: string | null
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
  focusKeyword: string | null
  canonicalUrl: string | null
  ogImageUrl: string | null
  noindex: boolean
  authorId: string | null
  categoryId: string | null
  createdAt: string
  updatedAt: string
  author: { id: string; name: string } | null
  category: { id: string; name: string } | null
  tags: string[]
  products: { id: string; name: string; status: string; imageUrl: string | null }[]
  linksOut: JournalLinkOut[]
  linkedFrom: { id: string; title: string; slug: string; state: JournalState; anchorText: string }[]
  oldSlugs: string[]
}

export type JournalPostPayload = Partial<{
  title: string
  slug: string
  excerpt: string | null
  content: JournalDoc
  coverImageUrl: string | null
  coverAlt: string | null
  status: JournalStatus
  publishedAt: string | null
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
  focusKeyword: string | null
  canonicalUrl: string | null
  ogImageUrl: string | null
  noindex: boolean
  authorId: string | null
  categoryId: string | null
  tags: string[]
  productIds: string[]
}>

export interface LinkTarget {
  type: 'PRODUCT' | 'CATEGORY' | 'POST'
  id: string
  title: string
  path: string
  live: boolean
}

export interface JournalCategory {
  id: string
  name: string
  slug: string
  description: string | null
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  _count: { posts: number }
}

export interface JournalAuthor {
  id: string
  name: string
  slug: string
  role: string | null
  bio: string | null
  avatarUrl: string | null
  socialLinks: Record<string, string> | null
  _count: { posts: number }
}
