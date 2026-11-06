import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, FolderTree, Info, Plus, Search, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ChipFilter from '../../components/ui/ChipFilter'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton from '../../components/ui/Skeleton'
import CategoryTree from './CategoryTree'
import CategoryFormDrawer from './CategoryFormDrawer'
import { useApi } from '../../hooks/useApi'
import { useUrlState } from '../../hooks/useUrlState'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { categoryService, getApiErrorMessage } from '../../services'
import { CATALOG_STATUS_OPTIONS } from '../../constants/enums'
import { countNodes, filterTree, flattenWithPaths } from '../../lib/categoryTree'
import type { CategoryTreeNode } from '../../types/models'

export default function CategoriesPage() {
  const { data: tree, loading, error, refetch, setData } = useApi(() => categoryService.tree(), [])
  const [url, setUrl] = useUrlState({ search: '', status: '' })
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [drawer, setDrawer] = useState<{ open: boolean; id: string | null; parentId: string | null }>({
    open: false,
    id: null,
    parentId: null,
  })
  const confirm = useConfirm()
  const toast = useToast()

  const filtering = Boolean(url.search || url.status)
  const visible = useMemo(() => {
    if (!tree) return []
    if (!filtering) return tree
    const q = url.search.trim().toLowerCase()
    return filterTree(
      tree,
      (n) =>
        (!q || n.name.toLowerCase().includes(q) || n.slug.includes(q)) && (!url.status || n.status === url.status),
    )
  }, [tree, url.search, url.status, filtering])

  const allIds = useMemo(() => flattenWithPaths(tree ?? []).map((c) => c.id), [tree])
  const total = tree ? countNodes(tree) : 0

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const reorder = async (siblings: CategoryTreeNode[]) => {
    try {
      const fresh = await categoryService.reorder(siblings.map((s) => s.id))
      setData(fresh)
      toast.success('Order saved')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err // SortableList rolls the rows back
    }
  }

  const remove = async (node: CategoryTreeNode) => {
    if (node.children.length || node.productCount) {
      const parts = [
        node.productCount && `${node.productCount} product${node.productCount === 1 ? '' : 's'}`,
        node.children.length && `${node.children.length} sub-categor${node.children.length === 1 ? 'y' : 'ies'}`,
      ].filter(Boolean)
      toast.error(`“${node.name}” still has ${parts.join(' and ')}. Move them first, or set it to Discontinued.`)
      return
    }
    const ok = await confirm({
      title: `Delete "${node.name}"?`,
      message: "This can't be undone. Its banner and poster images are deleted too.",
      danger: true,
    })
    if (!ok) return
    try {
      await categoryService.remove(node.id)
      toast.success('Category deleted')
      await refetch()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const openCreate = (parentId: string | null = null) => setDrawer({ open: true, id: null, parentId })

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The store menu: weaves like Jamdani or Baluchori, and their sub-categories."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Categories' }]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>
            New category
          </Button>
        }
      />

      {tree && tree.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="w-full lg:max-w-xs">
            <Input
              aria-label="Search"
              placeholder="Search categories…"
              value={url.search}
              onChange={(e) => setUrl({ search: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <ChipFilter
            single
            options={CATALOG_STATUS_OPTIONS}
            value={url.status ? [url.status] : []}
            onChange={(v) => setUrl({ status: v[0] ?? '' })}
          />
          <div className="flex items-center gap-1 lg:ml-auto">
            {filtering && (
              <button
                type="button"
                onClick={() => setUrl({ search: '', status: '' })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <Button variant="ghost" size="sm" leftIcon={<ChevronsUpDown className="h-4 w-4" />} onClick={() => setCollapsed(new Set())}>
              Expand all
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<ChevronsDownUp className="h-4 w-4" />} onClick={() => setCollapsed(new Set(allIds))}>
              Collapse all
            </Button>
          </div>
        </div>
      )}

      {tree && tree.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-500" data-testid="tree-hint">
          <Info className="h-3.5 w-3.5" />
          {filtering
            ? 'Clear the search and filter to drag categories into a new order.'
            : `${total} categor${total === 1 ? 'y' : 'ies'} · drag the handle to reorder within the same level · use “Parent category” in the form to move one elsewhere.`}
        </p>
      )}

      {error ? (
        <ErrorBox message={error} onRetry={refetch} />
      ) : loading && !tree ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : tree && tree.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Start with your main weaves — Jamdani, Baluchori, Tant — then add sub-categories inside them."
          icon={FolderTree}
          action={<Button onClick={() => openCreate()}>Create your first category</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No categories match" description="Try a different search or status." icon={FolderTree} />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <CategoryTree
            nodes={visible}
            collapsed={filtering ? new Set() : collapsed}
            onToggle={toggle}
            dragDisabled={filtering}
            onReorder={reorder}
            onEdit={(n) => setDrawer({ open: true, id: n.id, parentId: null })}
            onAddChild={(n) => {
              setCollapsed((prev) => {
                const next = new Set(prev)
                next.delete(n.id)
                return next
              })
              openCreate(n.id)
            }}
            onDelete={(n) => void remove(n)}
          />
        </div>
      )}

      <CategoryFormDrawer
        open={drawer.open}
        editingId={drawer.id}
        defaultParentId={drawer.parentId}
        tree={tree ?? []}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
        onSaved={() => {
          setDrawer((d) => ({ ...d, open: false }))
          void refetch()
        }}
      />
    </div>
  )
}
