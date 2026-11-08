import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { navItems, type NavItem } from './sidebarNav'
import { useOpenSupportCount } from '../../pages/support/supportEvents'
import { useOrdersToFulfil } from '../../pages/orders/orderEvents'

const APP_VERSION = '0.0.1'

function isGroupActive(item: NavItem, pathname: string) {
  return item.children?.some((c) => pathname.startsWith(c.to)) ?? false
}

function SidebarGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon
  const active = isGroupActive(item, pathname)
  const [open, setOpen] = useState(active)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Smoothly animated sub-items */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <ul className="mt-1 space-y-1 pl-4">
            {item.children!.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg py-2 pl-5 pr-3 text-sm transition-colors',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                    )
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const badges: Record<NonNullable<NavItem['badge']>, number> = {
    supportOpen: useOpenSupportCount(),
    ordersToFulfil: useOrdersToFulfil(),
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
          S
        </div>
        <span className="text-base font-bold text-gray-900">Shreeni</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) =>
          item.children ? (
            <SidebarGroup key={item.label} item={item} pathname={pathname} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && badges[item.badge] > 0 && (
                <span
                  className="min-w-5 rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white"
                  aria-label={`${badges[item.badge]} waiting`}
                >
                  {badges[item.badge] > 99 ? '99+' : badges[item.badge]}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      {/* Version */}
      <div className="border-t border-gray-200 px-5 py-3">
        <span className="text-xs text-gray-400">v{APP_VERSION}</span>
      </div>
    </aside>
  )
}
