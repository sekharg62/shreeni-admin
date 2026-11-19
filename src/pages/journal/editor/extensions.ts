import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import type { JournalDoc } from '../../../types/journal'

/** A new post starts with one empty paragraph. */
export const EMPTY_DOC: JournalDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

/**
 * Links remember what they point at: internal links store the target's type + id
 * (so the storefront always uses its CURRENT URL), external ones their rel and new-tab choice.
 */
export const JournalLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      internalType: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-internal-type'),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.internalType ? { 'data-internal-type': attrs.internalType } : {}),
      },
      internalId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-internal-id'),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.internalId ? { 'data-internal-id': attrs.internalId } : {}),
      },
    }
  },
}).configure({
  openOnClick: false,
  autolink: false,
  linkOnPaste: true,
  // rel / target are set per link by the link dialog, never by default.
  HTMLAttributes: { rel: null, target: null },
  protocols: ['mailto', 'tel'],
})

/** Everything the Journal editor supports (the backend renders exactly these). */
export const journalExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
  JournalLink,
  Image,
  TableKit.configure({ table: { resizable: false } }),
  Placeholder.configure({ placeholder: 'Start writing your story… Use H2 for sections: they become the table of contents.' }),
  CharacterCount,
]
