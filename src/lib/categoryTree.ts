import type { CategoryTreeNode } from '../types/models'

/** Find a node anywhere in the tree. */
export function findNode(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const hit = findNode(n.children, id)
    if (hit) return hit
  }
  return undefined
}

/** Ids of a node and everything below it (a category can't move under these). */
export function subtreeIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([node.id])
  const walk = (n: CategoryTreeNode) => n.children.forEach((c) => (ids.add(c.id), walk(c)))
  walk(node)
  return ids
}

/** Flat list with breadcrumb paths: "Silk / Baluchori" — for parent pickers. */
export function flattenWithPaths(
  nodes: CategoryTreeNode[],
  prefix = '',
): { id: string; path: string; node: CategoryTreeNode }[] {
  return nodes.flatMap((n) => {
    const path = prefix ? `${prefix} / ${n.name}` : n.name
    return [{ id: n.id, path, node: n }, ...flattenWithPaths(n.children, path)]
  })
}

/** Total number of categories in the tree. */
export function countNodes(nodes: CategoryTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0)
}

/**
 * Keep nodes that match, plus their ancestors (so the match is shown in context).
 * Children of a match are kept only if they match too.
 */
export function filterTree(
  nodes: CategoryTreeNode[],
  match: (n: CategoryTreeNode) => boolean,
): CategoryTreeNode[] {
  return nodes.flatMap((n) => {
    const children = filterTree(n.children, match)
    if (match(n) || children.length > 0) return [{ ...n, children }]
    return []
  })
}

/** Children of `parentId` (null = top level). */
export function siblingsOf(nodes: CategoryTreeNode[], parentId: string | null): CategoryTreeNode[] {
  if (!parentId) return nodes
  return findNode(nodes, parentId)?.children ?? []
}
