import type { LucideIcon } from 'lucide-react'
import {
  Blocks,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'

export type NavChild = { label: string; to: string }

export type NavItem = {
  label: string
  icon: LucideIcon
  to?: string
  children?: NavChild[]
}

// Single source of truth for the sidebar — add items/children here.
export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
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
    ],
  },
  { label: 'Reviews', icon: MessageSquareText, to: '/reviews' },
  { label: 'Orders', icon: ShoppingCart, to: '/orders' },
  { label: 'Customers', icon: Users, to: '/customers' },
  { label: 'Components', icon: Blocks, to: '/components' },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'General', to: '/settings' },
      { label: 'Profile', to: '/settings/profile' },
    ],
  },
]
