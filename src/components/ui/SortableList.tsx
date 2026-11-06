import { useEffect, useState, type ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '../../lib/cn'

type SortableListProps<T> = {
  items: T[]
  getId: (item: T) => string
  /**
   * Called with the new order after a drop. The list updates immediately;
   * if this rejects (save failed), the list snaps back to the previous order.
   */
  onReorder: (items: T[]) => Promise<unknown> | void
  /** `handle` is the drag grip — place it anywhere inside your item. */
  renderItem: (item: T, handle: ReactNode, index: number) => ReactNode
  /** 'list' = vertical rows, 'grid' = cards that wrap. */
  layout?: 'list' | 'grid'
  /** Tailwind classes for the grid/list container. */
  className?: string
  disabled?: boolean
}

/**
 * Drag-to-reorder for rows or cards (product images, banners, specifications…).
 * Mouse, touch and keyboard (focus the handle → Space → arrows → Space) are supported.
 */
export default function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  layout = 'list',
  className,
  disabled = false,
}: SortableListProps<T>) {
  const [order, setOrder] = useState(items)
  useEffect(() => setOrder(items), [items])

  const sensors = useSensors(
    // Small movement threshold so clicks on buttons inside items still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = order.findIndex((i) => getId(i) === active.id)
    const to = order.findIndex((i) => getId(i) === over.id)
    if (from < 0 || to < 0) return
    const previous = order
    const next = arrayMove(order, from, to)
    setOrder(next) // optimistic
    try {
      await onReorder(next)
    } catch {
      setOrder(previous) // roll back if the save failed
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={order.map(getId)}
        strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={cn(layout === 'grid' ? 'grid gap-4' : 'flex flex-col gap-2', className)}>
          {order.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)} disabled={disabled}>
              {(handle) => renderItem(item, handle, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({
  id,
  disabled,
  children,
}: {
  id: string
  disabled: boolean
  children: (handle: ReactNode) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
      data-testid="drag-handle"
      className={cn(
        'flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30 active:cursor-grabbing',
        disabled && 'invisible',
      )}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-80 shadow-lg')}
      data-sortable-id={id}
    >
      {children(handle)}
    </div>
  )
}
