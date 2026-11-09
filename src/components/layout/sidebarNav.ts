import type { LucideIcon } from 'lucide-react'
import {
  Blocks,
  Headphones,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react'

export type NavChild = { label: string; to: string }

export type NavItem = {
  label: string
  icon: LucideIcon
  to?: string
  children?: NavChild[]
  /** Live count pill next to the label. */
  badge?: 'supportOpen' | 'ordersToFulfil'
}

// Single source of truth for the sidebar — add items/children here.
export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Orders', icon: ShoppingCart, to: '/orders', badge: 'ordersToFulfil' },
  {
    label: 'Catalog',
    icon: Package,
    children: [
      { label: 'Products', to: '/products' },
      { label: 'Categories', to: '/categories' },
      { label: 'Collections', to: '/collections' },
      { label: 'Tags', to: '/tags' },
      { label: 'Colors', to: '/colors' },
    ],
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { label: 'Discounts', to: '/discounts' },
      { label: 'Banners', to: '/banners' },
      { label: 'Homepage picks', to: '/home-picks' },
    ],
  },
  { label: 'Reviews', icon: MessageSquareText, to: '/reviews' },
  { label: 'Support', icon: Headphones, to: '/support', badge: 'supportOpen' },
  { label: 'Customers', icon: Users, to: '/customers' },
  // Developer component showcase: development builds only.
  ...(import.meta.env.DEV ? [{ label: 'Components (dev)', icon: Blocks, to: '/components' }] : []),
]
