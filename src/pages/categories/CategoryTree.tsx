import type { ReactNode } from 'react'
import { ChevronRight, FolderTree, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import SortableList from '../../components/ui/SortableList'
import IconButton from '../../components/ui/IconButton'
import { CatalogStatusBadge } from '../../components/ui/StatusBadge'
import { GENDER_LABELS } from '../../constants/enums'
import { cn } from '../../lib/cn'
import type { CategoryTreeNode } from '../../types/models'

type TreeProps = {
  nodes: CategoryTreeNode[]
  depth?: number
  collapsed: Set<string>
  onToggle: (id: string) => void
  /** Drag disabled (e.g. while a search/filter is active). */
  dragDisabled: boolean
  onReorder: (siblings: CategoryTreeNode[]) => Promise<unknown>
  onEdit: (node: CategoryTreeNode) => void
  onAddChild: (node: CategoryTreeNode) => void
  onDelete: (node: CategoryTreeNode) => void
}

/**
 * Category tree. Each level is its own sortable list, so a category can only be
 * dragged among its siblings (same parent). Moving it to another parent is
 * done from the form's "Parent category" field.
 */
export default function CategoryTree(props: TreeProps) {
  const { nodes, depth = 0, dragDisabled, onReorder } = props
  return (
    <SortableList
      items={nodes}
      getId={(n) => n.id}
      onReorder={onReorder}
      disabled={dragDisabled || nodes.length < 2}
      className="gap-1.5"
      renderItem={(node, handle) => <TreeRow node={node} handle={handle} depth={depth} {...props} />}
    />
  )
}

function TreeRow({
  node,
  handle,
  depth,
  collapsed,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
  ...rest
}: TreeProps & { node: CategoryTreeNode; handle: ReactNode; depth: number }) {
  const hasChildren = node.children.length > 0
  const isOpen = !collapsed.has(node.id)
  const thumb = node.posterUrl ?? node.bannerUrl

  return (
    <div data-testid={`category-${node.slug}`}>
      <div
        className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-2 transition-shadow hover:shadow-sm"
        onDoubleClick={() => onEdit(node)}
      >
        {handle}
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
          aria-expanded={hasChildren ? isOpen : undefined}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100',
            !hasChildren && 'invisible',
          )}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <ImageOff className="h-4 w-4 text-gray-300" />
          )}
        </div>

        <button type="button" onClick={() => onEdit(node)} className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium text-gray-900">{node.name}</p>
          <p className="truncate text-xs text-gray-500">/{node.slug}</p>
        </button>

        <div className="hidden items-center gap-4 text-xs text-gray-500 md:flex">
          {node.gender && <span className="rounded-md bg-gray-100 px-2 py-0.5">{GENDER_LABELS[node.gender]}</span>}
          <span className="w-20 text-right" title="Products directly in this category">
            {node.productCount} product{node.productCount === 1 ? '' : 's'}
          </span>
          {hasChildren && (
            <span className="inline-flex w-14 items-center gap-1" title="Sub-categories">
              <FolderTree className="h-3.5 w-3.5" /> {node.children.length}
            </span>
          )}
        </div>
        <div className="w-24 text-right">
          <CatalogStatusBadge status={node.status} />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton icon={Plus} label="Add sub-category" onClick={() => onAddChild(node)} />
          <IconButton icon={Pencil} label="Edit" onClick={() => onEdit(node)} />
          <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => onDelete(node)} />
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="ml-7 mt-1.5 border-l-2 border-dashed border-gray-200 pl-4">
          <CategoryTree
            {...rest}
            nodes={node.children}
            depth={depth + 1}
            collapsed={collapsed}
            onToggle={onToggle}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  )
}
