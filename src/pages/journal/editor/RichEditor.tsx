import { useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react'
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { JournalDoc } from '../../../types/journal'
import { journalExtensions } from './extensions'
import LinkDialog from './LinkDialog'
import ImageDialog from './ImageDialog'

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the text selection
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30',
        active && 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-gray-200" />

function Toolbar({ editor, onLink, onImage }: { editor: Editor; onLink: () => void; onImage: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      p: e.isActive('paragraph'),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      image: e.isActive('image'),
      table: e.isActive('table'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const c = () => editor.chain().focus()

  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-gray-200 bg-white/95 px-2 py-1.5 backdrop-blur">
      <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolButton>
      <Sep />
      <ToolButton label="Section heading (H2)" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Sub-heading (H3)" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Paragraph" active={s.p && !s.h2 && !s.h3} onClick={() => c().setParagraph().run()}>
        <Pilcrow className="h-4 w-4" />
      </ToolButton>
      <Sep />
      <ToolButton label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <Sep />
      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => c().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolButton>
      <Sep />
      <ToolButton label={s.link ? 'Edit link' : 'Add link (internal or external)'} active={s.link} onClick={onLink}>
        <Link2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={s.image ? 'Edit image alt text / caption' : 'Add image'} active={s.image} onClick={onImage}>
        <ImagePlus className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Insert table" active={s.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon className="h-4 w-4" />
      </ToolButton>
      {s.table && (
        <>
          <Sep />
          <ToolButton label="Add row below" onClick={() => c().addRowAfter().run()}>
            <Rows3 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Add column to the right" onClick={() => c().addColumnAfter().run()}>
            <Columns3 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Delete row" onClick={() => c().deleteRow().run()}>
            <span className="text-[10px] font-bold">−R</span>
          </ToolButton>
          <ToolButton label="Delete column" onClick={() => c().deleteColumn().run()}>
            <span className="text-[10px] font-bold">−C</span>
          </ToolButton>
          <ToolButton label="Delete table" onClick={() => c().deleteTable().run()}>
            <Trash2 className="h-4 w-4" />
          </ToolButton>
        </>
      )}
    </div>
  )
}

type Props = {
  value: JournalDoc
  onChange: (doc: JournalDoc) => void
  /** Words, for the SEO panel. */
  onStats?: (stats: { words: number }) => void
}

/** The Journal's rich-text editor. Keyboard: Ctrl+B/I/U, Ctrl+K for a link. */
export default function RichEditor({ value, onChange, onStats }: Props) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  const editor = useEditor({
    extensions: journalExtensions,
    content: value as JSONContent,
    editorProps: {
      attributes: { class: 'px-6 py-5 sm:px-10 sm:py-8', spellcheck: 'true' },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          setLinkOpen(true)
          return true
        }
        return false
      },
    },
    onCreate: ({ editor: e }) => onStats?.({ words: e.storage.characterCount.words() }),
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON() as JournalDoc)
      onStats?.({ words: e.storage.characterCount.words() })
    },
  })

  if (!editor) return <div className="h-[560px] animate-pulse rounded-xl border border-gray-200 bg-white" />

  return (
    <div className="journal-editor rounded-xl border border-gray-200 bg-white shadow-sm">
      <Toolbar editor={editor} onLink={() => setLinkOpen(true)} onImage={() => setImageOpen(true)} />
      <EditorContent editor={editor} />
      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
      <ImageDialog editor={editor} open={imageOpen} onClose={() => setImageOpen(false)} />
    </div>
  )
}
