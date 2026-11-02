import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type TabItem = {
  label: string
  value: string
  icon?: ReactNode
}

type TabsProps = {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
}

export default function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-gray-200"
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800',
            )}
          >
            {tab.icon}
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-900" />
            )}
          </button>
        )
      })}
    </div>
  )
}
